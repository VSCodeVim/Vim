import * as vscode from 'vscode';

import { ChangeOperator, DeleteOperator, YankOperator } from './operator';
import { CursorMoveByUnit, CursorMovePosition, TextEditor } from './../textEditor';
import { isVisualMode, Mode } from './../mode/mode';
import { PairMatcher } from './../common/matching/matcher';
import { QuoteMatcher } from './../common/matching/quoteMatcher';
import { RegisterAction } from './base';
import { RegisterMode } from './../register/register';
import { ReplaceState } from './../state/replaceState';
import { TagMatcher } from './../common/matching/tagMatcher';
import { VimState } from './../state/vimState';
import { configuration } from './../configuration/configuration';
import { shouldWrapKey } from './wrapping';
import { VimError, ErrorCode } from '../error';
import { BaseMovement, SelectionType, IMovement, isIMovement, failedMovement } from './baseMotion';
import { globalState } from '../state/globalState';
import { reportSearch } from '../util/statusBarTextUtils';
import { SneakForward, SneakBackward } from './plugins/sneak';
import { Notation } from '../configuration/notation';
import { SearchDirection } from '../state/searchState';
import { StatusBar } from '../statusBar';
import { clamp } from '../util/util';
import { getCurrentParagraphBeginning, getCurrentParagraphEnd } from '../textobject/paragraph';
import { PythonDocument } from './languages/python/motion';
import { Position } from 'vscode';
import { sorted } from '../common/motion/position';
import { WordType } from '../textobject/word';

/**
 * A movement is something like 'h', 'k', 'w', 'b', 'gg', etc.
 */

export abstract class ExpandingSelection extends BaseMovement {
  protected override selectionType = SelectionType.Expanding;

  protected override adjustPosition(position: Position, result: IMovement, lastIteration: boolean) {
    if (!lastIteration) {
      position = result.stop;
    }
    return position;
  }
}

abstract class MoveByScreenLine extends BaseMovement {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  abstract movementType: CursorMovePosition;
  by?: CursorMoveByUnit;
  value: number = 1;

  public override async execAction(position: Position, vimState: VimState) {
    return this.execActionWithCount(position, vimState, 1);
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    const multicursorIndex = this.multicursorIndex ?? 0;

    if (multicursorIndex === 0) {
      if (vimState.currentMode === Mode.Visual) {
        // If we change the `vimState.editor.selections` directly with the forEach
        // for some reason vscode doesn't update them. But doing it this way does
        // update vscode's selections.
        const selections = vimState.editor.selections;
        selections.forEach((s, i) => {
          if (s.active.isAfter(s.anchor)) {
            // The selection is on the right side of the cursor, while our representation
            // considers the cursor to be the left edge, so we need to move the selection
            // to the right place before executing the 'cursorMove' command.
            const active = s.active.getLeftThroughLineBreaks();
            vimState.editor.selections[i] = new vscode.Selection(s.anchor, active);
          }
        });
        vimState.editor.selections = selections;
      }

      // When we have multicursors and run a 'cursorMove' command, vscode applies that command
      // to all cursors at the same time. So we should only run it once.
      await vscode.commands.executeCommand('cursorMove', {
        to: this.movementType,
        select: vimState.currentMode !== Mode.Normal,
        by: this.by,
        value: this.value * count,
      });
    }

    /**
     * HACK:
     * The `cursorMove` command is handling the selection for us.
     * So we are not following our design principal (do no real movement inside an action) here
     */
    if (!vimState.editor.selections[multicursorIndex]) {
      // VS Code selections no longer have the same amount of cursors as we do. This means that
      // two or more selections combined into one. In this case we return these cursors as they
      // were with the removed flag so that they can be removed.
      // TODO: does this work in VisualBlock (where cursors are not 1 to 1 with selections)?
      return {
        start: vimState.cursorStartPosition,
        stop: vimState.cursorStopPosition,
        removed: true,
      };
    }

    if (vimState.currentMode === Mode.Normal) {
      return vimState.editor.selections[multicursorIndex].active;
    } else {
      let start = vimState.editor.selections[multicursorIndex].anchor;
      const stop = vimState.editor.selections[multicursorIndex].active;

      // If we are moving up we need to keep getting the left of anchor/start because vscode is
      // to the right of the character in order to include it but our positions are always on the
      // left side of the character.
      // Also when we switch from being before anchor to being after anchor we need to move
      // the anchor/start to the left as well in order to include the character.
      if (
        (start.isAfter(stop) &&
          vimState.cursorStartPosition.isAfter(vimState.cursorStopPosition)) ||
        (vimState.cursorStartPosition.isAfter(vimState.cursorStopPosition) &&
          start.isBeforeOrEqual(stop))
      ) {
        start = start.getLeft();
      }

      return { start, stop };
    }
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<IMovement> {
    const multicursorIndex = this.multicursorIndex ?? 0;
    if (multicursorIndex === 0) {
      // When we have multicursors and run a 'cursorMove' command, vscode applies that command
      // to all cursors at the same time. So we should only run it once.
      await vscode.commands.executeCommand('cursorMove', {
        to: this.movementType,
        select: true,
        by: this.by,
        value: this.value,
      });
    }

    if (!vimState.editor.selections[multicursorIndex]) {
      // Vscode selections no longer have the same amount of cursors as we do. This means that
      // two or more selections combined into one. In this case we return these cursors as they
      // were with the removed flag so that they can be removed.
      return {
        start: vimState.cursorStartPosition,
        stop: vimState.cursorStopPosition,
        removed: true,
      };
    }

    return {
      start: vimState.editor.selections[multicursorIndex].start,
      stop: vimState.editor.selections[multicursorIndex].end,
    };
  }
}

class MoveUpByScreenLine extends MoveByScreenLine {
  keys = [];
  movementType: CursorMovePosition = 'up';
  override by: CursorMoveByUnit = 'wrappedLine';
  override value = 1;
}

class MoveDownByScreenLine extends MoveByScreenLine {
  keys = [];
  movementType: CursorMovePosition = 'down';
  override by: CursorMoveByUnit = 'wrappedLine';
  override value = 1;
}

abstract class MoveByScreenLineMaintainDesiredColumn extends MoveByScreenLine {
  override preservesDesiredColumn() {
    return true;
  }
  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const prevDesiredColumn = vimState.desiredColumn;
    const prevLine = vimState.editor.selection.active.line;

    if (vimState.currentMode !== Mode.Normal) {
      /**
       * As VIM and VSCode handle the end of selection index a little
       * differently we need to sometimes move the cursor at the end
       * of the selection back by a character.
       */
      const start = vimState.editor.selection.start;
      if (
        (this.movementType === 'down' && position.line > start.line) ||
        (this.movementType === 'up' && position.line < prevLine)
      ) {
        await vscode.commands.executeCommand('cursorMove', {
          to: 'left',
          select: true,
          by: 'character',
          value: 1,
        });
      }
    }

