import * as vscode from 'vscode';
import { VimState } from './../mode/modeHandler';
import { Register, RegisterMode } from './../register/register';
import { Position, PositionDiff } from './../common/motion/position';
import { Range } from './../common/motion/range';
import { ModeName } from './../mode/mode';
import { TextEditor } from './../textEditor';
import {
  BaseAction, RegisterAction, compareKeypressSequence
} from './base';

export class BaseOperator extends BaseAction {
  constructor(multicursorIndex?: number) {
    super();
    this.multicursorIndex = multicursorIndex;
  }
  canBeRepeatedWithDot = true;

  /**
   * If this is being run in multi cursor mode, the index of the cursor
   * this operator is being applied to.
   */
  multicursorIndex: number | undefined = undefined;

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) { return false; }
    if (!compareKeypressSequence(this.keys, keysPressed)) { return false; }
    if (vimState.recordedState.actionsRun.length > 0 &&
      this.mustBeFirstKey) { return false; }
    if (this instanceof BaseOperator && vimState.recordedState.operator) { return false; }

    return true;
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) { return false; }
    if (!compareKeypressSequence(this.keys.slice(0, keysPressed.length), keysPressed)) { return false; }
    if (vimState.recordedState.actionsRun.length > 0 &&
      this.mustBeFirstKey) { return false; }
    if (this instanceof BaseOperator && vimState.recordedState.operator) { return false; }

    return true;
  }

  /**
   * Run this operator on a range, returning the new location of the cursor.
   */
  run(vimState: VimState, start: Position, stop: Position): Promise<VimState> {
    throw new Error("You need to override this!");
  }
}


@RegisterAction
export class DeleteOperator extends BaseOperator {
    public keys = ["d"];
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    /**
     * Deletes from the position of start to 1 past the position of end.
     */
    public async delete(start: Position, end: Position, currentMode: ModeName,
                        registerMode: RegisterMode, vimState: VimState, yank = true): Promise<Position> {
        if (registerMode === RegisterMode.LineWise) {
          start = start.getLineBegin();
          end   = end.getLineEnd();
        }

        end = new Position(end.line, end.character + 1);

        const isOnLastLine = end.line === TextEditor.getLineCount() - 1;

        // Vim does this weird thing where it allows you to select and delete
        // the newline character, which it places 1 past the last character
        // in the line. Here we interpret a character position 1 past the end
        // as selecting the newline character. Don't allow this in visual block mode
        if (vimState.currentMode !== ModeName.VisualBlock) {
          if (end.character === TextEditor.getLineAt(end).text.length + 1) {
            end = end.getDown(0);
          }
        }

        let text = vimState.editor.document.getText(new vscode.Range(start, end));

        // If we delete linewise to the final line of the document, we expect the line
        // to be removed. This is actually a special case because the newline
        // character we've selected to delete is the newline on the end of the document,
        // but we actually delete the newline on the second to last line.

        // Just writing about this is making me more confused. -_-

        // rebornix: johnfn's description about this corner case is perfectly correct. The only catch is
        // that we definitely don't want to put the EOL in the register. So here we run the `getText`
        // expression first and then update the start position.

        // Now rebornix is confused as well.
        if (isOnLastLine &&
            start.line !== 0 &&
            registerMode === RegisterMode.LineWise) {
          start = start.getPreviousLineBegin().getLineEnd();
        }

        if (registerMode === RegisterMode.LineWise) {
          // slice final newline in linewise mode - linewise put will add it back.
          text = text.endsWith("\r\n") ? text.slice(0, -2) : (text.endsWith('\n') ? text.slice(0, -1) : text);
        }

        if (yank) {
          Register.put(text, vimState, this.multicursorIndex);
        }

        let diff = new PositionDiff(0, 0);
        let resultingPosition: Position;

        if (currentMode === ModeName.Visual) {
          resultingPosition = Position.EarlierOf(start, end);
        }

        if (start.character > TextEditor.getLineAt(start).text.length) {
          resultingPosition = start.getLeft();
          diff = new PositionDiff(0, -1);
        } else {
          resultingPosition = start;
        }

        if (registerMode === RegisterMode.LineWise) {
          resultingPosition = resultingPosition.getLineBegin();
          diff = PositionDiff.NewBOLDiff();
        }

        vimState.recordedState.transformations.push({
          type  : "deleteRange",
          range : new Range(start, end),
          diff  : diff,
        });

        return resultingPosition;
    }

    public async run(vimState: VimState, start: Position, end: Position, yank = true): Promise<VimState> {
        let newPos = await this.delete(start, end, vimState.currentMode, vimState.effectiveRegisterMode(), vimState, yank);

        vimState.currentMode = ModeName.Normal;
        if (vimState.currentMode === ModeName.Visual) {
          vimState.desiredColumn = newPos.character;
        }
        return vimState;
    }
}

@RegisterAction
export class DeleteOperatorVisual extends BaseOperator {
    public keys = ["D"];
    public modes = [ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      // ensures linewise deletion when in visual mode
      // see special case in DeleteOperator.delete()
      vimState.currentRegisterMode = RegisterMode.LineWise;

      return await new DeleteOperator(this.multicursorIndex).run(vimState, start, end);
    }
}

