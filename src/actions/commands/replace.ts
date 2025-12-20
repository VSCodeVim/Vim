import { Position, Range } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { PositionDiff, sorted } from '../../common/motion/position';
import { DotCommandStatus, Mode, visualBlockGetTopLeftPosition } from '../../mode/mode';
import { ModeDataFor } from '../../mode/modeData';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import { BaseCommand, RegisterAction } from '../base';
import { BaseMovement } from '../baseMotion';
import { MoveDown, MoveLeft, MoveRight, MoveUp } from '../motion';

@RegisterAction
export class ReplaceCharacter extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['r', '<character>'];
  override createsUndoPoint = true;
  override runsOnceForEachCountPrefix = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const timesToRepeat = vimState.recordedState.count || 1;
    const toReplace = this.keysPressed[1];

    /**
     * <character> includes <BS>, <S-BS> and <TAB> but not any control keys,
     * so we ignore the former two keys and have a special handle for <tab>.
     */

    if (['<BS>', '<S-BS>'].includes(toReplace.toUpperCase())) {
      return;
    }

    if (position.character + timesToRepeat > position.getLineEnd().character) {
      return;
    }

    let endPos = new Position(position.line, position.character + timesToRepeat);

    // Return if tried to repeat longer than linelength
    if (endPos.character > vimState.document.lineAt(endPos).text.length) {
      return;
    }

    // If last char (not EOL char), add 1 so that replace selection is complete
    if (endPos.character > vimState.document.lineAt(endPos).text.length) {
      endPos = new Position(endPos.line, endPos.character + 1);
    }

    if (toReplace === '<tab>') {
      vimState.recordedState.transformer.delete(new Range(position, endPos));
      vimState.recordedState.transformer.vscodeCommand('tab');
      vimState.recordedState.transformer.moveCursor(
        PositionDiff.offset({ character: -1 }),
        this.multicursorIndex,
      );
    } else if (toReplace === '\n') {
      // A newline replacement always inserts exactly one newline (regardless
      // of count prefix) and puts the cursor on the next line.
      // We use `insertTextVSCode` so we get the right indentation
      vimState.recordedState.transformer.delete(new Range(position, endPos));
      vimState.recordedState.transformer.addTransformation({
        type: 'insertTextVSCode',
        text: '\n',
      });
    } else {
      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: toReplace.repeat(timesToRepeat),
        range: new Range(position, endPos),
        diff: PositionDiff.offset({ character: timesToRepeat - 1 }),
        manuallySetCursorPositions:
          vimState.dotCommandStatus === DotCommandStatus.Executing ? true : undefined,
      });
    }
  }
}

@RegisterAction
class ReplaceCharacterVisual extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['r', '<character>'];
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    let toInsert = this.keysPressed[1];

    if (toInsert === '<tab>') {
      toInsert = TextEditor.getTabCharacter(vimState.editor);
    }

    let visualSelectionOffset = 1;

    // If selection is reversed, reorganize it so that the text replace logic always works
    let [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    if (vimState.currentMode === Mode.VisualLine) {
      [start, end] = [start.getLineBegin(), end.getLineEnd()];
    }

    // Limit to not replace EOL
    const textLength = vimState.document.lineAt(end).text.length;
    if (textLength <= 0) {
      visualSelectionOffset = 0;
    }
    end = new Position(end.line, Math.min(end.character, textLength > 0 ? textLength - 1 : 0));

    // Iterate over every line in the current selection
    for (let lineNum = start.line; lineNum <= end.line; lineNum++) {
      // Get line of text
      const lineText = vimState.document.lineAt(lineNum).text;

      if (start.line === end.line) {
        // This is a visual section all on one line, only replace the part within the selection
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: Array(end.character - start.character + 2).join(toInsert),
          range: new Range(start, new Position(end.line, end.character + 1)),
          manuallySetCursorPositions: true,
        });
      } else if (lineNum === start.line) {
        // This is the first line of the selection so only replace after the cursor
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: Array(lineText.length - start.character + 1).join(toInsert),
          range: new Range(start, new Position(start.line, lineText.length)),
          manuallySetCursorPositions: true,
        });
      } else if (lineNum === end.line) {
        // This is the last line of the selection so only replace before the cursor
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: Array(end.character + 1 + visualSelectionOffset).join(toInsert),
          range: new Range(
            new Position(end.line, 0),
            new Position(end.line, end.character + visualSelectionOffset),
          ),
          manuallySetCursorPositions: true,
        });
      } else {
        // Replace the entire line length since it is in the middle of the selection
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: Array(lineText.length + 1).join(toInsert),
          range: new Range(new Position(lineNum, 0), new Position(lineNum, lineText.length)),
          manuallySetCursorPositions: true,
        });
      }
    }

    vimState.cursorStopPosition = start;
    vimState.cursorStartPosition = start;
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class ReplaceCharacterVisualBlock extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['r', '<character>'];
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    let toInsert = this.keysPressed[1];

    if (toInsert === '<tab>') {
      toInsert = TextEditor.getTabCharacter(vimState.editor);
    }

    for (const { start, end } of TextEditor.iterateLinesInBlock(vimState)) {
      if (end.isBeforeOrEqual(start)) {
        continue;
      }

      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: Array(end.character - start.character + 1).join(toInsert),
        range: new Range(start, end),
        manuallySetCursorPositions: true,
      });
    }

    vimState.cursors = [
      Cursor.atPosition(
        visualBlockGetTopLeftPosition(vimState.cursorStopPosition, vimState.cursorStartPosition),
      ),
    ];
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
export class EnterReplaceMode extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['R'];

  public override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Replace);
  }
}

