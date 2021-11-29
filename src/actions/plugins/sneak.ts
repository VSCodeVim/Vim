import { RegisterAction, BaseAction, BaseCommand } from './../base';
import { Position } from 'vscode';
import * as vscode from 'vscode';
import { BaseMovement, IMovement } from '../baseMotion';
import { SneakHighlighter } from './sneakHighlighting';
import { IBaseOperator } from 'src/state/recordedState';
import { Mode } from '../../mode/mode';
import { getAndUpdateModeHandler } from '../../../extensionBase';
import { ErrorCode, VimError } from '../../error';
import { Match, SearchOptions } from './easymotion/types';
import { SearchUtil } from './easymotion/searchUtil';
import * as util from '../../util/util';
import { MoveFindBackward, MoveRepeat, MoveRepeatReversed } from '../motion';
import { MoveFindForward } from '../motion';
import { VimState } from '../../state/vimState';
import { configuration } from '../../configuration/configuration';

export class Sneak {
  private _sneakHighlighter: SneakHighlighter;
  public lastSneakAction?: SneakAction | undefined;
  public lastRecognizedAction: BaseAction | undefined = undefined;

  public constructor(editor: vscode.TextEditor) {
    this._sneakHighlighter = new SneakHighlighter(editor);
  }

  public clearSneakIfApplicable(vimState: VimState): void {
    const keepDrawingDecorations =
      (!configuration.sneakLabelMode &&
        Sneak.isSneakTheLastAction(vimState.sneak.lastRecognizedAction)) ||
      (configuration.sneakLabelMode && vimState.currentMode === Mode.SneakLabelInputMode);

    if (!keepDrawingDecorations) {
      this.sneakHighlighter.clearDecorations();
      vimState.sneak.lastSneakAction = undefined;
    }
  }

  public static isSneakTheLastAction(lastRecognizedAction: BaseAction | undefined): boolean {
    return (
      lastRecognizedAction instanceof SneakAction ||
      lastRecognizedAction instanceof MoveRepeat ||
      lastRecognizedAction instanceof MoveRepeatReversed ||
      (configuration.sneakReplacesF &&
        (lastRecognizedAction instanceof MoveFindForward ||
          lastRecognizedAction instanceof MoveFindBackward))
    );
  }

  public get sneakHighlighter(): SneakHighlighter {
    return this._sneakHighlighter;
  }
}

export abstract class SneakAction extends BaseMovement {
  override isJump = true;

  /**
   * This is where we save the operator in the event of a z/Z motion and label mode so
   * SneakMarkInputJump can reuse it.
   */
  protected operator: IBaseOperator | undefined;

  protected highlighter: SneakHighlighter | undefined;

  protected previousMode: Mode | undefined;

  protected previousCursorStart: Position = new Position(0, 0);

  protected labelModeEnabled: boolean | undefined;

  protected abstract searchForward: boolean;

  public getOperator(): IBaseOperator | undefined {
    return this.operator;
  }

  public getPreviousMode(): Mode | undefined {
    return this.previousMode;
  }

  public isLabelModeEnabled(): boolean {
    return this.labelModeEnabled ?? false;
  }

