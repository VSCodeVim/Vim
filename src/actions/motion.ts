import * as vscode from 'vscode';

import { ChangeOperator, DeleteOperator, YankOperator } from './operator';
import { CursorMoveByUnit, CursorMovePosition, TextEditor } from './../textEditor';
import { Mode } from './../mode/mode';
import { PairMatcher } from './../common/matching/matcher';
import { Position } from './../common/motion/position';
import { QuoteMatcher } from './../common/matching/quoteMatcher';
import { RegisterAction } from './base';
import { RegisterMode } from './../register/register';
import { ReplaceState } from './../state/replaceState';
import { TagMatcher } from './../common/matching/tagMatcher';
import { VimState } from './../state/vimState';
import { configuration } from './../configuration/configuration';
import { shouldWrapKey } from './wrapping';
import { VimError, ErrorCode } from '../error';
import { BaseMovement, SelectionType, IMovement, isIMovement } from './baseMotion';
import { globalState } from '../state/globalState';
import { reportSearch } from '../util/statusBarTextUtils';
import { SneakForward, SneakBackward } from './plugins/sneak';
import { Notation } from '../configuration/notation';
import { SearchDirection } from '../state/searchState';
import { StatusBar } from '../statusBar';

/**
 * A movement is something like 'h', 'k', 'w', 'b', 'gg', etc.
 */

export abstract class ExpandingSelection extends BaseMovement {
  protected selectionType = SelectionType.Expanding;

  protected adjustPosition(position: Position, result: IMovement, lastIteration: boolean) {
    if (!lastIteration) {
      position = result.stop;
    }
    return position;
  }
}

abstract class MoveByScreenLine extends BaseMovement {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  movementType: CursorMovePosition;
  by: CursorMoveByUnit;
  value: number = 1;

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    await vscode.commands.executeCommand('cursorMove', {
      to: this.movementType,
      select: vimState.currentMode !== Mode.Normal,
      by: this.by,
      value: this.value,
    });

    if (vimState.currentMode === Mode.Normal) {
      return Position.FromVSCodePosition(vimState.editor.selection.active);
    } else {
      /**
       * cursorMove command is handling the selection for us.
       * So we are not following our design principal (do no real movement inside an action) here.
       */
      let start = Position.FromVSCodePosition(vimState.editor.selection.start);
      let stop = Position.FromVSCodePosition(vimState.editor.selection.end);
      let curPos = Position.FromVSCodePosition(vimState.editor.selection.active);

      // We want to swap the cursor start stop positions based on which direction we are moving, up or down
      if (start.isEqual(curPos)) {
        position = start;
        [start, stop] = [stop, start];
        start = start.getLeft();
      }

      return { start, stop };
    }
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<IMovement> {
    await vscode.commands.executeCommand('cursorMove', {
      to: this.movementType,
      select: true,
      by: this.by,
      value: this.value,
    });

    return {
      start: Position.FromVSCodePosition(vimState.editor.selection.start),
      stop: Position.FromVSCodePosition(vimState.editor.selection.end),
    };
  }
}

export class MoveUpByScreenLine extends MoveByScreenLine {
  movementType: CursorMovePosition = 'up';
  by: CursorMoveByUnit = 'wrappedLine';
  value = 1;
}

class MoveDownByScreenLine extends MoveByScreenLine {
  movementType: CursorMovePosition = 'down';
  by: CursorMoveByUnit = 'wrappedLine';
  value = 1;
}

abstract class MoveByScreenLineMaintainDesiredColumn extends MoveByScreenLine {
  preservesDesiredColumn() {
    return true;
  }
  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    let prevDesiredColumn = vimState.desiredColumn;
    let prevLine = vimState.editor.selection.active.line;