    await vscode.commands.executeCommand('cursorMove', {
      to: this.movementType,
      select: vimState.currentMode !== Mode.Normal,
      by: this.by,
      value: this.value,
    });

    if (vimState.currentMode === Mode.Normal) {
      let returnedPos = vimState.editor.selection.active;
      if (prevLine !== returnedPos.line) {
        returnedPos = returnedPos.withColumn(prevDesiredColumn);
      }
      return returnedPos;
    } else {
      /**
       * cursorMove command is handling the selection for us.
       * So we are not following our design principal (do no real movement inside an action) here.
       */
      let start = vimState.editor.selection.start;
      let stop = vimState.editor.selection.end;
      const curPos = vimState.editor.selection.active;

      // We want to swap the cursor start stop positions based on which direction we are moving, up or down
      if (start.isEqual(curPos) && !start.isEqual(stop)) {
        [start, stop] = [stop, start];
        if (prevLine !== start.line) {
          start = start.getLeft();
        }
      }

      if (position.line !== stop.line) {
        stop = stop.withColumn(prevDesiredColumn);
      }

      return { start, stop };
    }
  }
}

class MoveDownFoldFix extends MoveByScreenLineMaintainDesiredColumn {
  keys = [];
  movementType: CursorMovePosition = 'down';
  override by: CursorMoveByUnit = 'line';
  override value = 1;

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    if (position.line >= vimState.document.lineCount - 1) {
      return position;
    }
    let t: Position | IMovement = position;
    let prevLine: number = position.line;
    let prevChar: number = position.character;
    const prevDesiredColumn = vimState.desiredColumn;
    const moveDownByScreenLine = new MoveDownByScreenLine();
    do {
      t = await moveDownByScreenLine.execAction(t, vimState);
      t = t instanceof Position ? t : t.stop;
      const lineChanged = prevLine !== t.line;
      // wrappedLine movement goes to eol character only when at the last line
      // thus a column change on wrappedLine movement represents a visual last line
      const colChanged = prevChar !== t.character;
      if (lineChanged || !colChanged) {
        break;
      }
      prevChar = t.character;
      prevLine = t.line;
    } while (t.line === position.line);
    // fix column change at last line caused by wrappedLine movement
    // causes cursor lag and flicker if a large repeat prefix is given to movement
    if (t.character !== prevDesiredColumn) {
      t = new Position(t.line, prevDesiredColumn);
    }
    return t;
  }
}

@RegisterAction
class MoveDown extends BaseMovement {
  keys = [['j'], ['<down>'], ['<C-j>'], ['<C-n>']];
  override preservesDesiredColumn() {
    return true;
  }

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    if (configuration.foldfix && vimState.currentMode !== Mode.VisualBlock) {
      return new MoveDownFoldFix().execAction(position, vimState);
    }

    if (position.line < vimState.document.lineCount - 1) {
      return position.with({ character: vimState.desiredColumn }).getDown();
    } else {
      return position;
    }
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getDown();
  }
}

@RegisterAction
class MoveUp extends BaseMovement {
  keys = [['k'], ['<up>'], ['<C-p>']];
  override preservesDesiredColumn() {
    return true;
  }

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    if (configuration.foldfix && vimState.currentMode !== Mode.VisualBlock) {
      return new MoveUpFoldFix().execAction(position, vimState);
    }

    if (position.line > 0) {
      return position.with({ character: vimState.desiredColumn }).getUp();
    } else {
      return position;
    }
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getUp();
  }
}

@RegisterAction
class MoveUpFoldFix extends MoveByScreenLineMaintainDesiredColumn {
  keys = [];
  movementType: CursorMovePosition = 'up';
  override by: CursorMoveByUnit = 'line';
  override value = 1;

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    if (position.line === 0) {
      return position;
    }
    let t: Position | IMovement;
    const prevDesiredColumn = vimState.desiredColumn;
    const moveUpByScreenLine = new MoveUpByScreenLine();
    do {
      t = await moveUpByScreenLine.execAction(position, vimState);
      t = t instanceof Position ? t : t.stop;
    } while (t.line === position.line);
    // fix column change at last line caused by wrappedLine movement
    // causes cursor lag and flicker if a large repeat prefix is given to movement
    if (t.character !== prevDesiredColumn) {
      t = new Position(t.line, prevDesiredColumn);
    }
    return t;
  }
}

@RegisterAction
export class ArrowsInInsertMode extends BaseMovement {
  override modes = [Mode.Insert];
  keys = [['<up>'], ['<down>'], ['<left>'], ['<right>']];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    // we are in Insert Mode and arrow keys will clear all other actions except the first action, which enters Insert Mode.
    // Please note the arrow key movement can be repeated while using `.` but it can't be repeated when using `<C-A>` in Insert Mode.
    const firstAction = vimState.recordedState.actionsRun.shift();
    const lastAction = vimState.recordedState.actionsRun.pop();
    vimState.recordedState.actionsRun = [];
    if (firstAction) {
      vimState.recordedState.actionsRun.push(firstAction);
    }
    if (lastAction) {
      vimState.recordedState.actionsRun.push(lastAction);
    }
    // TODO: assert vimState.recordedState.actionsRun.length === 2?

    let newPosition: Position;
    switch (this.keysPressed[0]) {
      case '<up>':
        newPosition = (await new MoveUp().execAction(position, vimState)) as Position;
        break;
      case '<down>':
        newPosition = (await new MoveDown().execAction(position, vimState)) as Position;
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
    vimState.replaceState = new ReplaceState(vimState, newPosition);
    return newPosition;
  }
}

@RegisterAction
class ArrowsInReplaceMode extends BaseMovement {
  override modes = [Mode.Replace];
  keys = [['<up>'], ['<down>'], ['<left>'], ['<right>']];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    let newPosition: Position = position;

    switch (this.keysPressed[0]) {
      case '<up>':
        newPosition = (await new MoveUp().execAction(position, vimState)) as Position;
        break;
      case '<down>':
        newPosition = (await new MoveDown().execAction(position, vimState)) as Position;
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
    vimState.replaceState = new ReplaceState(vimState, newPosition);
    return newPosition;
  }
}

@RegisterAction
class CommandNextSearchMatch extends BaseMovement {
  keys = ['n'];
  override isJump = true;

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const searchState = globalState.searchState;

    if (!searchState || searchState.searchString === '') {
      return position;
    }

    // Turn one of the highlighting flags back on (turned off with :nohl)
    globalState.hl = true;

