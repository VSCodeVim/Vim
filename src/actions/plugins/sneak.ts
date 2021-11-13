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

  public isHighlightingOn(): boolean {
    return this.highlighter.isHighlightingOn;
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
   * Determines whether we should jump directly to the first result or remain in the current position
   * and display a label at the first result.
   */
  protected shouldJumpToFirstResult(positionFound: boolean): boolean {
    // we should display a mark and not jump to the first result in the event of
    // 1. label mode is enabled
    // AND
    // 2. it's a motion for an operator, not just a jump (the z/Z motion)
    const shouldDisplayLabelAtFirstResult =
      configuration.sneakLabelMode && this.isOperatorMovement();

    return !positionFound && !shouldDisplayLabelAtFirstResult;
  }

  /**
   * Whether the current call to sneak is just a jump or an operator movement.
   */
  protected isOperatorMovement(): boolean {
    return this.keysPressed[0] === this.keys[1][0];
  }

  public override async execAction(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    if (!this.isRepeat) {
      vimState = this.setRepeatableMovements(vimState);
    }

    if (vimState.sneak) {
      vimState.sneak.clearDecorations();
    }
    vimState.sneak = this;

    const editor = vscode.window.activeTextEditor!;
    const document = editor.document;
    const lineCount = document.lineCount;

    if (this.keysPressed[2] === '\n') {
      // Single key sneak
      this.keysPressed[2] = '';
    }

    const searchString = this.keysPressed[1] + this.keysPressed[2];

    this.rangesToHighlight = [];
    let positionFound = false;
    let linesSearched: number = 0;

    let i = position.line;
    const conditionStopNumber = this.getLineConditionStopNumber(lineCount);

    while (i !== conditionStopNumber) {
      linesSearched++;
      if (
        configuration.sneakMaxLinesToConsider !== -1 &&
        linesSearched > configuration.sneakMaxLinesToConsider
      ) {
        break;
      }
      const lineText = document.lineAt(i).text;

      let fromIndex = this.calculateInitialSearchIndex(position, searchString, i, lineText);
      let matchIndex = -1;

      const ignorecase =
        configuration.sneakUseIgnorecaseAndSmartcase &&
        configuration.ignorecase &&
        !(configuration.smartcase && /[A-Z]/.test(searchString));

      while (!this.isLineProcessed(fromIndex, lineText.length)) {
        if (ignorecase) {
          matchIndex = this.search(
            lineText.toLocaleLowerCase(),
            searchString.toLocaleLowerCase(),
            fromIndex
          );
        } else {
          matchIndex = this.search(lineText, searchString, fromIndex);
        }

        if (matchIndex >= 0) {
          if (this.shouldJumpToFirstResult(positionFound)) {
            // We don't highlight the first option, just jump to it
            position = new Position(i, matchIndex);
            positionFound = true;
          } else {
            this.rangesToHighlight.push(
              new vscode.Range(i, matchIndex, i, matchIndex + searchString.length)
            );
          }
        } else {
          // there are no more matches in this line
          break;
        }

        fromIndex = this.updateFromIndex(matchIndex, searchString.length);
      }

      i = this.getNextLineIndex(i);
    }

    if (position.character === -1) {
      return position;
    }

    if (this.rangesToHighlight.length <= 0) {
      throw VimError.fromCode(ErrorCode.PatternNotFound);
    }

    this.highlighter.isHighlightingOn = true;
    if (configuration.sneakLabelMode) {
      this.previousMode = vimState.currentMode;
      this.previousCursorStart = vimState.cursorStartPosition;
      await vimState.setCurrentMode(Mode.SneakLabelInputMode);

      if (this.isOperatorMovement()) {
        this.operator = vimState.recordedState.operator;
        this.isJump = false;
        return {
          start: vimState.cursorStartPosition,
          stop: vimState.cursorStopPosition,
          failed: true,
        };
      }
    }

    return position;
  }

  protected abstract getNextLineIndex(i: number): number;

  protected abstract updateFromIndex(matchIndex: number, length: number): number;

  protected abstract search(lineText: string, searchString: string, fromIndex: number): number;

  protected abstract isLineProcessed(fromIndex: number, length: number): boolean;

  protected abstract calculateInitialSearchIndex(
    position: Position,
    searchString: string,
    i: number,
    lineText: string
  ): number;

  protected abstract getLineConditionStopNumber(lineCount: number): number;

  protected abstract setRepeatableMovements(vimState: VimState): VimState;
}