    if (vimState.currentMode !== Mode.Normal) {
      /**
       * As VIM and VSCode handle the end of selection index a little
       * differently we need to sometimes move the cursor at the end
       * of the selection back by a character.
       */
      let start = Position.FromVSCodePosition(vimState.editor.selection.start);
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
      let returnedPos = Position.FromVSCodePosition(vimState.editor.selection.active);
      if (prevLine !== returnedPos.line) {
        returnedPos = returnedPos.withColumn(prevDesiredColumn);
      }
      return returnedPos;
    } else {
      /**
       * cursorMove command is handling the selection for us.
       * So we are not following our design principal (do no real movement inside an action) here.
       */
      let start = Position.FromVSCodePosition(vimState.editor.selection.start);
      let stop = Position.FromVSCodePosition(vimState.editor.selection.end);
      let curPos = Position.FromVSCodePosition(vimState.editor.selection.active);

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

class MoveDownByScreenLineMaintainDesiredColumn extends MoveByScreenLineMaintainDesiredColumn {
  movementType: CursorMovePosition = 'down';
  by: CursorMoveByUnit = 'wrappedLine';
  value = 1;
}

class MoveUpByScreenLineMaintainDesiredColumn extends MoveByScreenLineMaintainDesiredColumn {
  movementType: CursorMovePosition = 'up';
  by: CursorMoveByUnit = 'wrappedLine';
  value = 1;
}

class MoveDownFoldFix extends MoveByScreenLineMaintainDesiredColumn {
  movementType: CursorMovePosition = 'down';
  by: CursorMoveByUnit = 'line';
  value = 1;

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (position.line >= TextEditor.getLineCount() - 1) {
      return position;
    }
    let t: Position | IMovement;
    let prevLine: number = position.line;
    let prevChar: number = position.character;
    const prevDesiredColumn = vimState.desiredColumn;
    const moveDownByScreenLine = new MoveDownByScreenLine();
    do {
      t = <Position | IMovement>await moveDownByScreenLine.execAction(position, vimState);
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
  keys = ['j'];
  preservesDesiredColumn() {
    return true;
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (configuration.foldfix && vimState.currentMode !== Mode.VisualBlock) {
      return new MoveDownFoldFix().execAction(position, vimState);
    }
    return position.getDownWithDesiredColumn(vimState.desiredColumn);
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getDownWithDesiredColumn(position.getLineEnd().character);
  }
}

@RegisterAction
class MoveDownArrow extends MoveDown {
  keys = ['<down>'];
}

@RegisterAction
class MoveUp extends BaseMovement {
  keys = ['k'];
  preservesDesiredColumn() {
    return true;
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (configuration.foldfix && vimState.currentMode !== Mode.VisualBlock) {
      return new MoveUpFoldFix().execAction(position, vimState);
    }
    return position.getUpWithDesiredColumn(vimState.desiredColumn);
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getUpWithDesiredColumn(position.getLineEnd().character);
  }
}

@RegisterAction
class MoveUpFoldFix extends MoveByScreenLineMaintainDesiredColumn {
  movementType: CursorMovePosition = 'up';
  by: CursorMoveByUnit = 'line';
  value = 1;

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    if (position.line === 0) {
      return position;
    }
    let t: Position | IMovement;
    const prevDesiredColumn = vimState.desiredColumn;
    const moveUpByScreenLine = new MoveUpByScreenLine();
    do {
      t = <Position | IMovement>await moveUpByScreenLine.execAction(position, vimState);
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
class MoveUpArrow extends MoveUp {
  keys = ['<up>'];
}

@RegisterAction
class ArrowsInReplaceMode extends BaseMovement {
  modes = [Mode.Replace];
  keys = [['<up>'], ['<down>'], ['<left>'], ['<right>']];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    let newPosition: Position = position;

    switch (this.keysPressed[0]) {
      case '<up>':
        newPosition = <Position>await new MoveUpArrow().execAction(position, vimState);
        break;
      case '<down>':
        newPosition = <Position>await new MoveDownArrow().execAction(position, vimState);
        break;
      case '<left>':
        newPosition = await new MoveLeftArrow().execAction(position, vimState);
        break;
      case '<right>':
        newPosition = await new MoveRightArrow().execAction(position, vimState);
        break;
      default:
        break;
    }
    vimState.replaceState = new ReplaceState(newPosition);
    return newPosition;
  }
}

@RegisterAction
class UpArrowInReplaceMode extends ArrowsInReplaceMode {
  keys = [['<up>']];
}

@RegisterAction
class DownArrowInReplaceMode extends ArrowsInReplaceMode {
  keys = [['<down>']];
}

@RegisterAction
class LeftArrowInReplaceMode extends ArrowsInReplaceMode {
  keys = [['<left>']];
}

@RegisterAction
class RightArrowInReplaceMode extends ArrowsInReplaceMode {
  keys = [['<right>']];
}

@RegisterAction
class CommandNextSearchMatch extends BaseMovement {
  keys = ['n'];
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const searchState = globalState.searchState;

    if (!searchState || searchState.searchString === '') {
      return position;
    }

    // Turn one of the highlighting flags back on (turned off with :nohl)
    globalState.hl = true;

    if (searchState.matchRanges.length === 0) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.PatternNotFound, searchState.searchString)
      );
      return position;
    }

    let nextMatch:
      | {
          pos: Position;
          index: number;
        }
      | undefined;
    if (position.getRight().isEqual(position.getLineEnd())) {
      nextMatch = searchState.getNextSearchMatchPosition(position.getRight());
    } else {
      nextMatch = searchState.getNextSearchMatchPosition(position);
    }

    if (!nextMatch) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(
          searchState.searchDirection === SearchDirection.Forward
            ? ErrorCode.SearchHitBottom
            : ErrorCode.SearchHitTop
        )
      );
      return position;
    }

    reportSearch(nextMatch.index, searchState.matchRanges.length, vimState);

    return nextMatch.pos;
  }
}

@RegisterAction
class CommandPreviousSearchMatch extends BaseMovement {
  keys = ['N'];
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const searchState = globalState.searchState;

    if (!searchState || searchState.searchString === '') {
      return position;
    }

    // Turn one of the highlighting flags back on (turned off with :nohl)
    globalState.hl = true;