    if (searchState.getMatchRanges(vimState.editor).length === 0) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.PatternNotFound, searchState.searchString)
      );
      return failedMovement(vimState);
    }

    // we have to handle a special case here: searching for $ or \n,
    // which we approximate by positionIsEOL. In that case (but only when searching forward)
    // we need to "offset" by getRight for searching the next match, otherwise we get stuck.
    const searchForward = searchState.searchDirection === SearchDirection.Forward;
    const positionIsEOL = position.getRight().isEqual(position.getLineEnd());
    const nextMatch =
      positionIsEOL && searchForward
        ? searchState.getNextSearchMatchPosition(vimState.editor, position.getRight())
        : searchState.getNextSearchMatchPosition(vimState.editor, position);

    if (!nextMatch) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(
          searchState.searchDirection === SearchDirection.Forward
            ? ErrorCode.SearchHitBottom
            : ErrorCode.SearchHitTop,
          searchState.searchString
        )
      );
      return failedMovement(vimState);
    }

    reportSearch(nextMatch.index, searchState.getMatchRanges(vimState.editor).length, vimState);

    return nextMatch.pos;
  }
}

@RegisterAction
class CommandPreviousSearchMatch extends BaseMovement {
  keys = ['N'];
  override isJump = true;

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const searchState = globalState.searchState;

    if (!searchState || searchState.searchString === '') {
      return position;
    }

    // Turn one of the highlighting flags back on (turned off with :nohl)
    globalState.hl = true;

    if (searchState.getMatchRanges(vimState.editor).length === 0) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.PatternNotFound, searchState.searchString)
      );
      return failedMovement(vimState);
    }

    const searchForward = searchState.searchDirection === SearchDirection.Forward;
    const positionIsEOL = position.getRight().isEqual(position.getLineEnd());

    // see implementation of n, above.
    const prevMatch =
      positionIsEOL && !searchForward
        ? searchState.getNextSearchMatchPosition(
            vimState.editor,
            position.getRight(),
            SearchDirection.Backward
          )
        : searchState.getNextSearchMatchPosition(
            vimState.editor,
            position,
            SearchDirection.Backward
          );

    if (!prevMatch) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(
          searchState.searchDirection === SearchDirection.Forward
            ? ErrorCode.SearchHitTop
            : ErrorCode.SearchHitBottom,
          searchState.searchString
        )
      );
      return failedMovement(vimState);
    }

    reportSearch(prevMatch.index, searchState.getMatchRanges(vimState.editor).length, vimState);

    return prevMatch.pos;
  }
}

enum VisualMark {
  SelectionStart,
  SelectionEnd,
}
abstract class MarkMovementVisual extends BaseMovement {
  override modes = [Mode.Normal];
  override isJump = true;
  abstract registerMode: RegisterMode;
  abstract mark: VisualMark;

  private startOrEnd(lastVisualSelection: {
    start: vscode.Position;
    end: vscode.Position;
  }): Position {
    // marks from vimstate are sorted by direction of selection (moving forward vs backwards).
    // must sort to document order
    const [start, end] = sorted(lastVisualSelection.start, lastVisualSelection.end);
    return this.mark === VisualMark.SelectionStart ? start : end;
  }

  private inLineCorrection(document: vscode.TextDocument, position: Position): Position {
    // for ' mark, we must go to BOL.
    // for `> mark, we must correct by one char left
    return this.registerMode === RegisterMode.LineWise
      ? position.getLineBeginRespectingIndent(document)
      : this.mark === VisualMark.SelectionEnd
      ? position.getLeft()
      : position;
  }

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    vimState.currentRegisterMode = this.registerMode;

    if (vimState.lastVisualSelection !== undefined) {
      // todo: wait for pipe operator ;-)
      return this.inLineCorrection(
        vimState.document,
        this.startOrEnd(vimState.lastVisualSelection)
      );
    }

    throw VimError.fromCode(ErrorCode.MarkNotSet);
  }
}

@RegisterAction
class MarkMovementVisualStart extends MarkMovementVisual {
  keys = ['`', '<'];
  registerMode = RegisterMode.CharacterWise;
  mark = VisualMark.SelectionStart;
}

@RegisterAction
class MarkMovementVisualEnd extends MarkMovementVisual {
  keys = ['`', '>'];
  registerMode = RegisterMode.CharacterWise;
  mark = VisualMark.SelectionEnd;
}

@RegisterAction
class MarkMovementVisualStartLine extends MarkMovementVisual {
  keys = ["'", '<'];
  registerMode = RegisterMode.LineWise;
  mark = VisualMark.SelectionStart;
}

@RegisterAction
class MarkMovementVisualEndLine extends MarkMovementVisual {
  keys = ["'", '>'];
  registerMode = RegisterMode.LineWise;
  mark = VisualMark.SelectionEnd;
}

@RegisterAction
class MarkMovementBOL extends BaseMovement {
  keys = ["'", '<character>'];
  override isJump = true;

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    const markName = this.keysPressed[1];
    const mark = vimState.historyTracker.getMark(markName);

    if (mark === undefined) {
      throw VimError.fromCode(ErrorCode.MarkNotSet);
    }

    vimState.currentRegisterMode = RegisterMode.LineWise;

    if (mark.isUppercaseMark && mark.editor !== undefined) {
      await ensureEditorIsActive(mark.editor);
    }

    return TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, mark.position.line);
  }
}

@RegisterAction
class MarkMovement extends BaseMovement {
  keys = ['`', '<character>'];
  override isJump = true;

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    const markName = this.keysPressed[1];
    const mark = vimState.historyTracker.getMark(markName);

    if (mark === undefined) {
      throw VimError.fromCode(ErrorCode.MarkNotSet);
    }

    if (mark.isUppercaseMark && mark.editor !== undefined) {
      await ensureEditorIsActive(mark.editor);
    }

    return mark.position;
  }
}

async function ensureEditorIsActive(editor: vscode.TextEditor) {
  if (editor !== vscode.window.activeTextEditor) {
    await vscode.window.showTextDocument(editor.document);
  }
}

@RegisterAction
class MoveLeft extends BaseMovement {
  keys = [['h'], ['<left>'], ['<BS>'], ['<C-BS>'], ['<S-BS>']];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return shouldWrapKey(vimState.currentMode, this.keysPressed[0])
      ? position.getLeftThroughLineBreaks(
          [Mode.Insert, Mode.Replace].includes(vimState.currentMode)
        )
      : position.getLeft();
  }
}

@RegisterAction
class MoveRight extends BaseMovement {
  keys = [['l'], ['<right>'], [' ']];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return shouldWrapKey(vimState.currentMode, this.keysPressed[0])
      ? position.getRightThroughLineBreaks(
          [Mode.Insert, Mode.Replace].includes(vimState.currentMode)
        )
      : position.getRight();
  }
}

@RegisterAction
class MoveDownNonBlank extends BaseMovement {
  keys = [['+'], ['\n'], ['<C-m>']];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return TextEditor.getFirstNonWhitespaceCharOnLine(
      vimState.document,
      position.getDown(Math.max(count, 1)).line
    );
  }
}