  public getPreviousCursorStart(): Position {
    return this.previousCursorStart;
  }

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.sneak && super.couldActionApply(vimState, keysPressed);
  }

  public getMarkPosition(mark: string): Position | undefined {
    const markRange = this.highlighter?.getMarkRange(mark);
    if (markRange) {
      return this.convertRangeToPosition(markRange);
    }

    return undefined;
  }

  /**
   * Whether the current call to sneak is just a jump or an operator movement.
   */
  protected isOperatorMovement(): boolean {
    return this.operator !== undefined;
  }

  protected createSearchOptions(
    minBackwardPos: Position,
    maxForwardPos: Position,
    cursorPos: Position,
    documentLineCount: number
  ): SearchOptions {
    let searchOptions: SearchOptions;
    const maxLinesToConsider = configuration.sneakMaxLinesToConsider;

    const candidateStopsForward = [maxForwardPos, new Position(documentLineCount, 0).getLineEnd()];
    const candidateStopsBackward = [minBackwardPos, new Position(0, 0)];

    if (maxLinesToConsider > 0) {
      candidateStopsForward.push(cursorPos.getDown(maxLinesToConsider - 1).getLineEnd());
      candidateStopsBackward.push(cursorPos.getUp(maxLinesToConsider - 1).getLineBegin());
    }

    const closestForwardPos = candidateStopsForward.reduce(util.minPosition);
    const closestStopBackward = candidateStopsBackward.reduce(util.maxPosition);

    if (this.searchForward) {
      searchOptions = {
        min: cursorPos,
        max: closestForwardPos,
      };
    } else {
      searchOptions = {
        min: closestStopBackward,
        max: cursorPos,
      };
    }

    return searchOptions;
  }

  /**
   * Puts the closest matches to the cursor first in the list
   * depending on if we are looking forward or backward.
   */
  protected reorderMatches(matches: Match[]) {
    if (this.searchForward) {
      return matches;
    } else {
      return matches.reverse();
    }
  }

  protected searchVisibleRange(vimState: VimState, searchRegex: RegExp): Match[] {
    const searchOptions: SearchOptions = this.createSearchOptions(
      vimState.editor.visibleRanges[0].start.getLineBegin(),
      vimState.editor.visibleRanges[0].end.getLineEnd(),
      vimState.cursorStopPosition,
      vimState.document.lineCount
    );

    const matches = SearchUtil.searchDocument(
      vimState.document,
      vimState.cursorStopPosition,
      searchRegex,
      searchOptions
    );

    return this.reorderMatches(matches);
  }

  protected searchWholeDocument(vimState: VimState, searchRegex: RegExp): Match[] {
    let searchOptions;

    searchOptions = this.createSearchOptions(
      new Position(0, 0),
      new Position(vimState.document.lineCount, 0).getLineEnd(),
      vimState.cursorStopPosition,
      vimState.document.lineCount
    );

    const matches = SearchUtil.searchDocument(
      vimState.document,
      vimState.cursorStopPosition,
      searchRegex,
      searchOptions
    );

    return this.reorderMatches(matches);
  }

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    return this.execActionWithCount(position, vimState, 1);
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number,
    searchString?: string
  ): Promise<Position | IMovement> {
    this.highlighter = vimState.sneak.sneakHighlighter;
    this.operator = vimState.recordedState.operator;
    this.previousMode = vimState.currentMode;
    this.previousCursorStart = vimState.cursorStartPosition;
    this.labelModeEnabled = configuration.sneakLabelMode;

    if (!searchString) {
      if (this.keysPressed[2] === '\n') {
        searchString = this.keysPressed[1];
      } else {
        searchString = this.keysPressed[1] + this.keysPressed[2];
      }
    }

    let searchRegex: RegExp = new RegExp(searchString, 'g');

    if (configuration.sneakUseIgnorecaseAndSmartcase) {
      searchRegex = SearchUtil.generateRegexFromString(
        searchString,
        configuration.ignorecase,
        configuration.smartcase
      );
    }

    if (!this.isRepeat) {
      vimState = this.setRepeatableMovements(vimState);
    }

    if (vimState.sneak.lastSneakAction) {
      vimState.sneak.sneakHighlighter.clearDecorations();
    }
    vimState.sneak.lastSneakAction = this;

    const matches = this.searchVisibleRange(vimState, searchRegex);
    let rangesToHighlight = matches.map((match) => match.toRange());

    const simpleMatch = this.getMatchNoHighlightNeeded(matches, vimState, searchRegex, count);

    if (simpleMatch) {
      return this.convertMatchToPosition(simpleMatch);
    }

    let newMovement: Position | IMovement;
    if (this.labelModeEnabled) {
      await vimState.setCurrentMode(Mode.SneakLabelInputMode);

      if (this.isOperatorMovement()) {
        // We do not move cursor yet
        this.isJump = false;
        newMovement = {
          start: vimState.cursorStartPosition,
          stop: vimState.cursorStopPosition,
          failed: true,
        };
      } else {
        rangesToHighlight = rangesToHighlight.slice(1);
        newMovement = this.convertMatchToPosition(matches[0]);
      }
    } else {
      rangesToHighlight = rangesToHighlight.slice(1);
      newMovement = this.convertMatchToPosition(matches[0]);
    }

    this.highlighter.generateMarkersAndDraw(
      rangesToHighlight,
      this.labelModeEnabled,
      vimState.editor
    );

    return newMovement;
  }

  public convertMatchToPosition(match: Match): Position {
    return this.convertRangeToPosition(match.toRange());
  }

  public convertRangeToPosition(range: vscode.Range): Position {
    if (!this.isOperatorMovement()) {
      return range.start;
    }

    if (this.searchForward) {
      return range.end;
    } else {
      return range.start;
    }
  }

  private getMatchNoHighlightNeeded(
    matches: Match[],
    vimState: VimState,
    searchRegex: RegExp,
    count: number
  ): Match | undefined {
    if (matches.length <= 0) {
      const matchesWholeDocument = this.searchWholeDocument(vimState, searchRegex);

      if (matchesWholeDocument.length <= 0) {
        throw VimError.fromCode(ErrorCode.PatternNotFound);
      } else {
        return matchesWholeDocument[0];
      }
    }

    if (matches.length === 1) {
      return matches[0];
    }

    if (count > 1) {
      if (matches[count - 1]) {
        return matches[count - 1];
      } else {
        throw VimError.fromCode(ErrorCode.PatternNotFound);
      }
    }
    return undefined;
  }

  private setRepeatableMovements(vimState: VimState): VimState {
    if (this.searchForward) {
      vimState.lastSemicolonRepeatableMovement = new SneakForward(this.keysPressed, true);
      vimState.lastCommaRepeatableMovement = new SneakBackward(this.keysPressed, true);
    } else {
      vimState.lastSemicolonRepeatableMovement = new SneakBackward(this.keysPressed, true);
      vimState.lastCommaRepeatableMovement = new SneakForward(this.keysPressed, true);
    }

    return vimState;
  }
}