    if (searchState.matchRanges.length === 0) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.PatternNotFound, searchState.searchString)
      );
      return position;
    }

    const prevMatch = searchState.getNextSearchMatchPosition(position, -1);

    if (!prevMatch) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(
          searchState.searchDirection === SearchDirection.Forward
            ? ErrorCode.SearchHitTop
            : ErrorCode.SearchHitBottom
        )
      );
      return position;
    }

    reportSearch(prevMatch.index, searchState.matchRanges.length, vimState);

    return prevMatch.pos;
  }
}

@RegisterAction
export class MarkMovementBOL extends BaseMovement {
  keys = ["'", '<character>'];
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const markName = this.keysPressed[1];
    const mark = vimState.historyTracker.getMark(markName);

    vimState.currentRegisterMode = RegisterMode.LineWise;

    if (mark == null) {
      throw VimError.fromCode(ErrorCode.MarkNotSet);
    }

    if (mark.isUppercaseMark && mark.editor !== undefined) {
      await ensureEditorIsActive(mark.editor);
    }

    return TextEditor.getFirstNonWhitespaceCharOnLine(mark.position.line);
  }
}

@RegisterAction
export class MarkMovement extends BaseMovement {
  keys = ['`', '<character>'];
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const markName = this.keysPressed[1];
    const mark = vimState.historyTracker.getMark(markName);

    if (mark == null) {
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
export class MoveLeft extends BaseMovement {
  keys = ['h'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (shouldWrapKey(vimState, this.keysPressed)) {
      return position.getLeftThroughLineBreaks();
    }
    return position.getLeft();
  }
}

@RegisterAction
class MoveLeftArrow extends MoveLeft {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['<left>'];
}

@RegisterAction
class BackSpaceInNormalMode extends BaseMovement {
  modes = [Mode.Normal];
  keys = ['<BS>'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLeftThroughLineBreaks();
  }
}

@RegisterAction
class BackSpaceInVisualMode extends BaseMovement {
  modes = [Mode.Visual, Mode.VisualBlock];
  keys = ['<BS>'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return configuration.whichwrap.includes('b')
      ? position.getLeftThroughLineBreaks()
      : position.getLeft();
  }
}

@RegisterAction
class MoveRight extends BaseMovement {
  keys = ['l'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (shouldWrapKey(vimState, this.keysPressed)) {
      const includeEol = vimState.currentMode === Mode.Insert;
      return position.getRightThroughLineBreaks(includeEol);
    }
    return position.getRight();
  }
}

@RegisterAction
class MoveRightArrow extends MoveRight {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['<right>'];
}

@RegisterAction
class MoveRightWithSpace extends BaseMovement {
  keys = [' '];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getRightThroughLineBreaks();
  }
}

@RegisterAction
class MoveDownNonBlank extends BaseMovement {
  keys = ['+'];

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return TextEditor.getFirstNonWhitespaceCharOnLine(position.getDown(Math.max(count, 1)).line);
  }
}

@RegisterAction
class MoveUpNonBlank extends BaseMovement {
  keys = ['-'];

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return TextEditor.getFirstNonWhitespaceCharOnLine(position.getUp(Math.max(count, 1)).line);
  }
}

@RegisterAction
class MoveDownUnderscore extends BaseMovement {
  keys = ['_'];

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    return TextEditor.getFirstNonWhitespaceCharOnLine(
      position.getDown(Math.max(count - 1, 0)).line
    );
  }
}

@RegisterAction
class MoveToColumn extends BaseMovement {
  keys = ['|'];

  public async execActionWithCount(
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
  start: Position,
  char: string,
  count: number,
  direction: 'forward' | 'backward'
): Position | undefined {
  const line = TextEditor.getLineAt(start);

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

  public async execActionWithCount(
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

    count = count || 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[1]);
    let result = findHelper(position, toFind, count, 'forward');

    vimState.lastSemicolonRepeatableMovement = new MoveFindForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveFindBackward(this.keysPressed, true);

    if (!result) {
      return { start: position, stop: position, failed: true };
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

  public async execActionWithCount(
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

    count = count || 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[1]);
    let result = findHelper(position, toFind, count, 'backward');

    vimState.lastSemicolonRepeatableMovement = new MoveFindBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveFindForward(this.keysPressed, true);

    if (!result) {
      return { start: position, stop: position, failed: true };
    }

    return result;
  }
}

function tilHelper(
  start: Position,
  char: string,
  count: number,
  direction: 'forward' | 'backward'
) {
  const result = findHelper(start, char, count, direction);
  return direction === 'forward' ? result?.getLeft() : result?.getRight();
}

@RegisterAction
class MoveTilForward extends BaseMovement {
  keys = ['t', '<character>'];

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count = count || 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[1]);
    let result = tilHelper(position, toFind, count, 'forward');

    // For t<character> vim executes ; as 2; and , as 2,
    if (result && this.isRepeat && position.isEqual(result) && count === 1) {
      result = tilHelper(position, toFind, 2, 'forward');
    }

    vimState.lastSemicolonRepeatableMovement = new MoveTilForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveTilBackward(this.keysPressed, true);

    if (!result) {
      return { start: position, stop: position, failed: true };
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

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count = count || 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[1]);
    let result = tilHelper(position, toFind, count, 'backward');