@RegisterAction
class MoveUpNonBlank extends BaseMovement {
  keys = ['-'];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return TextEditor.getFirstNonWhitespaceCharOnLine(
      vimState.document,
      position.getUp(Math.max(count, 1)).line
    );
  }
}

@RegisterAction
class MoveDownUnderscore extends BaseMovement {
  keys = ['_'];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    const pos = position.getDown(Math.max(count - 1, 0));
    return vimState.recordedState.operator
      ? pos
      : TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, pos.line);
  }
}

@RegisterAction
class MoveToColumn extends BaseMovement {
  keys = ['|'];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    return new Position(position.line, Math.max(0, count - 1));
  }
}

/**
 * Returns the Postion of the next instance of `char` on the line
 * @param char character to look for
 * @param count number of times to look
 * @param direction direction to look in
 */
function findHelper(
  vimState: VimState,
  start: Position,
  char: string,
  count: number,
  direction: 'forward' | 'backward'
): Position | undefined {
  const line = vimState.document.lineAt(start);

  let index = start.character;
  while (count > 0 && index >= 0) {
    if (direction === 'forward') {
      index = line.text.indexOf(char, index + 1);
    } else {
      index = line.text.lastIndexOf(char, index - 1);
    }
    count--;
  }

  if (index >= 0) {
    return new Position(start.line, index);
  }

  return undefined;
}

@RegisterAction
class MoveFindForward extends BaseMovement {
  keys = ['f', '<character>'];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    if (configuration.sneakReplacesF) {
      const pos = await new SneakForward(
        this.keysPressed.concat('\n'),
        this.isRepeat
      ).execActionWithCount(position, vimState, count);
      if (vimState.recordedState.operator && !isIMovement(pos)) {
        return pos.getRight();
      }

      return pos;
    }

    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[1]);
    let result = findHelper(vimState, position, toFind, count, 'forward');

    vimState.lastSemicolonRepeatableMovement = new MoveFindForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveFindBackward(this.keysPressed, true);

    if (!result) {
      return failedMovement(vimState);
    }

    if (vimState.recordedState.operator) {
      result = result.getRight();
    }

    return result;
  }
}

@RegisterAction
class MoveFindBackward extends BaseMovement {
  keys = ['F', '<character>'];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    if (configuration.sneakReplacesF) {
      return new SneakBackward(this.keysPressed.concat('\n'), this.isRepeat).execActionWithCount(
        position,
        vimState,
        count
      );
    }

    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[1]);
    const result = findHelper(vimState, position, toFind, count, 'backward');

    vimState.lastSemicolonRepeatableMovement = new MoveFindBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveFindForward(this.keysPressed, true);

    if (!result) {
      return failedMovement(vimState);
    }

    return result;
  }
}

function tilHelper(
  vimState: VimState,
  start: Position,
  char: string,
  count: number,
  direction: 'forward' | 'backward'
) {
  const result = findHelper(vimState, start, char, count, direction);
  return direction === 'forward' ? result?.getLeft() : result?.getRight();
}

@RegisterAction
class MoveTilForward extends BaseMovement {
  keys = ['t', '<character>'];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[1]);
    let result = tilHelper(vimState, position, toFind, count, 'forward');

    // For t<character> vim executes ; as 2; and , as 2,
    if (result && this.isRepeat && position.isEqual(result) && count === 1) {
      result = tilHelper(vimState, position, toFind, 2, 'forward');
    }

    vimState.lastSemicolonRepeatableMovement = new MoveTilForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveTilBackward(this.keysPressed, true);

    if (!result) {
      return failedMovement(vimState);
    }

    if (vimState.recordedState.operator) {
      result = result.getRight();
    }

    return result;
  }
}

@RegisterAction
class MoveTilBackward extends BaseMovement {
  keys = ['T', '<character>'];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[1]);
    let result = tilHelper(vimState, position, toFind, count, 'backward');

    // For T<character> vim executes ; as 2; and , as 2,
    if (result && this.isRepeat && position.isEqual(result) && count === 1) {
      result = tilHelper(vimState, position, toFind, 2, 'backward');
    }

    vimState.lastSemicolonRepeatableMovement = new MoveTilBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveTilForward(this.keysPressed, true);

    if (!result) {
      return failedMovement(vimState);
    }

    return result;
  }
}

@RegisterAction
class MoveRepeat extends BaseMovement {
  keys = [';'];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    const movement = vimState.lastSemicolonRepeatableMovement;
    if (movement) {
      return movement.execActionWithCount(position, vimState, count);
    }
    return position;
  }
}

@RegisterAction
class MoveRepeatReversed extends BaseMovement {
  keys = [','];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    const semiColonMovement = vimState.lastSemicolonRepeatableMovement;
    const commaMovement = vimState.lastCommaRepeatableMovement;
    if (commaMovement) {
      const result = commaMovement.execActionWithCount(position, vimState, count);

      // Make sure these don't change. Otherwise, comma's direction flips back
      // and forth when done repeatedly. This is a bit hacky, so feel free to refactor.
      vimState.lastSemicolonRepeatableMovement = semiColonMovement;
      vimState.lastCommaRepeatableMovement = commaMovement;

      return result;
    }
    return position;
  }
}

@RegisterAction
class MoveLineEnd extends BaseMovement {
  keys = [['$'], ['<End>'], ['<D-right>']];
  override setsDesiredColumnToEOL = true;

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    return position.getDown(Math.max(count - 1, 0)).getLineEnd();
  }
}

@RegisterAction
class MoveLineBegin extends BaseMovement {
  keys = [['0'], ['<Home>'], ['<D-left>']];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLineBegin();
  }

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && vimState.recordedState.count === 0;
  }

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.couldActionApply(vimState, keysPressed) && vimState.recordedState.count === 0;
  }
}

@RegisterAction
class MoveScreenLineBegin extends MoveByScreenLine {
  keys = ['g', '0'];
  movementType: CursorMovePosition = 'wrappedLineStart';
}

@RegisterAction
class MoveScreenNonBlank extends MoveByScreenLine {
  keys = ['g', '^'];
  movementType: CursorMovePosition = 'wrappedLineFirstNonWhitespaceCharacter';
}

@RegisterAction
class MoveScreenLineEnd extends MoveByScreenLine {
  keys = ['g', '$'];
  movementType: CursorMovePosition = 'wrappedLineEnd';
}

@RegisterAction
class MoveScreenLineEndNonBlank extends MoveByScreenLine {
  keys = ['g', '_'];
  movementType: CursorMovePosition = 'wrappedLineLastNonWhitespaceCharacter';

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count ||= 1;
    const pos = await super.execActionWithCount(position, vimState, count);

    // If in visual, return a selection
    if (pos instanceof Position) {
      return pos.getDown(count - 1);
    } else {
      return { start: pos.start, stop: pos.stop.getDown(count - 1).getLeftThroughLineBreaks() };
    }
  }
}

