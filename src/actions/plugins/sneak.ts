import { VimState } from '../../state/vimState';
import { configuration } from './../../configuration/configuration';
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
import { maxPosition, minPosition } from '../../util/util';

export abstract class SneakAction extends BaseMovement {
  override isJump = true;

  /**
   * This is where we save the operator in the event of a z/Z motion and label mode so
   * SneakMarkInputJump can reuse it.
   */
  protected operator: IBaseOperator | undefined;

  protected highlighter: SneakHighlighter = new SneakHighlighter(this);

  protected rangesToHighlight: vscode.Range[] = [];

  private previousMode: Mode | undefined;

  private previousCursorStart: Position = new Position(0, 0);

  protected abstract searchForward: boolean;

  public isHighlightingOn(): boolean {
    return this.highlighter.isHighlightingOn();
  }

  public getRangesToHighlight(): vscode.Range[] {
    return this.rangesToHighlight;
  }

  public getOperator(): IBaseOperator | undefined {
    return this.operator;
  }

  public getPreviousMode(): Mode | undefined {
    return this.previousMode;
  }

  public getPreviousCursorStart(): Position {
    return this.previousCursorStart;
  }

  public clearDecorations(): void {
    this.highlighter.clearDecorations();
  }

  public updateDecorations(lastRecognizedAction: BaseAction | undefined) {
    this.highlighter.updateDecorations(lastRecognizedAction);
  }

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const startingLetter =
      vimState.recordedState.operator === undefined ? this.keys[0][0] : this.keys[1][0];

    return (
      configuration.sneak &&
      super.couldActionApply(vimState, keysPressed) &&
      keysPressed[0] === startingLetter
    );
  }

  public getMarkPosition(mark: string): Position | undefined {
    return this.highlighter.getMarkPosition(mark);
  }

  /**
   * Whether the current call to sneak is just a jump or an operator movement.
   */
  protected isOperatorMovement(): boolean {
    return this.keysPressed[0] === this.keys[1][0];
  }

  protected createSearchOptions(
    minBackwardPos: Position,
    maxForwardPos: Position,
    cursorPos: Position,
    documentLineCount: number
  ): SearchOptions {
    let searchOptions: SearchOptions;
    minBackwardPos = maxPosition(minBackwardPos, new Position(0, 0));
    maxForwardPos = minPosition(maxForwardPos, new Position(documentLineCount, 0));

    if (this.searchForward) {
      searchOptions = {
        min: cursorPos,
        max: maxForwardPos,
      };
    } else {
      searchOptions = {
        min: minBackwardPos,
        max: cursorPos,
      };
    }
    return searchOptions;
  }

  /**
   * Puts the closest matches to the cursor first in the list
   * depending on if we are looking forward or backward.
   */
  public reorderMatches(matches: Match[]) {
    if (this.searchForward) {
      return matches;
    } else {
      return matches.reverse();
    }
  }

  protected searchVisibleRange(vimState: VimState, searchString: string): Match[] {
    const searchOptions: SearchOptions = this.createSearchOptions(
      vimState.editor.visibleRanges[0].start,
      vimState.editor.visibleRanges[0].end,
      vimState.cursorStopPosition,
      vimState.document.lineCount
    );

    const matches = SearchUtil.searchDocument(
      vimState.document,
      vimState.cursorStopPosition,
      searchString,
      searchOptions
    );

    return this.reorderMatches(matches);
  }

  protected searchWholeDocumennt(vimState: VimState, searchString: string): Match[] {
    const maxLinesToConsider = configuration.sneakMaxLinesToConsider;
    let searchOptions;

    if (maxLinesToConsider < 0) {
      searchOptions = this.createSearchOptions(
        new Position(0, 0),
        new Position(vimState.document.lineCount, 0),
        vimState.cursorStopPosition,
        vimState.document.lineCount
      );
    } else {
      searchOptions = this.createSearchOptions(
        vimState.cursorStopPosition.getUp(maxLinesToConsider),
        vimState.cursorStopPosition.getDown(maxLinesToConsider),
        vimState.cursorStopPosition,
        vimState.document.lineCount
      );
    }

    const matches = SearchUtil.searchDocument(
      vimState.document,
      vimState.cursorStopPosition,
      searchString,
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
    count: number
  ): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      vimState = this.setRepeatableMovements(vimState);
    }

    if (vimState.sneak) {
      vimState.sneak.clearDecorations();
    }
    vimState.sneak = this;

    if (this.keysPressed[2] === '\n') {
      // Single key sneak
      this.keysPressed[2] = '';
    }

    const searchString = this.keysPressed[1] + this.keysPressed[2];

    const matches = this.searchVisibleRange(vimState, searchString);

    if (matches.length <= 0) {
      const matchesWholeDocument = this.searchWholeDocumennt(vimState, searchString);
      if (matchesWholeDocument.length <= 0) {
        throw VimError.fromCode(ErrorCode.PatternNotFound);
      } else {
        return matchesWholeDocument[0].position;
      }
    }

    if (matches.length === 1) {
      return matches[0].position;
    }

    if (count > 1) {
      if (matches[count - 1]) {
        return matches[count - 1].position;
      } else {
        throw VimError.fromCode(ErrorCode.PatternNotFound);
      }
    }

    const shouldDisplayLabelAtFirstResult =
      configuration.sneakLabelMode && this.isOperatorMovement();

    this.rangesToHighlight = matches.map((match) => match.toRange());

    let newMovement: Position | IMovement;

    if (shouldDisplayLabelAtFirstResult) {
      // We do not move cursor yet
      newMovement = {
        start: vimState.cursorStartPosition,
        stop: vimState.cursorStopPosition,
        failed: true,
      };
    } else {
      this.rangesToHighlight = this.rangesToHighlight.slice(1);
      newMovement = matches[0].position;
    }

    this.highlighter.setHighlighting(true);
    if (configuration.sneakLabelMode) {
      this.previousMode = vimState.currentMode;
      this.previousCursorStart = vimState.cursorStartPosition;
      await vimState.setCurrentMode(Mode.SneakLabelInputMode);

      if (this.isOperatorMovement()) {
        this.operator = vimState.recordedState.operator;
        this.isJump = false;
        newMovement = {
          start: vimState.cursorStartPosition,
          stop: vimState.cursorStopPosition,
          failed: true,
        };
      }
    }

    return newMovement;
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
  keys = ['<character>'];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const preConditions =
      configuration.sneak &&
      configuration.sneakLabelMode &&
      super.couldActionApply(vimState, keysPressed) &&
      vimState.sneak &&
      vimState.sneak.isHighlightingOn();

    return preConditions ?? false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const mark = this.keysPressed[0];

    if (!vimState.sneak) {
      return;
    }

    const newPosition: Position | undefined = vimState.sneak.getMarkPosition(mark);

    await vimState.setCurrentMode(vimState.sneak.getPreviousMode()!);
    vimState.cursorStartPosition = vimState.sneak.getPreviousCursorStart();

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

    const operator = vimState.sneak.getOperator();
    if (operator) {
      // if it was an operator movement, we execute the operator now that we have the final position
      const resultPosition = newPosition.getLeftThroughLineBreaks();
      return operator.run(vimState, position, resultPosition);
    } else {
      // if it wasn't an operator movement, we just jump to it
      vimState.cursorStopPosition = newPosition;
      return;
    }
  }
}