    // For T<character> vim executes ; as 2; and , as 2,
    if (result && this.isRepeat && position.isEqual(result) && count === 1) {
      result = tilHelper(position, toFind, 2, 'backward');
    }

    vimState.lastSemicolonRepeatableMovement = new MoveTilBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveTilForward(this.keysPressed, true);

    if (!result) {
      return { start: position, stop: position, failed: true };
    }

    return result;
  }
}

@RegisterAction
class MoveRepeat extends BaseMovement {
  keys = [';'];

  public async execActionWithCount(
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

  public async execActionWithCount(
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
  setsDesiredColumnToEOL = true;

  public async execActionWithCount(
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

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLineBegin();
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && vimState.recordedState.count === 0;
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
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

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count = count || 1;
    const pos = await this.execAction(position, vimState);
    const newPos: Position | IMovement = pos as Position;

    // If in visual, return a selection
    if (pos instanceof Position) {
      return pos.getDown(count - 1);
    } else if (isIMovement(pos)) {
      return { start: pos.start, stop: pos.stop.getDown(count - 1).getLeft() };
    }

    return newPos.getDown(count - 1);
  }
}

@RegisterAction
class MoveScreenLineCenter extends MoveByScreenLine {
  keys = ['g', 'm'];
  movementType: CursorMovePosition = 'wrappedLineColumnCenter';
}

@RegisterAction
export class MoveUpByDisplayLine extends MoveByScreenLine {
  modes = [Mode.Insert, Mode.Normal, Mode.Visual];
  keys = [
    ['g', 'k'],
    ['g', '<up>'],
  ];
  movementType: CursorMovePosition = 'up';
  by: CursorMoveByUnit = 'wrappedLine';
  value = 1;
}

@RegisterAction
class MoveDownByDisplayLine extends MoveByScreenLine {
  modes = [Mode.Insert, Mode.Normal, Mode.Visual];
  keys = [
    ['g', 'j'],
    ['g', '<down>'],
  ];
  movementType: CursorMovePosition = 'down';
  by: CursorMoveByUnit = 'wrappedLine';
  value = 1;
}

// Because we can't support moving by screen line when in visualLine mode,
// we change to moving by regular line in visualLine mode. We can't move by
// screen line is that our ranges only support a start and stop attribute,
// and moving by screen line just snaps us back to the original position.
// Check PR #1600 for discussion.
@RegisterAction
class MoveUpByScreenLineVisualLine extends MoveByScreenLine {
  modes = [Mode.VisualLine];
  keys = [
    ['g', 'k'],
    ['g', '<up>'],
  ];
  movementType: CursorMovePosition = 'up';
  by: CursorMoveByUnit = 'line';
  value = 1;
}

@RegisterAction
class MoveDownByScreenLineVisualLine extends MoveByScreenLine {
  modes = [Mode.VisualLine];
  keys = [
    ['g', 'j'],
    ['g', '<down>'],
  ];
  movementType: CursorMovePosition = 'down';
  by: CursorMoveByUnit = 'line';
  value = 1;
}

@RegisterAction
class MoveUpByScreenLineVisualBlock extends BaseMovement {
  modes = [Mode.VisualBlock];
  keys = [
    ['g', 'k'],
    ['g', '<up>'],
  ];
  preservesDesiredColumn() {
    return true;
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    return position.getUpWithDesiredColumn(vimState.desiredColumn);
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getUpWithDesiredColumn(position.getLineEnd().character);
  }
}

@RegisterAction
class MoveDownByScreenLineVisualBlock extends BaseMovement {
  modes = [Mode.VisualBlock];
  keys = [
    ['g', 'j'],
    ['g', '<down>'],
  ];
  preservesDesiredColumn() {
    return true;
  }

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    return position.getDownWithDesiredColumn(vimState.desiredColumn);
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getDownWithDesiredColumn(position.getLineEnd().character);
  }
}

@RegisterAction
class MoveScreenToRight extends MoveByScreenLine {
  modes = [Mode.Insert, Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['z', 'h'];
  movementType: CursorMovePosition = 'right';
  by: CursorMoveByUnit = 'character';
  value = 1;

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }
}

@RegisterAction
class MoveScreenToLeft extends MoveByScreenLine {
  modes = [Mode.Insert, Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['z', 'l'];
  movementType: CursorMovePosition = 'left';
  by: CursorMoveByUnit = 'character';
  value = 1;

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }
}

@RegisterAction
class MoveScreenToRightHalf extends MoveByScreenLine {
  modes = [Mode.Insert, Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['z', 'H'];
  movementType: CursorMovePosition = 'right';
  by: CursorMoveByUnit = 'halfLine';
  value = 1;

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }
}

@RegisterAction
class MoveScreenToLeftHalf extends MoveByScreenLine {
  modes = [Mode.Insert, Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['z', 'L'];
  movementType: CursorMovePosition = 'left';
  by: CursorMoveByUnit = 'halfLine';
  value = 1;
  isJump = true;

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
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
  by: CursorMoveByUnit = 'line';
  value = 1;
  isJump = true;

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    this.value = count < 1 ? 1 : count;
    return this.execAction(position, vimState);
  }
}

@RegisterAction
class MoveToLineFromViewPortBottom extends MoveByScreenLine {
  keys = ['L'];
  movementType: CursorMovePosition = 'viewPortBottom';
  by: CursorMoveByUnit = 'line';
  value = 1;
  isJump = true;

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    this.value = count < 1 ? 1 : count;
    return this.execAction(position, vimState);
  }
}