@RegisterAction
class MoveScreenLineCenter extends MoveByScreenLine {
  keys = ['g', 'm'];
  movementType: CursorMovePosition = 'wrappedLineColumnCenter';
}

@RegisterAction
class MoveUpByDisplayLine extends MoveByScreenLine {
  override modes = [Mode.Normal, Mode.Visual];
  keys = [
    ['g', 'k'],
    ['g', '<up>'],
  ];
  movementType: CursorMovePosition = 'up';
  override by: CursorMoveByUnit = 'wrappedLine';
  override value = 1;
}

@RegisterAction
class MoveDownByDisplayLine extends MoveByScreenLine {
  override modes = [Mode.Normal, Mode.Visual];
  keys = [
    ['g', 'j'],
    ['g', '<down>'],
  ];
  movementType: CursorMovePosition = 'down';
  override by: CursorMoveByUnit = 'wrappedLine';
  override value = 1;
}

// Because we can't support moving by screen line when in visualLine mode,
// we change to moving by regular line in visualLine mode. We can't move by
// screen line is that our ranges only support a start and stop attribute,
// and moving by screen line just snaps us back to the original position.
// Check PR #1600 for discussion.
@RegisterAction
class MoveUpByScreenLineVisualLine extends MoveByScreenLine {
  override modes = [Mode.VisualLine];
  keys = [
    ['g', 'k'],
    ['g', '<up>'],
  ];
  movementType: CursorMovePosition = 'up';
  override by: CursorMoveByUnit = 'line';
  override value = 1;
}

@RegisterAction
class MoveDownByScreenLineVisualLine extends MoveByScreenLine {
  override modes = [Mode.VisualLine];
  keys = [
    ['g', 'j'],
    ['g', '<down>'],
  ];
  movementType: CursorMovePosition = 'down';
  override by: CursorMoveByUnit = 'line';
  override value = 1;
}

@RegisterAction
class MoveUpByScreenLineVisualBlock extends BaseMovement {
  override modes = [Mode.VisualBlock];
  keys = [
    ['g', 'k'],
    ['g', '<up>'],
  ];
  override preservesDesiredColumn() {
    return true;
  }

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    if (position.line > 0) {
      return position.with({ character: vimState.desiredColumn }).getUp();
    } else {
      return position;
    }
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getUp();
  }
}

@RegisterAction
class MoveDownByScreenLineVisualBlock extends BaseMovement {
  override modes = [Mode.VisualBlock];
  keys = [
    ['g', 'j'],
    ['g', '<down>'],
  ];
  override preservesDesiredColumn() {
    return true;
  }

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    if (position.line < vimState.document.lineCount - 1) {
      return position.with({ character: vimState.desiredColumn }).getDown();
    } else {
      return position;
    }
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getDown();
  }
}

@RegisterAction
class MoveScreenToRight extends MoveByScreenLine {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', 'h'];
  movementType: CursorMovePosition = 'right';
  override by: CursorMoveByUnit = 'character';
  override value = 1;

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }
}

@RegisterAction
class MoveScreenToLeft extends MoveByScreenLine {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', 'l'];
  movementType: CursorMovePosition = 'left';
  override by: CursorMoveByUnit = 'character';
  override value = 1;

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }
}

@RegisterAction
class MoveScreenToRightHalf extends MoveByScreenLine {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', 'H'];
  movementType: CursorMovePosition = 'right';
  override by: CursorMoveByUnit = 'halfLine';
  override value = 1;

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }
}

@RegisterAction
class MoveScreenToLeftHalf extends MoveByScreenLine {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', 'L'];
  movementType: CursorMovePosition = 'left';
  override by: CursorMoveByUnit = 'halfLine';
  override value = 1;
  override isJump = true;

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }
}

@RegisterAction
class MoveToLineFromViewPortTop extends MoveByScreenLine {
  keys = ['H'];
  movementType: CursorMovePosition = 'viewPortTop';
  override by: CursorMoveByUnit = 'line';
  override value = 1;
  override isJump = true;
}

@RegisterAction
class MoveToLineFromViewPortBottom extends MoveByScreenLine {
  keys = ['L'];
  movementType: CursorMovePosition = 'viewPortBottom';
  override by: CursorMoveByUnit = 'line';
  override value = 1;
  override isJump = true;
}

@RegisterAction
class MoveToMiddleLineInViewPort extends MoveByScreenLine {
  keys = ['M'];
  movementType: CursorMovePosition = 'viewPortCenter';
  override by: CursorMoveByUnit = 'line';
  override isJump = true;
}

@RegisterAction
class MoveNonBlank extends BaseMovement {
  keys = ['^'];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, position.line);
  }
}

@RegisterAction
class MoveNonBlankFirst extends BaseMovement {
  keys = [['g', 'g'], ['<C-Home>']];
  override isJump = true;

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    const lineNumber = clamp(count, 1, vimState.document.lineCount) - 1;
    return {
      start: vimState.cursorStartPosition,
      stop: position.withLine(lineNumber).obeyStartOfLine(vimState.document),
      registerMode: RegisterMode.LineWise,
    };
  }
}

@RegisterAction
class MoveNonBlankLast extends BaseMovement {
  keys = ['G'];
  override isJump = true;

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    let stop: Position;

    if (count === 0) {
      stop = new Position(vimState.document.lineCount - 1, position.character).obeyStartOfLine(
        vimState.document
      );
    } else {
      stop = new Position(
        Math.min(count, vimState.document.lineCount) - 1,
        position.character
      ).obeyStartOfLine(vimState.document);
    }

    return {
      start: vimState.cursorStartPosition,
      stop,
      registerMode: RegisterMode.LineWise,
    };
  }
}

@RegisterAction
class EndOfSpecificLine extends BaseMovement {
  keys = ['<C-End>'];

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position> {
    const line = count
      ? clamp(count - 1, 0, vimState.document.lineCount - 1)
      : vimState.document.lineCount - 1;

    return new Position(line, 0).getLineEnd();
  }
}

@RegisterAction
export class MoveWordBegin extends BaseMovement {
  keys = ['w'];