@RegisterAction
export class SneakForward extends SneakAction {
  keys = [
    ['s', '<character>', '<character>'],
    ['z', '<character>', '<character>'],
  ];

  override searchForward = true;
}

@RegisterAction
export class SneakBackward extends SneakAction {
  keys = [
    ['S', '<character>', '<character>'],
    ['Z', '<character>', '<character>'],
  ];

  override searchForward = false;
}

/**
 * This is the label mode action, when we already have the labels displayed and are waiting for the
 * user to enter the mark he wants to jump to.
 * If the mark is not recognized, the action doesn't swallow it, so it gets executed normally (like vim-sneak).
 */
@RegisterAction
class SneakMarkInputJump extends BaseCommand {
  modes = [Mode.SneakLabelInputMode];
  keys = ['<any>'];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const preConditions =
      configuration.sneak &&
      configuration.sneakLabelMode &&
      super.couldActionApply(vimState, keysPressed) &&
      vimState.sneak.lastSneakAction &&
      vimState.sneak.sneakHighlighter.isHighlightingOn();

    return preConditions ?? false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const mark = this.keysPressed[0];

    if (!vimState.sneak.lastSneakAction) {
      await vimState.setCurrentMode(Mode.Normal);
      return;
    }

    const lastSneakAction = vimState.sneak.lastSneakAction;

    let newPosition: Position | undefined = lastSneakAction.getMarkPosition(mark);

    await vimState.setCurrentMode(lastSneakAction.getPreviousMode()!);
    vimState.cursorStartPosition = lastSneakAction.getPreviousCursorStart();

    if (!newPosition) {
      // We only get to this operation if we are in label mode, so previous mode cannot be undefined.
      const modeHandler = await getAndUpdateModeHandler();

      // We execute the key if no mark belongs to it as if it was just a regular action.

      // WARNING: For some reasons the first key using handleMultipleKeyEvent is
      // ignored so we need to send it a random key first before sending the real one
      // pressed by the user. Escape was chosen here because it might prevent some bug
      // by escaping the current mode and return to normal mode.
      modeHandler?.handleMultipleKeyEvents(['<Esc>', this.keysPressed[0]]);
      return;
    }

    const operator = lastSneakAction.getOperator();
    if (operator) {
      newPosition = newPosition.getLeftThroughLineBreaks();
      return operator.run(vimState, position, newPosition);
    } else {
      // if it wasn't an operator movement, we just jump to it
      vimState.cursorStopPosition = newPosition;
      return;
    }
  }
}