@RegisterAction
class MoveToMiddleLineInViewPort extends MoveByScreenLine {
  keys = ['M'];
  movementType: CursorMovePosition = 'viewPortCenter';
  by: CursorMoveByUnit = 'line';
  isJump = true;
}

@RegisterAction
class MoveNonBlank extends BaseMovement {
  keys = ['^'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return TextEditor.getFirstNonWhitespaceCharOnLine(position.line);
  }
}

@RegisterAction
class MoveNextLineNonBlank extends BaseMovement {
  keys = ['\n'];

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;

    // Count === 0 if just pressing enter in normal mode, need to still go down 1 line
    if (count === 0) {
      count++;
    }

    return TextEditor.getFirstNonWhitespaceCharOnLine(position.getDown(count).line);
  }
}

@RegisterAction
class MoveNonBlankFirst extends BaseMovement {
  keys = ['g', 'g'];
  isJump = true;

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    if (count === 0) {
      return TextEditor.getDocumentBegin().obeyStartOfLine();
    } else if (count > TextEditor.getLineCount()) {
      count = TextEditor.getLineCount();
    }
    return new Position(count - 1, 0).obeyStartOfLine();
  }
}

@RegisterAction
class MoveNonBlankLast extends BaseMovement {
  keys = ['G'];
  isJump = true;

  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    let stop: Position;

    if (count === 0) {
      stop = new Position(TextEditor.getLineCount() - 1, position.character).obeyStartOfLine();
    } else {
      stop = new Position(
        Math.min(count, TextEditor.getLineCount()) - 1,
        position.character
      ).obeyStartOfLine();
    }

    return {
      start: vimState.cursorStartPosition,
      stop: stop,
      registerMode: RegisterMode.LineWise,
    };
  }
}

@RegisterAction
export class MoveWordBegin extends BaseMovement {
  keys = ['w'];

  public async execAction(
    position: Position,
    vimState: VimState,
    isLastIteration: boolean = false
  ): Promise<Position> {
    if (
      isLastIteration &&
      !configuration.changeWordIncludesWhitespace &&
      vimState.recordedState.operator instanceof ChangeOperator
    ) {
      if (TextEditor.getLineAt(position).text.length < 1) {
        return position;
      }

      const line = TextEditor.getLineAt(position).text;
      const char = line[position.character];

      /*
      From the Vim manual:

      Special case: "cw" and "cW" are treated like "ce" and "cE" if the cursor is
      on a non-blank.  This is because "cw" is interpreted as change-word, and a
      word does not include the following white space.
      */

      if (' \t'.includes(char)) {
        return position.getWordRight();
      } else {
        return position.getCurrentWordEnd(true).getRight();
      }
    } else {
      return position.getWordRight();
    }
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
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
      (result.line === position.line + 1 && result.isFirstWordOfLine())
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
class MoveFullWordBegin extends BaseMovement {
  keys = ['W'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (
      !configuration.changeWordIncludesWhitespace &&
      vimState.recordedState.operator instanceof ChangeOperator
    ) {
      // TODO use execForOperator? Or maybe dont?

      // See note for w
      return position.getCurrentBigWordEnd().getRight();
    } else {
      return position.getBigWordRight();
    }
  }
}

@RegisterAction
class MoveWordEnd extends BaseMovement {
  keys = ['e'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentWordEnd();
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    let end = position.getCurrentWordEnd();

    return new Position(end.line, end.character + 1);
  }
}

@RegisterAction
class MoveFullWordEnd extends BaseMovement {
  keys = ['E'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentBigWordEnd();
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentBigWordEnd().getRight();
  }
}

@RegisterAction
class MoveLastWordEnd extends BaseMovement {
  keys = ['g', 'e'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLastWordEnd();
  }
}

@RegisterAction
class MoveLastFullWordEnd extends BaseMovement {
  keys = ['g', 'E'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLastBigWordEnd();
  }
}

@RegisterAction
class MoveBeginningWord extends BaseMovement {
  keys = ['b'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getWordLeft();
  }
}

@RegisterAction
class MoveBeginningFullWord extends BaseMovement {
  keys = ['B'];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getBigWordLeft();
  }
}

@RegisterAction
class MovePreviousSentenceBegin extends BaseMovement {
  keys = ['('];
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getSentenceBegin({ forward: false });
  }
}

@RegisterAction
class MoveNextSentenceBegin extends BaseMovement {
  keys = [')'];
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getSentenceBegin({ forward: true });
  }
}