  public override async execAction(
    position: Position,
    vimState: VimState,
    isLastIteration: boolean = false
  ): Promise<Position> {
    if (
      isLastIteration &&
      !configuration.changeWordIncludesWhitespace &&
      vimState.recordedState.operator instanceof ChangeOperator
    ) {
      const line = vimState.document.lineAt(position);
      if (line.text.length === 0) {
        return position;
      }

      const char = line.text[position.character];

      /*
      From the Vim manual:

      Special case: "cw" and "cW" are treated like "ce" and "cE" if the cursor is
      on a non-blank.  This is because "cw" is interpreted as change-word, and a
      word does not include the following white space.
      */

      if (' \t'.includes(char)) {
        return position.nextWordStart(vimState.document);
      } else {
        return position.nextWordEnd(vimState.document, { inclusive: true }).getRight();
      }
    } else {
      return position.nextWordStart(vimState.document);
    }
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position> {
    const result = await this.execAction(position, vimState, true);

    /*
    From the Vim documentation:

    Another special case: When using the "w" motion in combination with an
    operator and the last word moved over is at the end of a line, the end of
    that word becomes the end of the operated text, not the first word in the
    next line.
    */

    if (
      result.line > position.line + 1 ||
      (result.line === position.line + 1 && result.isFirstWordOfLine(vimState.document))
    ) {
      return position.getLineEnd();
    }

    if (result.isLineEnd()) {
      return new Position(result.line, result.character + 1);
    }

    return result;
  }
}

@RegisterAction
export class MoveFullWordBegin extends BaseMovement {
  keys = [['W'], ['<C-right>']];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (
      !configuration.changeWordIncludesWhitespace &&
      vimState.recordedState.operator instanceof ChangeOperator
    ) {
      // TODO use execForOperator? Or maybe dont?

      // See note for w
      return position.nextWordEnd(vimState.document, { wordType: WordType.Big }).getRight();
    } else {
      return position.nextWordStart(vimState.document, { wordType: WordType.Big });
    }
  }
}

@RegisterAction
class MoveWordEnd extends BaseMovement {
  keys = ['e'];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.nextWordEnd(vimState.document);
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position> {
    const end = position.nextWordEnd(vimState.document);

    return new Position(end.line, end.character + 1);
  }
}

@RegisterAction
class MoveFullWordEnd extends BaseMovement {
  keys = ['E'];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.nextWordEnd(vimState.document, { wordType: WordType.Big });
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position> {
    return position.nextWordEnd(vimState.document, { wordType: WordType.Big }).getRight();
  }
}

@RegisterAction
class MoveLastWordEnd extends BaseMovement {
  keys = ['g', 'e'];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.prevWordEnd(vimState.document);
  }
}

@RegisterAction
class MoveLastFullWordEnd extends BaseMovement {
  keys = ['g', 'E'];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.prevWordEnd(vimState.document, { wordType: WordType.Big });
  }
}

@RegisterAction
class MoveBeginningWord extends BaseMovement {
  keys = [['b'], ['<C-left>']];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.prevWordStart(vimState.document);
  }
}

@RegisterAction
class MoveBeginningFullWord extends BaseMovement {
  keys = ['B'];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.prevWordStart(vimState.document, { wordType: WordType.Big });
  }
}

@RegisterAction
class MovePreviousSentenceBegin extends BaseMovement {
  keys = ['('];
  override isJump = true;

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getSentenceBegin({ forward: false });
  }
}

@RegisterAction
class GoToOffset extends BaseMovement {
  keys = ['g', 'o'];
  override isJump = true;

  public override async execActionWithCount(position: Position, vimState: VimState, count: number) {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return vimState.document.positionAt((count || 1) - 1);
  }
}

@RegisterAction
class MoveNextSentenceBegin extends BaseMovement {
  keys = [')'];
  override isJump = true;

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getSentenceBegin({ forward: true });
  }
}

@RegisterAction
class MoveParagraphEnd extends BaseMovement {
  keys = ['}'];
  override isJump = true;
  iteration = 0;
  isFirstLineWise = false;

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    const hasOperator = vimState.recordedState.operator;
    const paragraphEnd = getCurrentParagraphEnd(position);

    if (hasOperator) {
      /**
       * When paired with an `operator` and a `count` this move will be executed
       * multiple times which could cause issues like https://github.com/VSCodeVim/Vim/issues/4488
       * because subsequent runs will receive back whatever position we return
       * (See comment in `BaseMotion.execActionWithCount()`).
       *
       * We keep track of the iteration we are in, this way we can
       * return the correct position when on the last iteration, and we don't
       * accidentally set the `registerMode` incorrectly.
       */
      this.iteration++;

      const isLineWise = position.isLineBeginning() && vimState.currentMode === Mode.Normal;

      const isLastIteration = vimState.recordedState.count
        ? vimState.recordedState.count === this.iteration
        : true;

      /**
       * `position` may not represent the position of the cursor from which the command was initiated.
       * In the case that we will be repeating this move more than once
       * we want to respect whether the starting position was at the beginning of line or not.
       */
      this.isFirstLineWise = this.iteration === 1 ? isLineWise : this.isFirstLineWise;

      vimState.currentRegisterMode = this.isFirstLineWise
        ? RegisterMode.LineWise
        : RegisterMode.AscertainFromCurrentMode;

      /**
       * `paragraphEnd` is the first blank line after the last word in the
       * current paragraph, we want the position just before that one to
       * accurately emulate Vim's behaviour, unless we are at EOF.
       */
      return isLastIteration && !paragraphEnd.isAtDocumentEnd()
        ? paragraphEnd.getLeftThroughLineBreaks(true)
        : paragraphEnd;
    }

    return paragraphEnd;
  }
}

@RegisterAction
class MoveParagraphBegin extends BaseMovement {
  keys = ['{'];
  override isJump = true;

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    return getCurrentParagraphBeginning(position);
  }
}

abstract class MoveSectionBoundary extends BaseMovement {
  abstract begin: boolean;
  abstract forward: boolean;
  override isJump = true;

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const document = vimState.document;

    switch (document.languageId) {
      case 'python':
        return PythonDocument.moveClassBoundary(
          document,
          position,
          vimState,
          this.forward,
          this.begin
        );
    }

    const boundary = this.begin ? '{' : '}';
    let line = position.line;

    if (
      (this.forward && line === vimState.document.lineCount - 1) ||
      (!this.forward && line === 0)
    ) {
      return TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, line);
    }

    line = this.forward ? line + 1 : line - 1;

    while (!vimState.document.lineAt(line).text.startsWith(boundary)) {
      if (this.forward) {
        if (line === vimState.document.lineCount - 1) {
          break;
        }

        line++;
      } else {
        if (line === 0) {
          break;
        }

        line--;
      }
    }

    return TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, line);
  }
}

@RegisterAction
class MoveNextSectionBegin extends MoveSectionBoundary {
  keys = [']', ']'];
  begin = true;
  forward = true;
}

@RegisterAction
class MoveNextSectionEnd extends MoveSectionBoundary {
  keys = [']', '['];
  begin = false;
  forward = true;
}

@RegisterAction
class MovePreviousSectionBegin extends MoveSectionBoundary {
  keys = ['[', '['];
  begin = true;
  forward = false;
}

@RegisterAction
class MovePreviousSectionEnd extends MoveSectionBoundary {
  keys = ['[', ']'];
  begin = false;
  forward = false;
}

@RegisterAction
class MoveToMatchingBracket extends BaseMovement {
  keys = ['%'];
  override isJump = true;

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    position = position.getLeftIfEOL();