@RegisterAction
export class YankOperator extends BaseOperator {
    public keys = ["y"];
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
    canBeRepeatedWithDot = false;

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      // Hack to make Surround with y (which takes a motion) work.

      if (vimState.surround) {
        vimState.surround.range = new Range(start, end);
        vimState.currentMode = ModeName.SurroundInputMode;
        vimState.cursorPosition = start;
        vimState.cursorStartPosition = start;

        return vimState;
      }

      const originalMode = vimState.currentMode;

      if (start.compareTo(end) <= 0) {
        end = new Position(end.line, end.character + 1);
      } else {
        const tmp = start;
        start = end;
        end = tmp;

        end = new Position(end.line, end.character + 1);
      }

      if (vimState.currentRegisterMode === RegisterMode.LineWise) {
        start = start.getLineBegin();
        end = end.getLineEnd();
      }

      let text = TextEditor.getText(new vscode.Range(start, end));

      // If we selected the newline character, add it as well.
      if (vimState.currentMode === ModeName.Visual &&
          end.character === TextEditor.getLineAt(end).text.length + 1) {
        text = text + "\n";
      }

      Register.put(text, vimState, this.multicursorIndex);

      vimState.currentMode = ModeName.Normal;
      vimState.cursorStartPosition = start;

      if (originalMode === ModeName.Normal) {
        vimState.allCursors = vimState.cursorPositionJustBeforeAnythingHappened.map(x => new Range(x, x));
      } else {
        vimState.cursorPosition = start;
      }

      return vimState;
    }
}

@RegisterAction
export class ShiftYankOperatorVisual extends BaseOperator {
    public keys = ["Y"];
    public modes = [ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      vimState.currentRegisterMode = RegisterMode.LineWise;

      return await new YankOperator().run(vimState, start, end);

    }
}

@RegisterAction
export class DeleteOperatorXVisual extends BaseOperator {
  public keys = [["x"], ["<Del>"]];
  public modes = [ModeName.Visual, ModeName.VisualLine];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    return await new DeleteOperator(this.multicursorIndex).run(vimState, start, end);
  }
}

@RegisterAction
export class ChangeOperatorSVisual extends BaseOperator {
  public keys = ["s"];
  public modes = [ModeName.Visual, ModeName.VisualLine];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    return await new ChangeOperator().run(vimState, start, end);
  }
}

@RegisterAction
export class FormatOperator extends BaseOperator {
  public keys = ["="];
  public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    vimState.editor.selection = new vscode.Selection(start, end);
    await vscode.commands.executeCommand("editor.action.formatSelection");
    let line = vimState.cursorStartPosition.line;

    if (vimState.cursorStartPosition.isAfter(vimState.cursorPosition)) {
      line = vimState.cursorPosition.line;
    }

    let newCursorPosition = new Position(line, 0);
    vimState.cursorPosition = newCursorPosition;
    vimState.cursorStartPosition = newCursorPosition;
    vimState.currentMode = ModeName.Normal;
    return vimState;
  }
}

@RegisterAction
export class UpperCaseOperator extends BaseOperator {
    public keys = ["U"];
    public modes = [ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      const range = new vscode.Range(start, new Position(end.line, end.character + 1));
      let text = vimState.editor.document.getText(range);

      await TextEditor.replace(range, text.toUpperCase());

      vimState.currentMode = ModeName.Normal;
      vimState.cursorPosition = start;

      return vimState;
    }
}

@RegisterAction
export class UpperCaseWithMotion extends UpperCaseOperator {
  public keys = ["g", "U"];
  public modes = [ModeName.Normal];
}

@RegisterAction
export class LowerCaseOperator extends BaseOperator {
    public keys = ["u"];
    public modes = [ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      const range = new vscode.Range(start, new Position(end.line, end.character + 1));
      let text = vimState.editor.document.getText(range);

      await TextEditor.replace(range, text.toLowerCase());

      vimState.currentMode = ModeName.Normal;
      vimState.cursorPosition = start;

      return vimState;
    }
}

@RegisterAction
export class LowerCaseWithMotion extends LowerCaseOperator {
  public keys = ["g", "u"];
  public modes = [ModeName.Normal];
}


@RegisterAction
class IndentOperator extends BaseOperator {
  modes = [ModeName.Normal];
  keys = [">"];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    vimState.editor.selection = new vscode.Selection(start.getLineBegin(), end.getLineEnd());

    await vscode.commands.executeCommand("editor.action.indentLines");

    vimState.currentMode = ModeName.Normal;
    vimState.cursorPosition = start.getFirstLineNonBlankChar();

    return vimState;
  }
}

/**
 * `3>` to indent a line 3 times in visual mode is actually a bit of a special case.
 *
 * > is an operator, and generally speaking, you don't run operators multiple times, you run motions multiple times.
 * e.g. `d3w` runs `w` 3 times, then runs d once.
 *
 * Same with literally every other operator motion combination... until `3>`in visual mode
 * walked into my life.
 */