@RegisterAction
class MoveParagraphEnd extends BaseMovement {
  keys = ['}'];
  isJump = true;
  iteration = 0;
  isFirstLineWise = false;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const hasOperator = vimState.recordedState.operator;
    const paragraphEnd = position.getCurrentParagraphEnd();

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
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentParagraphBeginning();
  }
}

abstract class MoveSectionBoundary extends BaseMovement {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  boundary: string;
  forward: boolean;
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (
      (this.forward && position.line === TextEditor.getLineCount() - 1) ||
      (!this.forward && position.line === 0)
    ) {
      return TextEditor.getFirstNonWhitespaceCharOnLine(position.line);
    }

    position = this.forward
      ? position.getDownWithDesiredColumn(0)
      : position.getUpWithDesiredColumn(0);

    while (!TextEditor.getLineAt(position).text.startsWith(this.boundary)) {
      if (this.forward) {
        if (position.line === TextEditor.getLineCount() - 1) {
          break;
        }

        position = position.getDownWithDesiredColumn(0);
      } else {
        if (position.line === 0) {
          break;
        }

        position = position.getUpWithDesiredColumn(0);
      }
    }

    return TextEditor.getFirstNonWhitespaceCharOnLine(position.line);
  }
}

@RegisterAction
class MoveNextSectionBegin extends MoveSectionBoundary {
  keys = [']', ']'];
  boundary = '{';
  forward = true;
}

@RegisterAction
class MoveNextSectionEnd extends MoveSectionBoundary {
  keys = [']', '['];
  boundary = '}';
  forward = true;
}

@RegisterAction
class MovePreviousSectionBegin extends MoveSectionBoundary {
  keys = ['[', '['];
  boundary = '{';
  forward = false;
}

@RegisterAction
class MovePreviousSectionEnd extends MoveSectionBoundary {
  keys = ['[', ']'];
  boundary = '}';
  forward = false;
}

@RegisterAction
class MoveToMatchingBracket extends BaseMovement {
  keys = ['%'];
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    position = position.getLeftIfEOL();

    const lineText = TextEditor.getLineAt(position).text;
    const failure = { start: position, stop: position, failed: true };

    for (let col = position.character; col < lineText.length; col++) {
      const pairing = PairMatcher.pairings[lineText[col]];
      if (pairing && pairing.matchesWithPercentageMotion) {
        // We found an opening char, now move to the matching closing char
        return (
          PairMatcher.nextPairedChar(new Position(position.line, col), lineText[col]) || failure
        );
      }
    }

    // No matchable character on the line; admit defeat
    return failure;
  }

  public async execActionForOperator(
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

  public async execActionWithCount(
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
        return { start: position, stop: position, failed: true };
      }

      const targetLine = Math.round((count * TextEditor.getLineCount()) / 100);

      return TextEditor.getFirstNonWhitespaceCharOnLine(targetLine - 1);
    } else {
      return super.execActionWithCount(position, vimState, count);
    }
  }
}

export abstract class MoveInsideCharacter extends ExpandingSelection {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  protected charToMatch: string;
  protected includeSurrounding = false;
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const closingChar = PairMatcher.pairings[this.charToMatch].match;
    let cursorStartPos = new Position(
      vimState.cursorStartPosition.line,
      vimState.cursorStartPosition.character
    );
    // maintain current selection on failure
    const failure = { start: cursorStartPos, stop: position, failed: true };

    // when matching inside content of a pair, search for the next pair if
    // the inner content is already selected in full
    if (!this.includeSurrounding) {
      const adjacentPosLeft = cursorStartPos.getLeftThroughLineBreaks();
      let adjacentPosRight = position.getRightThroughLineBreaks();
      if (vimState.recordedState.operator) {
        adjacentPosRight = adjacentPosRight.getLeftThroughLineBreaks();
      }
      const adjacentCharLeft = TextEditor.getCharAt(adjacentPosLeft);
      const adjacentCharRight = TextEditor.getCharAt(adjacentPosRight);
      if (adjacentCharLeft === this.charToMatch && adjacentCharRight === closingChar) {
        cursorStartPos = adjacentPosLeft;
        vimState.cursorStartPosition = adjacentPosLeft;
        position = adjacentPosRight;
        vimState.cursorStopPosition = adjacentPosRight;
      }
    }
    // First, search backwards for the opening character of the sequence
    let startPos = PairMatcher.nextPairedChar(cursorStartPos, closingChar, vimState);
    if (startPos === undefined) {
      return failure;
    }

    let startPlusOne: Position;

    if (startPos.isAfterOrEqual(startPos.getLineEnd().getLeft())) {
      startPlusOne = new Position(startPos.line + 1, 0);
    } else {
      startPlusOne = new Position(startPos.line, startPos.character + 1);
    }

    let endPos = PairMatcher.nextPairedChar(position, this.charToMatch, vimState);

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
      if (endPos.isInLeadingWhitespace()) {
        endPos = endPos.getLineBegin();
      }