    const lineText = vimState.document.lineAt(position).text;
    const failure = failedMovement(vimState);

    for (let col = position.character; col < lineText.length; col++) {
      const pairing = PairMatcher.pairings[lineText[col]];
      if (pairing && pairing.matchesWithPercentageMotion) {
        // We found an opening char, now move to the matching closing char
        return (
          PairMatcher.nextPairedChar(
            new Position(position.line, col),
            lineText[col],
            vimState,
            false
          ) || failure
        );
      }
    }

    // No matchable character on the line; admit defeat
    return failure;
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const result = await this.execAction(position, vimState);

    if (isIMovement(result)) {
      if (result.failed) {
        return result;
      } else {
        throw new Error('Did not ever handle this case!');
      }
    }

    if (position.isAfter(result)) {
      return {
        start: result,
        stop: position.getRight(),
      };
    } else {
      return result.getRight();
    }
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    // % has a special mode that lets you use it to jump to a percentage of the file
    // However, some other bracket motions inherit from this so only do this behavior for % explicitly
    if (Object.getPrototypeOf(this) === MoveToMatchingBracket.prototype) {
      if (count === 0) {
        if (vimState.recordedState.operator) {
          return this.execActionForOperator(position, vimState);
        } else {
          return this.execAction(position, vimState);
        }
      }

      // Check to make sure this is a valid percentage
      if (count < 0 || count > 100) {
        return failedMovement(vimState);
      }

      // See `:help N%`
      const targetLine = Math.trunc((count * vimState.document.lineCount + 99) / 100) - 1;

      return position.with({ line: targetLine }).obeyStartOfLine(vimState.document);
    } else {
      return super.execActionWithCount(position, vimState, count);
    }
  }
}

export abstract class MoveInsideCharacter extends ExpandingSelection {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  protected abstract charToMatch: string;

  /** True for "around" actions, such as `a(`, and false for "inside" actions, such as `i(`  */
  protected includeSurrounding = false;
  override isJump = true;

  public override async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const closingChar = PairMatcher.pairings[this.charToMatch].match;
    let cursorStartPos = vimState.cursorStartPosition;
    const failure = failedMovement(vimState);

    // when matching inside content of a pair, search for the next pair if
    // the inner content is already selected in full
    if (!this.includeSurrounding) {
      const adjacentPosLeft = cursorStartPos.getLeftThroughLineBreaks(false);
      let adjacentPosRight = vimState.recordedState.operator
        ? position
        : position.getRightThroughLineBreaks();
      if (adjacentPosRight.isLineBeginning()) {
        adjacentPosRight = adjacentPosRight.getLineBeginRespectingIndent(vimState.document);
      }
      const adjacentCharLeft = TextEditor.getCharAt(vimState.document, adjacentPosLeft);
      const adjacentCharRight = TextEditor.getCharAt(vimState.document, adjacentPosRight);
      if (adjacentCharLeft === this.charToMatch && adjacentCharRight === closingChar) {
        cursorStartPos = adjacentPosLeft;
        vimState.cursorStartPosition = adjacentPosLeft;
        position = adjacentPosRight;
        vimState.cursorStopPosition = adjacentPosRight;
      }
    }
    // First, search backwards for the opening character of the sequence
    let startPos = PairMatcher.nextPairedChar(cursorStartPos, closingChar, vimState, true);
    if (startPos === undefined) {
      return failure;
    }

    let startPlusOne: Position;

    if (startPos.isAfterOrEqual(startPos.getLineEnd().getLeft())) {
      startPlusOne = new Position(startPos.line + 1, 0);
    } else {
      startPlusOne = new Position(startPos.line, startPos.character + 1);
    }

    let endPos = PairMatcher.nextPairedChar(position, this.charToMatch, vimState, true);

    if (endPos === undefined) {
      return failure;
    }

    if (this.includeSurrounding) {
      if (vimState.currentMode !== Mode.Visual) {
        endPos = new Position(endPos.line, endPos.character + 1);
      }
    } else {
      startPos = startPlusOne;

      // If the closing character is the first on the line, don't swallow it.
      if (endPos.isInLeadingWhitespace(vimState.document)) {
        endPos = endPos.getLineBegin();
      }

      if (vimState.currentMode === Mode.Visual) {
        endPos = endPos.getLeftThroughLineBreaks();
      }
    }

    if (!isVisualMode(vimState.currentMode) && position.isBefore(startPos)) {
      vimState.recordedState.operatorPositionDiff = startPos.subtract(position);
    }

    vimState.cursorStartPosition = startPos;
    return {
      start: startPos,
      stop: endPos,
    };
  }
}

@RegisterAction
class MoveInsideParentheses extends MoveInsideCharacter {
  keys = [
    ['i', '('],
    ['i', ')'],
    ['i', 'b'],
  ];
  charToMatch = '(';
}

@RegisterAction
export class MoveAroundParentheses extends MoveInsideCharacter {
  keys = [
    ['a', '('],
    ['a', ')'],
    ['a', 'b'],
  ];
  charToMatch = '(';
  override includeSurrounding = true;
}

@RegisterAction
class MoveInsideCurlyBrace extends MoveInsideCharacter {
  keys = [
    ['i', '{'],
    ['i', '}'],
    ['i', 'B'],
  ];
  charToMatch = '{';
}

@RegisterAction
export class MoveAroundCurlyBrace extends MoveInsideCharacter {
  keys = [
    ['a', '{'],
    ['a', '}'],
    ['a', 'B'],
  ];
  charToMatch = '{';
  override includeSurrounding = true;
}

@RegisterAction
class MoveInsideCaret extends MoveInsideCharacter {
  keys = [
    ['i', '<'],
    ['i', '>'],
  ];
  charToMatch = '<';
}

@RegisterAction
export class MoveAroundCaret extends MoveInsideCharacter {
  keys = [
    ['a', '<'],
    ['a', '>'],
  ];
  charToMatch = '<';
  override includeSurrounding = true;
}

@RegisterAction
class MoveInsideSquareBracket extends MoveInsideCharacter {
  keys = [
    ['i', '['],
    ['i', ']'],
  ];
  charToMatch = '[';
}

@RegisterAction
export class MoveAroundSquareBracket extends MoveInsideCharacter {
  keys = [
    ['a', '['],
    ['a', ']'],
  ];
  charToMatch = '[';
  override includeSurrounding = true;
}

// TODO: Shouldn't this be a TextObject? A clearer delineation between motions and objects should be made.
export abstract class MoveQuoteMatch extends BaseMovement {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  protected abstract readonly charToMatch: '"' | "'" | '`';
  protected includeQuotes = false;
  override isJump = true;

  // HACK: surround uses these classes, but does not want trailing whitespace to be included
  private adjustForTrailingWhitespace: boolean = true;