@RegisterAction
class IndentOperatorInVisualModesIsAWeirdSpecialCase extends BaseOperator {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = [">"];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    for (let i = 0; i < (vimState.recordedState.count || 1); i++) {
      await vscode.commands.executeCommand("editor.action.indentLines");
    }

    vimState.currentMode = ModeName.Normal;
    vimState.cursorPosition = start.getFirstLineNonBlankChar();

    return vimState;
  }
}

@RegisterAction
class OutdentOperator extends BaseOperator {
  modes = [ModeName.Normal];
  keys = ["<"];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    vimState.editor.selection = new vscode.Selection(start, end);

    await vscode.commands.executeCommand("editor.action.outdentLines");
    vimState.currentMode = ModeName.Normal;
    vimState.cursorPosition = start.getFirstLineNonBlankChar();

    return vimState;
  }
}

/**
 * See comment for IndentOperatorInVisualModesIsAWeirdSpecialCase
 */
@RegisterAction
class OutdentOperatorInVisualModesIsAWeirdSpecialCase extends BaseOperator {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ["<"];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    for (let i = 0; i < (vimState.recordedState.count || 1); i++) {
      await vscode.commands.executeCommand("editor.action.outdentLines");
    }

    vimState.currentMode = ModeName.Normal;
    vimState.cursorPosition = start.getFirstLineNonBlankChar();

    return vimState;
  }
}


@RegisterAction
export class ChangeOperator extends BaseOperator {
  public keys = ["c"];
  public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    const isEndOfLine = end.character === end.getLineEnd().character;
    let state = vimState;
    // If we delete to EOL, the block cursor would end on the final character,
    // which means the insert cursor would be one to the left of the end of
    // the line. We do want to run delete if it is a multiline change though ex. c}
    if (Position.getLineLength(TextEditor.getLineAt(start).lineNumber) !== 0 || (end.line !== start.line)) {
      if (isEndOfLine) {
        state = await new DeleteOperator(this.multicursorIndex).run(vimState, start, end.getLeftThroughLineBreaks());
      } else {
        state = await new DeleteOperator(this.multicursorIndex).run(vimState, start, end);
      }
    }

    state.currentMode = ModeName.Insert;

    if (isEndOfLine) {
      state.cursorPosition = end.getRight();
    }

    return state;
  }
}

@RegisterAction
export class YankVisualBlockMode extends BaseOperator {
  public keys = ["y"];
  public modes = [ModeName.VisualBlock];
  canBeRepeatedWithDot = false;
  runsOnceForEveryCursor() { return false; }

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    let toCopy: string = "";

    for (const { line } of Position.IterateLine(vimState)) {
      toCopy += line + '\n';
    }

    Register.put(toCopy, vimState, this.multicursorIndex);

    vimState.currentMode = ModeName.Normal;
    vimState.cursorPosition = start;
    return vimState;
  }
}


@RegisterAction
export class ToggleCaseOperator extends BaseOperator {
  public keys = ["~"];
  public modes = [ModeName.Visual, ModeName.VisualLine];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    const range = new vscode.Range(start, end.getRight());

    await ToggleCaseOperator.toggleCase(range);

    const cursorPosition = start.isBefore(end) ? start : end;
    vimState.cursorPosition = cursorPosition;
    vimState.cursorStartPosition = cursorPosition;
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }

  static async toggleCase(range: vscode.Range) {
    const text = TextEditor.getText(range);

    let newText = "";
    for (var i = 0; i < text.length; i++) {
      var char = text[i];
      // Try lower-case
      let toggled = char.toLocaleLowerCase();
      if (toggled === char) {
        // Try upper-case
        toggled = char.toLocaleUpperCase();
      }
      newText += toggled;
    }
    await TextEditor.replace(range, newText);
  }
}

@RegisterAction
class ToggleCaseVisualBlockOperator extends BaseOperator {
  public keys = ["~"];
  public modes = [ModeName.VisualBlock];

  public async run(vimState: VimState, startPos: Position, endPos: Position): Promise<VimState> {
    for (const { start, end } of Position.IterateLine(vimState)) {
      const range = new vscode.Range(start, end);
      await ToggleCaseOperator.toggleCase(range);
    }

    const cursorPosition = startPos.isBefore(endPos) ? startPos : endPos;
    vimState.cursorPosition = cursorPosition;
    vimState.cursorStartPosition = cursorPosition;
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class ToggleCaseWithMotion extends ToggleCaseOperator {
  public keys = ["g", "~"];
  public modes = [ModeName.Normal];
}


@RegisterAction
export class CommentOperator extends BaseOperator {
  public keys = ["g", "b"];
  public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    vimState.editor.selection = new vscode.Selection(start.getLineBegin(), end.getLineEnd());
    await vscode.commands.executeCommand("editor.action.commentLine");

    vimState.cursorPosition = new Position(start.line, 0);
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
export class CommentBlockOperator extends BaseOperator {
  public keys = ["g", "B"];
  public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    const endPosition = vimState.currentMode === ModeName.Normal ? end.getRight() : end;
    vimState.editor.selection = new vscode.Selection(start, endPosition);
    await vscode.commands.executeCommand("editor.action.blockComment");

    vimState.cursorPosition = start;
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }

}