      if (vimState.currentMode === Mode.Visual) {
        endPos = endPos.getLeftThroughLineBreaks();
      }
    }

    if (position.isBefore(startPos)) {
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
class MoveIParentheses extends MoveInsideCharacter {
  keys = ['i', '('];
  charToMatch = '(';
}

@RegisterAction
class MoveIClosingParentheses extends MoveInsideCharacter {
  keys = ['i', ')'];
  charToMatch = '(';
}

@RegisterAction
class MoveIClosingParenthesesBlock extends MoveInsideCharacter {
  keys = ['i', 'b'];
  charToMatch = '(';
}

@RegisterAction
export class MoveAParentheses extends MoveInsideCharacter {
  keys = ['a', '('];
  charToMatch = '(';
  includeSurrounding = true;
}

@RegisterAction
class MoveAClosingParentheses extends MoveInsideCharacter {
  keys = ['a', ')'];
  charToMatch = '(';
  includeSurrounding = true;
}

@RegisterAction
class MoveAParenthesesBlock extends MoveInsideCharacter {
  keys = ['a', 'b'];
  charToMatch = '(';
  includeSurrounding = true;
}

@RegisterAction
class MoveICurlyBrace extends MoveInsideCharacter {
  keys = ['i', '{'];
  charToMatch = '{';
}

@RegisterAction
class MoveIClosingCurlyBrace extends MoveInsideCharacter {
  keys = ['i', '}'];
  charToMatch = '{';
}

@RegisterAction
class MoveIClosingCurlyBraceBlock extends MoveInsideCharacter {
  keys = ['i', 'B'];
  charToMatch = '{';
}

@RegisterAction
export class MoveACurlyBrace extends MoveInsideCharacter {
  keys = ['a', '{'];
  charToMatch = '{';
  includeSurrounding = true;
}

@RegisterAction
export class MoveAClosingCurlyBrace extends MoveInsideCharacter {
  keys = ['a', '}'];
  charToMatch = '{';
  includeSurrounding = true;
}

@RegisterAction
class MoveAClosingCurlyBraceBlock extends MoveInsideCharacter {
  keys = ['a', 'B'];
  charToMatch = '{';
  includeSurrounding = true;
}

@RegisterAction
class MoveICaret extends MoveInsideCharacter {
  keys = ['i', '<'];
  charToMatch = '<';
}

@RegisterAction
class MoveIClosingCaret extends MoveInsideCharacter {
  keys = ['i', '>'];
  charToMatch = '<';
}

@RegisterAction
export class MoveACaret extends MoveInsideCharacter {
  keys = ['a', '<'];
  charToMatch = '<';
  includeSurrounding = true;
}

@RegisterAction
class MoveAClosingCaret extends MoveInsideCharacter {
  keys = ['a', '>'];
  charToMatch = '<';
  includeSurrounding = true;
}

@RegisterAction
class MoveISquareBracket extends MoveInsideCharacter {
  keys = ['i', '['];
  charToMatch = '[';
}

@RegisterAction
class MoveIClosingSquareBraket extends MoveInsideCharacter {
  keys = ['i', ']'];
  charToMatch = '[';
}

@RegisterAction
export class MoveASquareBracket extends MoveInsideCharacter {
  keys = ['a', '['];
  charToMatch = '[';
  includeSurrounding = true;
}

@RegisterAction
class MoveAClosingSquareBracket extends MoveInsideCharacter {
  keys = ['a', ']'];
  charToMatch = '[';
  includeSurrounding = true;
}

export abstract class MoveQuoteMatch extends BaseMovement {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  protected charToMatch: string;
  protected includeSurrounding = false;
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    // TODO: Don't limit quote matching to the same line
    const text = TextEditor.getLineAt(position).text;
    const quoteMatcher = new QuoteMatcher(this.charToMatch, text);
    let start = quoteMatcher.findOpening(position.character);
    let end = quoteMatcher.findClosing(start + 1);

    if (end < start && start === position.character) {
      // start character is a match and no forward match found
      // search backwards instead
      end = start;
      start = quoteMatcher.findOpening(end - 1);
    }

    if (start === -1 || end === -1 || end === start || end < position.character) {
      return {
        start: position,
        stop: position,
        failed: true,
      };
    }

    let startPos = new Position(position.line, start);
    let endPos = new Position(position.line, end);

    if (!this.includeSurrounding) {
      startPos = startPos.getRight();
      endPos = endPos.getLeft();
    }

    if (position.isBefore(startPos)) {
      vimState.recordedState.operatorPositionDiff = startPos.subtract(position);
    }

    return {
      start: startPos,
      stop: endPos,
    };
  }

  public async execActionForOperator(
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
  charToMatch = "'";
  includeSurrounding = false;
}

@RegisterAction
export class MoveASingleQuotes extends MoveQuoteMatch {
  keys = ['a', "'"];
  charToMatch = "'";
  includeSurrounding = true;
}

@RegisterAction
class MoveInsideDoubleQuotes extends MoveQuoteMatch {
  keys = ['i', '"'];
  charToMatch = '"';
  includeSurrounding = false;
}

@RegisterAction
export class MoveADoubleQuotes extends MoveQuoteMatch {
  keys = ['a', '"'];
  charToMatch = '"';
  includeSurrounding = true;
}

@RegisterAction
class MoveInsideBacktick extends MoveQuoteMatch {
  keys = ['i', '`'];
  charToMatch = '`';
  includeSurrounding = false;
}

@RegisterAction
export class MoveABacktick extends MoveQuoteMatch {
  keys = ['a', '`'];
  charToMatch = '`';
  includeSurrounding = true;
}

@RegisterAction
class MoveToUnclosedRoundBracketBackward extends MoveToMatchingBracket {
  keys = ['[', '('];

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const failure = { start: position, stop: position, failed: true };
    const charToMatch = ')';
    const result = PairMatcher.nextPairedChar(position, charToMatch);

    if (!result) {
      return failure;
    }
    return result;
  }
}