  constructor(adjustForTrailingWhitespace: boolean = true) {
    super();
    this.adjustForTrailingWhitespace = adjustForTrailingWhitespace;
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<IMovement> {
    // TODO: this is super janky
    return (await super.execActionWithCount(position, vimState, 1)) as IMovement;
  }

  public override async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    if (
      !this.includeQuotes &&
      (vimState.recordedState.count > 1 || vimState.recordedState.operatorCount > 1)
    ) {
      // i" special case: With a count of 2 the quotes are included, but no extra white space as with a"/a'/a`.
      // (a" does not make use of count)
      this.includeQuotes = true;
      this.adjustForTrailingWhitespace = false;
    }

    const text = vimState.document.lineAt(position).text;
    const quoteMatcher = new QuoteMatcher(this.charToMatch, text);
    const quoteIndices = quoteMatcher.surroundingQuotes(position.character);
    if (quoteIndices === undefined) {
      return failedMovement(vimState);
    }

    let [start, end] = quoteIndices;

    if (!this.includeQuotes) {
      // Don't include the quotes
      start++;
      end--;
    } else if (this.adjustForTrailingWhitespace) {
      // Include trailing whitespace if there is any...
      const trailingWhitespace = text.substring(end + 1).search(/\S|$/);
      if (trailingWhitespace > 0) {
        end += trailingWhitespace;
      } else {
        // ...otherwise include leading whitespace
        start = text.substring(0, start).search(/\s*$/);
      }
    }

    const startPos = new Position(position.line, start);
    const endPos = new Position(position.line, end);

    if (!isVisualMode(vimState.currentMode) && position.isBefore(startPos)) {
      vimState.recordedState.operatorPositionDiff = startPos.subtract(position);
    }

    return {
      start: startPos,
      stop: endPos,
    };
  }

  public override async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const result = await this.execAction(position, vimState);
    if (isIMovement(result)) {
      if (result.failed) {
        vimState.recordedState.hasRunOperator = false;
        vimState.recordedState.actionsRun = [];
      } else {
        result.stop = result.stop.getRight();
      }
    }
    return result;
  }
}

@RegisterAction
class MoveInsideSingleQuotes extends MoveQuoteMatch {
  keys = ['i', "'"];
  readonly charToMatch = "'";
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundSingleQuotes extends MoveQuoteMatch {
  keys = ['a', "'"];
  readonly charToMatch = "'";
  override includeQuotes = true;
}

@RegisterAction
class MoveInsideDoubleQuotes extends MoveQuoteMatch {
  keys = ['i', '"'];
  readonly charToMatch = '"';
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundDoubleQuotes extends MoveQuoteMatch {
  keys = ['a', '"'];
  readonly charToMatch = '"';
  override includeQuotes = true;
}

@RegisterAction
class MoveInsideBacktick extends MoveQuoteMatch {
  keys = ['i', '`'];
  readonly charToMatch = '`';
  override includeQuotes = false;
}

@RegisterAction
export class MoveAroundBacktick extends MoveQuoteMatch {
  keys = ['a', '`'];
  readonly charToMatch = '`';
  override includeQuotes = true;
}

@RegisterAction
class MoveToUnclosedRoundBracketBackward extends MoveToMatchingBracket {
  override keys = ['[', '('];

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const charToMatch = ')';
    const result = PairMatcher.nextPairedChar(position, charToMatch, vimState, false);

    if (!result) {
      return failedMovement(vimState);
    }
    return result;
  }
}

@RegisterAction
class MoveToUnclosedRoundBracketForward extends MoveToMatchingBracket {
  override keys = [']', ')'];

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const charToMatch = '(';
    const result = PairMatcher.nextPairedChar(position, charToMatch, vimState, false);

    if (!result) {
      return failedMovement(vimState);
    }

    if (
      vimState.recordedState.operator instanceof ChangeOperator ||
      vimState.recordedState.operator instanceof DeleteOperator ||
      vimState.recordedState.operator instanceof YankOperator
    ) {
      return result.getLeftThroughLineBreaks();
    }

    return result;
  }
}

@RegisterAction
class MoveToUnclosedCurlyBracketBackward extends MoveToMatchingBracket {
  override keys = ['[', '{'];

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const charToMatch = '}';
    const result = PairMatcher.nextPairedChar(position, charToMatch, vimState, false);

    if (!result) {
      return failedMovement(vimState);
    }
    return result;
  }
}

@RegisterAction
class MoveToUnclosedCurlyBracketForward extends MoveToMatchingBracket {
  override keys = [']', '}'];

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    const charToMatch = '{';
    const result = PairMatcher.nextPairedChar(position, charToMatch, vimState, false);

    if (!result) {
      return failedMovement(vimState);
    }

    if (
      vimState.recordedState.operator instanceof ChangeOperator ||
      vimState.recordedState.operator instanceof DeleteOperator ||
      vimState.recordedState.operator instanceof YankOperator
    ) {
      return result.getLeftThroughLineBreaks();
    }

    return result;
  }
}

abstract class MoveTagMatch extends ExpandingSelection {
  override modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  protected includeTag = false;
  override isJump = true;

  public override async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const editorText = vimState.document.getText();
    const offset = vimState.document.offsetAt(position);
    const tagMatcher = new TagMatcher(editorText, offset, vimState);
    const start = tagMatcher.findOpening(this.includeTag);
    const end = tagMatcher.findClosing(this.includeTag);

    if (start === undefined || end === undefined) {
      return failedMovement(vimState);
    }

    const startPosition =
      start >= 0 ? vimState.document.positionAt(start) : vimState.cursorStartPosition;
    let endPosition = end >= 0 ? vimState.document.positionAt(end) : position;
    if (vimState.currentMode === Mode.Visual || vimState.currentMode === Mode.SurroundInputMode) {
      endPosition = endPosition.getLeftThroughLineBreaks();
    }

    if (position.isAfter(endPosition)) {
      vimState.recordedState.transformer.addTransformation({
        type: 'moveCursor',
        diff: endPosition.subtract(position),
      });
    } else if (position.isBefore(startPosition)) {
      vimState.recordedState.transformer.addTransformation({
        type: 'moveCursor',
        diff: startPosition.subtract(position),
      });
    }
    // if (start === end) {
    //   if (vimState.recordedState.operator instanceof ChangeOperator) {
    //     await vimState.setCurrentMode(ModeName.Insert);
    //   }
    //   return failedMovement(vimState);
    // }
    vimState.cursorStartPosition = startPosition;
    return {
      start: startPosition,
      stop: endPosition,
    };
  }
}

@RegisterAction
export class MoveInsideTag extends MoveTagMatch {
  keys = ['i', 't'];
  override includeTag = false;
}

@RegisterAction
export class MoveAroundTag extends MoveTagMatch {
  keys = ['a', 't'];
  override includeTag = true;
}