@RegisterAction
export class SneakForward extends SneakAction {
  keys = [
    ['s', '<character>', '<character>'],
    ['z', '<character>', '<character>'],
  ];
  override isJump = true;

  protected override getNextLineIndex(i: number): number {
    return i + 1;
  }

  protected override updateFromIndex(matchIndex: number, length: number): number {
    return matchIndex + length;
  }

  protected override search(lineText: string, searchString: string, fromIndex: number): number {
    return lineText.indexOf(searchString, fromIndex);
  }

  protected override isLineProcessed(fromIndex: number, length: number): boolean {
    return fromIndex >= length;
  }

  protected override getLineConditionStopNumber(lineCount: number): number {
    return lineCount;
  }

  protected override setRepeatableMovements(vimState: VimState): VimState {
    vimState.lastSemicolonRepeatableMovement = new SneakForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new SneakBackward(this.keysPressed, true);
    return vimState;
  }

  protected override calculateInitialSearchIndex(
    position: Position,
    searchString: string,
    i: number,
    lineText: string
  ): number {
    let fromIndex = 0;
    if (i === position.line) {
      if (
        lineText[position.character] === searchString[0] &&
        lineText[position.character + 1] === searchString[1]
      ) {
        // this happens when we are standing on exactly the string we search for
        // as per the official plugin, we do not consider this
        // also makes the jump work for:
        // rrrrrr
        // will jump for searchString rr like: |rrrrrr => rr|rrrr => rrrr|rr
        fromIndex = position.character + 2;
      } else {
        // Start searching after the current character so we don't find the same match twice
        fromIndex = position.character + 1;
      }
    }

    return fromIndex;
  }
}

@RegisterAction
export class SneakBackward extends SneakAction {
  keys = [
    ['S', '<character>', '<character>'],
    ['Z', '<character>', '<character>'],
  ];

  protected override getNextLineIndex(i: number): number {
    return i - 1;
  }

  protected override updateFromIndex(matchIndex: number, length: number): number {
    return matchIndex - length;
  }

  protected override search(lineText: string, searchString: string, fromIndex: number): number {
    return lineText.lastIndexOf(searchString, fromIndex);
  }

  protected override isLineProcessed(fromIndex: number, length: number): boolean {
    return fromIndex < 0;
  }

  protected override getLineConditionStopNumber(lineCount: number): number {
    return -1;
  }

  protected override setRepeatableMovements(vimState: VimState): VimState {
    vimState.lastSemicolonRepeatableMovement = new SneakBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new SneakForward(this.keysPressed, true);
    return vimState;
  }

  protected override calculateInitialSearchIndex(
    position: Position,
    searchString: string,
    i: number,
    lineText: string
  ): number {
    let fromIndex = +Infinity;

    if (i === position.line) {
      if (
        lineText[position.character] === searchString[0] &&
        lineText[position.character + 1] === searchString[1]
      ) {
        // this happens when we are standing on exactly the string we search for
        // as per the official plugin, we do not consider this
        // also makes the jump work for:
        // rrrrrr
        // will jump for searchString rr like: rrrrrr| => rrrr|rr => rr|rrrr
        fromIndex = position.character - 2;
      } else {
        // Start searching after the current character so we don't find the same match twice
        fromIndex = position.character - 1;
      }
    }

    return fromIndex;
  }
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
    // We are sure we only get to SneakInputMode only if the commented out preconditions are met
    // so we don't have to test them.
    const preConditions =
      // configuration.sneak &&
      // configuration.sneakLabelMode &&
      super.couldActionApply(vimState, keysPressed);
    // vimState.sneak &&
    // vimState.sneak.isHighlightingOn();

    return preConditions;
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
      // pressed by the user. Escape was chosen here but it probably could be anything.
      // If sneak actions randomly stop working look here first.
      modeHandler?.handleMultipleKeyEvents(['<Esc>', this.keysPressed[0]]);
      return;
    }

    const operator = vimState.sneak.getOperator();
    if (operator) {
      // if it was an operator movement, we execute the operator now that we have the final position
      const resultPosition = newPosition.getLeftThroughLineBreaks();
      return operator.run(vimState, position, resultPosition);
    } else {
      // this.isJump = true;
      // if it wasn't an operator movement, we just jump to it
      vimState.cursorStopPosition = newPosition;
      return;
    }
  }
}