@RegisterAction
class MoveToUnclosedRoundBracketForward extends MoveToMatchingBracket {
  keys = [']', ')'];

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const failure = { start: position, stop: position, failed: true };
    const charToMatch = '(';
    const result = PairMatcher.nextPairedChar(position, charToMatch);

    if (!result) {
      return failure;
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
  keys = ['[', '{'];

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const failure = { start: position, stop: position, failed: true };
    const charToMatch = '}';
    const result = PairMatcher.nextPairedChar(position, charToMatch);

    if (!result) {
      return failure;
    }
    return result;
  }
}

@RegisterAction
class MoveToUnclosedCurlyBracketForward extends MoveToMatchingBracket {
  keys = [']', '}'];

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const failure = { start: position, stop: position, failed: true };
    const charToMatch = '{';
    const result = PairMatcher.nextPairedChar(position, charToMatch);

    if (!result) {
      return failure;
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
  modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  protected includeTag = false;
  isJump = true;

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const editorText = TextEditor.getText();
    const offset = TextEditor.getOffsetAt(position);
    const tagMatcher = new TagMatcher(editorText, offset, vimState);
    const cursorStartPos = new Position(
      vimState.cursorStartPosition.line,
      vimState.cursorStartPosition.character
    );
    const start = tagMatcher.findOpening(this.includeTag);
    const end = tagMatcher.findClosing(this.includeTag);

    if (start === undefined || end === undefined) {
      return {
        start: cursorStartPos,
        stop: position,
        failed: true,
      };
    }

    let startPosition = start >= 0 ? TextEditor.getPositionAt(start) : cursorStartPos;
    let endPosition = end >= 0 ? TextEditor.getPositionAt(end) : position;
    if (vimState.currentMode === Mode.Visual || vimState.currentMode === Mode.SurroundInputMode) {
      endPosition = endPosition.getLeftThroughLineBreaks();
    }

    if (position.isAfter(endPosition)) {
      vimState.recordedState.transformations.push({
        type: 'moveCursor',
        diff: endPosition.subtract(position),
      });
    } else if (position.isBefore(startPosition)) {
      vimState.recordedState.transformations.push({
        type: 'moveCursor',
        diff: startPosition.subtract(position),
      });
    }
    // if (start === end) {
    //   if (vimState.recordedState.operator instanceof ChangeOperator) {
    //     await vimState.setCurrentMode(ModeName.Insert);
    //   }
    //   return {
    //     start: startPosition,
    //     stop: startPosition,
    //     failed: true,
    //   };
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
  includeTag = false;
}

@RegisterAction
export class MoveAroundTag extends MoveTagMatch {
  keys = ['a', 't'];
  includeTag = true;
}

export abstract class ArrowsInInsertMode extends BaseMovement {
  modes = [Mode.Insert];
  keys: string[];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    // we are in Insert Mode and arrow keys will clear all other actions except the first action, which enters Insert Mode.
    // Please note the arrow key movement can be repeated while using `.` but it can't be repeated when using `<C-A>` in Insert Mode.
    vimState.recordedState.actionsRun = [
      vimState.recordedState.actionsRun.shift()!,
      vimState.recordedState.actionsRun.pop()!,
    ];

    let newPosition: Position;
    switch (this.keys[0]) {
      case '<up>':
        newPosition = <Position>await new MoveUpArrow().execAction(position, vimState);
        break;
      case '<down>':
        newPosition = <Position>await new MoveDownArrow().execAction(position, vimState);
        break;
      case '<left>':
        newPosition = await new MoveLeftArrow(this.keysPressed).execAction(position, vimState);
        break;
      case '<right>':
        newPosition = await new MoveRightArrow(this.keysPressed).execAction(position, vimState);
        break;
      default:
        throw new Error(`Unexpected 'arrow' key: ${this.keys[0]}`);
    }
    vimState.replaceState = new ReplaceState(newPosition);
    return newPosition;
  }
}

@RegisterAction
class UpArrowInInsertMode extends ArrowsInInsertMode {
  keys = ['<up>'];
}

@RegisterAction
class DownArrowInInsertMode extends ArrowsInInsertMode {
  keys = ['<down>'];
}

@RegisterAction
class LeftArrowInInsertMode extends ArrowsInInsertMode {
  keys = ['<left>'];
}

@RegisterAction
class RightArrowInInsertMode extends ArrowsInInsertMode {
  keys = ['<right>'];
}