@RegisterAction
class ExitReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.modeData.mode !== Mode.Replace) {
      throw new Error(`Unexpected mode ${vimState.modeData.mode} in ExitReplaceMode`);
    }

    const timesToRepeat = vimState.modeData.replaceState.timesToRepeat;

    const cursorIdx = this.multicursorIndex ?? 0;
    const changes = vimState.modeData.replaceState.getChanges(cursorIdx);

    // `3Rabc` results in 'abc' replacing the next characters 2 more times
    if (changes && timesToRepeat > 1) {
      const newText = changes
        .map((change) => change.after)
        .join('')
        .repeat(timesToRepeat - 1);
      vimState.recordedState.transformer.replace(
        new Range(position, position.getRight(newText.length)),
        newText,
      );
    } else {
      vimState.cursorStopPosition = vimState.cursorStopPosition.getLeft();
    }

    if (this.multicursorIndex === vimState.cursors.length - 1) {
      await vimState.setCurrentMode(Mode.Normal);
    }
  }
}

@RegisterAction
class ReplaceModeToInsertMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<Insert>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
  }
}

@RegisterAction
class BackspaceInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = [['<BS>'], ['<S-BS>'], ['<C-BS>'], ['<C-h>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.modeData.mode !== Mode.Replace) {
      throw new Error(`Unexpected mode ${vimState.modeData.mode} in BackspaceInReplaceMode`);
    }

    const cursorIdx = this.multicursorIndex ?? 0;
    const changes = vimState.modeData.replaceState.getChanges(cursorIdx);

    if (changes.length === 0) {
      // If you backspace before the beginning of where you started to replace, just move the cursor back.
      const newPosition = position.getLeftThroughLineBreaks();

      vimState.modeData.replaceState.resetChanges(cursorIdx);

      vimState.cursorStopPosition = newPosition;
      vimState.cursorStartPosition = newPosition;
    } else {
      const { before } = changes.pop()!;
      if (before === '') {
        // We've gone beyond the originally existing text; just backspace.
        // TODO: should this use a 'deleteLeft' transformation?
        vimState.recordedState.transformer.delete(
          new Range(position.getLeftThroughLineBreaks(), position),
        );
      } else {
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: before,
          range: new Range(position.getLeft(), position),
          diff: PositionDiff.offset({ character: -1 }),
        });
      }
    }
  }
}

@RegisterAction
class DeleteInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<Del>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.vscodeCommand('deleteRight');
  }
}

@RegisterAction
class ReplaceInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<character>'];
  override createsUndoPoint = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.modeData.mode !== Mode.Replace) {
      throw new Error(`Unexpected mode ${vimState.modeData.mode} in ReplaceInReplaceMode`);
    }

    const char = this.keysPressed[0];
    const isNewLineOrTab = char === '\n' || char === '<tab>';

    const replaceRange = new Range(position, position.getRight());

    let before = vimState.document.getText(replaceRange);
    if (!position.isLineEnd(vimState.document) && !isNewLineOrTab) {
      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: char,
        range: replaceRange,
        diff: PositionDiff.offset({ character: 1 }),
      });
    } else if (char === '<tab>') {
      vimState.recordedState.transformer.delete(replaceRange);
      vimState.recordedState.transformer.vscodeCommand('tab');
    } else {
      vimState.recordedState.transformer.insert(position, char);
      before = '';
    }

    vimState.modeData.replaceState.getChanges(this.multicursorIndex ?? 0).push({
      before,
      after: char,
    });
  }
}

@RegisterAction
class CreateUndoPoint extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<C-g>', 'u'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.historyTracker.addChange(true);
    vimState.historyTracker.finishCurrentStep();
  }
}

@RegisterAction
class ArrowsInReplaceMode extends BaseMovement {
  override modes = [Mode.Replace];
  keys = [['<up>'], ['<down>'], ['<left>'], ['<right>']];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    // Force an undo point to be created
    vimState.historyTracker.addChange(true);
    vimState.historyTracker.finishCurrentStep();

    let newPosition: Position = position;
    switch (this.keysPressed[0]) {
      case '<up>':
        newPosition = await new MoveUp(this.keysPressed).execAction(position, vimState);
        break;
      case '<down>':
        newPosition = await new MoveDown(this.keysPressed).execAction(position, vimState);
        break;
      case '<left>':
        newPosition = await new MoveLeft(this.keysPressed).execAction(position, vimState);
        break;
      case '<right>':
        newPosition = await new MoveRight(this.keysPressed).execAction(position, vimState);
        break;
      default:
        throw new Error(`Unexpected 'arrow' key: ${this.keys[0]}`);
    }
    (vimState.modeData as ModeDataFor<Mode.Replace>).replaceState.resetChanges(
      this.multicursorIndex ?? 0,
    );
    return newPosition;
  }
}
