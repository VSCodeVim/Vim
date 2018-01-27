import * as vscode from 'vscode';
import * as modes from './modes';

import { CommandLine } from '../cmd_line/commandLine';
import { configuration } from '../configuration/configuration';
import { Decoration } from '../configuration/decoration';
import { Remappers } from '../configuration/remapper';
import { Globals } from '../globals';
import { StatusBar } from '../statusBar';
import { allowVSCodeToPropagateCursorUpdatesAndReturnThem } from '../util';
import { Actions, BaseAction, KeypressState } from './../actions/base';
import {
  BaseCommand,
  CommandQuitRecordMacro,
  DocumentContentChangeAction,
} from './../actions/commands/actions';
import { CommandInsertInInsertMode, CommandInsertPreviousText } from './../actions/commands/insert';
import { BaseMovement, isIMovement } from './../actions/motion';
import { PairMatcher } from './../common/matching/matcher';
import { Position, PositionDiff } from './../common/motion/position';
import { Range } from './../common/motion/range';
import { Register, RegisterMode } from './../register/register';
import { RecordedState } from './../state/recordedState';
import { VimState } from './../state/vimState';
import { taskQueue } from './../taskQueue';
import { TextEditor } from './../textEditor';
import {
  areAnyTransformationsOverlapping,
  isTextTransformation,
  TextTransformations,
} from './../transformations/transformations';
import { Mode, ModeName, VSCodeVimCursorType } from './mode';

export class ModeHandler implements vscode.Disposable {
  private _disposables: vscode.Disposable[] = [];
  private _modes: Mode[];
  private _remappers: Remappers;

  public vimState: VimState;

  get currentMode(): Mode {
    return this._modes.find(mode => mode.isActive)!;
  }

  constructor() {
    this._remappers = new Remappers();
    this._modes = [
      new modes.NormalMode(),
      new modes.InsertMode(),
      new modes.VisualMode(),
      new modes.VisualBlockMode(),
      new modes.VisualLineMode(),
      new modes.SearchInProgressMode(),
      new modes.ReplaceMode(),
      new modes.EasyMotionMode(),
      new modes.EasyMotionInputMode(),
      new modes.SurroundInputMode(),
      new modes.DisabledMode(),
    ];

    this.vimState = new VimState(vscode.window.activeTextEditor!, configuration.startInInsertMode);
    this.setCurrentMode(this.vimState.currentMode);

    // Sometimes, Visual Studio Code will start the cursor in a position which
    // is not (0, 0) - e.g., if you previously edited the file and left the
    // cursor somewhere else when you closed it. This will set our cursor's
    // position to the position that VSC set it to.

    // This also makes things like gd work.
    // For whatever reason, the editor positions aren't updated until after the
    // stack clears, which is why this setTimeout is necessary
    setTimeout(() => {
      this.syncCursors();
    }, 0);

    // Handle scenarios where mouse used to change current position.
    const disposable = vscode.window.onDidChangeTextEditorSelection(e => {
      if (configuration.disableExt) {
        return;
      }

      taskQueue.enqueueTask(
        () => this.handleSelectionChange(e),
        undefined,
        /**
         * We don't want these to become backlogged! If they do, we'll update
         * the selection to an incorrect value and see a jittering cursor.
         */
        true
      );
    });

    this._disposables.push(disposable);
    this._disposables.push(this.vimState);
  }

  /**
   * This is easily the worst function in VSCodeVim.
   *
   * We need to know when VSCode has updated our selection, so that we can sync
   * that internally. Unfortunately, VSCode has a habit of calling this
   * function at weird times, or or with incomplete information, so we have to
   * do a lot of voodoo to make sure we're updating the cursors correctly.
   *
   * Even worse, we don't even know how to test this stuff.
   *
   * Anyone who wants to change the behavior of this method should make sure
   * all selection related test cases pass. Follow this spec
   * https://gist.github.com/rebornix/d21d1cc060c009d4430d3904030bd4c1 to
   * perform the manual testing.
   */
  private async handleSelectionChange(e: vscode.TextEditorSelectionChangeEvent): Promise<void> {
    if (Globals.isTesting) {
      return;
    }

    if (e.textEditor !== this.vimState.editor) {
      return;
    }

    if (this.vimState.focusChanged) {
      this.vimState.focusChanged = false;
      return;
    }

    if (this.currentMode.name === ModeName.EasyMotionMode) {
      return;
    }

    let selection = e.selections[0];
    if (
      (e.selections.length !== this.vimState.allCursors.length || this.vimState.isMultiCursor) &&
      this.vimState.currentMode !== ModeName.VisualBlock
    ) {
      // Number of selections changed, make sure we know about all of them still
      this.vimState.allCursors = e.textEditor.selections.map(
        sel =>
          new Range(
            // Adjust the cursor positions because cursors & selections don't match exactly
            sel.anchor.compareTo(sel.active) > 0
              ? Position.FromVSCodePosition(sel.anchor).getLeft()
              : Position.FromVSCodePosition(sel.anchor),
            Position.FromVSCodePosition(sel.active)
          )
      );
      await this.updateView(this.vimState);
      return;
    }

    /**
     * We only trigger our view updating process if it's a mouse selection.
     * Otherwise we only update our internal cursor postions accordingly.
     */
    if (e.kind !== vscode.TextEditorSelectionChangeKind.Mouse) {
      if (selection) {
        if (this.currentMode.isVisualMode) {
          /**
           * In Visual Mode, our `cursorPosition` and `cursorStartPosition` can not refect `active`,
           * `start`, `end` and `anchor` information in a selection.
           * See `Fake block cursor with text decoration` section of `updateView` method.
           */
          return;
        }

        this.vimState.cursorPosition = Position.FromVSCodePosition(selection.active);
        this.vimState.cursorStartPosition = Position.FromVSCodePosition(selection.start);
      }
      return;
    }

    if (this.vimState.isMultiCursor && e.selections.length === 1) {
      this.vimState.isMultiCursor = false;
    }

    if (this.vimState.prevSelection && this.vimState.prevSelection.isEqual(selection)) {
      return;
    }

    if (this.vimState.currentMode === ModeName.SearchInProgressMode) {
      return;
    }

    let toDraw = false;

    if (selection) {
      let newPosition = new Position(selection.active.line, selection.active.character);

      // Only check on a click, not a full selection (to prevent clicking past EOL)
      if (newPosition.character >= newPosition.getLineEnd().character && selection.isEmpty) {
        if (this.vimState.currentMode !== ModeName.Insert) {
          this.vimState.lastClickWasPastEol = true;

          // This prevents you from mouse clicking past the EOL
          newPosition = new Position(
            newPosition.line,
            Math.max(newPosition.getLineEnd().character - 1, 0)
          );

          // Switch back to normal mode since it was a click not a selection
          this.setCurrentMode(ModeName.Normal);

          toDraw = true;
        }
      } else if (selection.isEmpty) {
        this.vimState.lastClickWasPastEol = false;
      }

      this.vimState.cursorPosition = newPosition;
      this.vimState.cursorStartPosition = newPosition;
      this.vimState.desiredColumn = newPosition.character;

      // start visual mode?

      if (
        selection.anchor.line === selection.active.line &&
        selection.anchor.character >= newPosition.getLineEnd().character - 1 &&
        selection.active.character >= newPosition.getLineEnd().character - 1
      ) {
        // This prevents you from selecting EOL
      } else if (!selection.anchor.isEqual(selection.active)) {
        var selectionStart = new Position(selection.anchor.line, selection.anchor.character);

        if (selectionStart.character > selectionStart.getLineEnd().character) {
          selectionStart = new Position(selectionStart.line, selectionStart.getLineEnd().character);
        }

        this.vimState.cursorStartPosition = selectionStart;

        if (selectionStart.compareTo(newPosition) > 0) {
          this.vimState.cursorStartPosition = this.vimState.cursorStartPosition.getLeft();
        }

        // If we prevented from clicking past eol but it is part of this selection, include the last char
        if (this.vimState.lastClickWasPastEol) {
          const newStart = new Position(selection.anchor.line, selection.anchor.character + 1);
          this.vimState.editor.selection = new vscode.Selection(newStart, selection.end);
          this.vimState.cursorStartPosition = selectionStart;
          this.vimState.lastClickWasPastEol = false;
        }

        if (
          configuration.mouseSelectionGoesIntoVisualMode &&
          !this.currentMode.isVisualMode &&
          this.currentMode.name !== ModeName.Insert
        ) {
          this.setCurrentMode(ModeName.Visual);

          // double click mouse selection causes an extra character to be selected so take one less character
        }
      } else {
        if (this.vimState.currentMode !== ModeName.Insert) {
          this.setCurrentMode(ModeName.Normal);
        }
      }

      await this.updateView(this.vimState, { drawSelection: toDraw, revealRange: true });
    }
  }

  private setCurrentMode(modeName: ModeName): void {
    this.vimState.currentMode = modeName;
    for (let mode of this._modes) {
      mode.isActive = mode.name === modeName;
    }
  }

  async handleKeyEvent(key: string): Promise<Boolean> {
    const now = Number(new Date());

    // Rewrite commands
    if (configuration.overrideCopy) {
      // The conditions when you trigger a "copy" rather than a ctrl-c are
      // too sophisticated to be covered by the "when" condition in package.json
      if (key === '<D-c>') {
        key = '<copy>';
      }

      if (key === '<C-c>' && process.platform !== 'darwin') {
        if (
          !configuration.useCtrlKeys ||
          this.vimState.currentMode === ModeName.Visual ||
          this.vimState.currentMode === ModeName.VisualBlock ||
          this.vimState.currentMode === ModeName.VisualLine
        ) {
          key = '<copy>';
        }
      }
    }

    // <C-d> triggers "add selection to next find match" by default,
    // unless users explicity make <C-d>: true
    if (key === '<C-d>' && !(configuration.handleKeys['<C-d>'] === true)) {
      key = '<D-d>';
    }

    this.vimState.cursorPositionJustBeforeAnythingHappened = this.vimState.allCursors.map(
      x => x.stop
    );
    this.vimState.recordedState.commandList.push(key);

    try {
      // Take the count prefix out to perform the correct remapping.
      const keys = this.vimState.recordedState.getCurrentCommandWithoutCountPrefix();
      const withinTimeout = now - this.vimState.lastKeyPressedTimestamp < configuration.timeout;

      let handled = false;

      /**
       * Check that
       *
       * 1) We are not already performing a nonrecursive remapping.
       * 2) We haven't timed out of our previous remapping.
       * 3) We are not running tests as user remappings bork tests
       */
      if (
        !this.vimState.isCurrentlyPerformingRemapping &&
        (withinTimeout || keys.length === 1) &&
        !Globals.isTesting
      ) {
        handled = await this._remappers.sendKey(keys, this, this.vimState);
      }

      if (handled) {
        this.vimState.recordedState.resetCommandList();
      } else {
        this.vimState = await this.handleKeyEventHelper(key, this.vimState);
      }
    } catch (e) {
      console.error(e);
      throw e;
    }

    this.vimState.lastKeyPressedTimestamp = now;
    this._renderStatusBar();

    return true;
  }

  private async handleKeyEventHelper(key: string, vimState: VimState): Promise<VimState> {
    // Just nope right out of here.
    if (vscode.window.activeTextEditor !== this.vimState.editor) {
      return this.vimState;
    }

    // Catch any text change not triggered by us (example: tab completion).
    vimState.historyTracker.addChange(this.vimState.cursorPositionJustBeforeAnythingHappened);

    let recordedState = vimState.recordedState;

    recordedState.actionKeys.push(key);
    vimState.keyHistory.push(key);

    let result = Actions.getRelevantAction(recordedState.actionKeys, vimState);
    switch (result) {
      case KeypressState.NoPossibleMatch:
        if (!this._remappers.isPotentialRemap) {
          vimState.recordedState = new RecordedState();
          return vimState;
        }
        break;
      case KeypressState.WaitingOnKeys:
        return vimState;
    }

    let action = result as BaseAction;
    let actionToRecord: BaseAction | undefined = action;

    if (recordedState.actionsRun.length === 0) {
      recordedState.actionsRun.push(action);
    } else {
      let lastAction = recordedState.actionsRun[recordedState.actionsRun.length - 1];

      if (lastAction instanceof DocumentContentChangeAction) {
        lastAction.keysPressed.push(key);

        if (
          action instanceof CommandInsertInInsertMode ||
          action instanceof CommandInsertPreviousText
        ) {
          // delay the macro recording
          actionToRecord = undefined;
        } else {
          // Push document content change to the stack
          lastAction.contentChanges = lastAction.contentChanges.concat(
            vimState.historyTracker.currentContentChanges.map(x => ({
              textDiff: x,
              positionDiff: new PositionDiff(0, 0),
            }))
          );
          vimState.historyTracker.currentContentChanges = [];
          recordedState.actionsRun.push(action);
        }
      } else {
        if (
          action instanceof CommandInsertInInsertMode ||
          action instanceof CommandInsertPreviousText
        ) {
          // This means we are already in Insert Mode but there is still not DocumentContentChangeAction in stack
          vimState.historyTracker.currentContentChanges = [];
          let newContentChange = new DocumentContentChangeAction();
          newContentChange.keysPressed.push(key);
          recordedState.actionsRun.push(newContentChange);
          actionToRecord = newContentChange;
        } else {
          recordedState.actionsRun.push(action);
        }
      }
    }

    if (
      vimState.isRecordingMacro &&
      actionToRecord &&
      !(actionToRecord instanceof CommandQuitRecordMacro)
    ) {
      vimState.recordedMacro.actionsRun.push(actionToRecord);
    }

    vimState = await this.runAction(vimState, recordedState, action);

    if (vimState.currentMode === ModeName.Insert) {
      recordedState.isInsertion = true;
    }

    // Update view
    await this.updateView(vimState);

    return vimState;
  }

  private async runAction(
    vimState: VimState,
    recordedState: RecordedState,
    action: BaseAction
  ): Promise<VimState> {
    let ranRepeatableAction = false;
    let ranAction = false;

    // If arrow keys or mouse was used prior to entering characters while in insert mode, create an undo point
    // this needs to happen before any changes are made

    /*

    TODO: This causes . to crash vscodevim for some reason.

    if (!vimState.isMultiCursor) {
      let prevPos = vimState.historyTracker.getLastHistoryEndPosition();
      if (prevPos !== undefined && !vimState.isRunningDotCommand) {
        if (vimState.cursorPositionJustBeforeAnythingHappened[0].line !== prevPos[0].line ||
          vimState.cursorPositionJustBeforeAnythingHappened[0].character !== prevPos[0].character) {
          vimState.globalState.previousFullAction = recordedState;
          vimState.historyTracker.finishCurrentStep();
        }
      }
    }
    */

    if (vimState.currentMode === ModeName.Visual) {
      vimState.allCursors = vimState.allCursors.map(
        x =>
          x.start.isEarlierThan(x.stop) ? x.withNewStop(x.stop.getLeftThroughLineBreaks(true)) : x
      );
    }
    if (action instanceof BaseMovement) {
      ({ vimState, recordedState } = await this.executeMovement(vimState, action));
      ranAction = true;
    }

    if (action instanceof BaseCommand) {
      vimState = await action.execCount(vimState.cursorPosition, vimState);

      await this.executeCommand(vimState);

      if (action.isCompleteAction) {
        ranAction = true;
      }

      if (action.canBeRepeatedWithDot) {
        ranRepeatableAction = true;
      }
    }

    if (action instanceof DocumentContentChangeAction) {
      vimState = await action.exec(vimState.cursorPosition, vimState);
    }

    // Update mode (note the ordering allows you to go into search mode,
    // then return and have the motion immediately applied to an operator).
    const prevState = this.currentMode.name;
    if (vimState.currentMode !== this.currentMode.name) {
      this.setCurrentMode(vimState.currentMode);

      // We don't want to mark any searches as a repeatable action
      if (vimState.currentMode === ModeName.Normal && prevState !== ModeName.SearchInProgressMode) {
        ranRepeatableAction = true;
      }
    }

    if (recordedState.operatorReadyToExecute(vimState.currentMode)) {
      vimState = await this.executeOperator(vimState);

      vimState.recordedState.hasRunOperator = true;
      ranRepeatableAction = vimState.recordedState.operator.canBeRepeatedWithDot;
      ranAction = true;
    }

    if (vimState.currentMode === ModeName.Visual) {
      vimState.allCursors = vimState.allCursors.map(
        x =>
          x.start.isEarlierThan(x.stop)
            ? x.withNewStop(
                x.stop.isLineEnd() ? x.stop.getRightThroughLineBreaks() : x.stop.getRight()
              )
            : x
      );
    }
    // And then we have to do it again because an operator could
    // have changed it as well. (TODO: do you even decomposition bro)

    if (vimState.currentMode !== this.currentMode.name) {
      this.setCurrentMode(vimState.currentMode);

      if (vimState.currentMode === ModeName.Normal) {
        ranRepeatableAction = true;
      }
    }

    if (ranAction && vimState.currentMode !== ModeName.Insert) {
      vimState.recordedState.resetCommandList();
    }

    ranRepeatableAction =
      (ranRepeatableAction && vimState.currentMode === ModeName.Normal) ||
      this.createUndoPointForBrackets(vimState);
    ranAction = ranAction && vimState.currentMode === ModeName.Normal;

    // Record down previous action and flush temporary state
    if (ranRepeatableAction) {
      vimState.globalState.previousFullAction = vimState.recordedState;

      if (recordedState.isInsertion) {
        Register.putByKey(recordedState, '.');
      }
    }

    // Updated desired column
    const movement = action instanceof BaseMovement ? action : undefined;

    if (
      (movement && !movement.doesntChangeDesiredColumn) ||
      (!movement && vimState.currentMode !== ModeName.VisualBlock)
    ) {
      // We check !operator here because e.g. d$ should NOT set the desired column to EOL.

      if (movement && movement.setsDesiredColumnToEOL && !recordedState.operator) {
        vimState.desiredColumn = Number.POSITIVE_INFINITY;
      } else {
        vimState.desiredColumn = vimState.cursorPosition.character;
      }
    }

    if (ranAction) {
      vimState.recordedState = new RecordedState();

      // Return to insert mode after 1 command in this case for <C-o>
      if (vimState.returnToInsertAfterCommand) {
        if (vimState.actionCount > 0) {
          vimState.returnToInsertAfterCommand = false;
          vimState.actionCount = 0;
          this.setCurrentMode(ModeName.Insert);
        } else {
          vimState.actionCount++;
        }
      }
    }

    // track undo history
    if (!this.vimState.focusChanged) {
      // important to ensure that focus didn't change, otherwise
      // we'll grab the text of the incorrect active window and assume the
      // whole document changed!

      if (this.vimState.alteredHistory) {
        this.vimState.alteredHistory = false;
        vimState.historyTracker.ignoreChange();
      } else {
        vimState.historyTracker.addChange(this.vimState.cursorPositionJustBeforeAnythingHappened);
      }
    }

    // Don't record an undo point for every action of a macro, only at the very end
    if (ranRepeatableAction && !vimState.isReplayingMacro) {
      vimState.historyTracker.finishCurrentStep();
    }

    recordedState.actionKeys = [];
    vimState.currentRegisterMode = RegisterMode.AscertainFromCurrentMode;

    if (this.currentMode.name === ModeName.Normal) {
      vimState.cursorStartPosition = vimState.cursorPosition;
    }

    // Ensure cursor is within bounds

    for (const { stop, i } of Range.IterateRanges(vimState.allCursors)) {
      if (stop.line >= TextEditor.getLineCount()) {
        vimState.allCursors[i] = vimState.allCursors[i].withNewStop(
          vimState.cursorPosition.getDocumentEnd()
        );
      }

      const currentLineLength = TextEditor.getLineAt(stop).text.length;

      if (
        vimState.currentMode === ModeName.Normal &&
        stop.character >= currentLineLength &&
        currentLineLength > 0
      ) {
        vimState.allCursors[i] = vimState.allCursors[i].withNewStop(
          stop.getLineEnd().getLeftThroughLineBreaks(true)
        );
      }
    }

    // Update the current history step to have the latest cursor position

    vimState.historyTracker.setLastHistoryEndPosition(vimState.allCursors.map(x => x.stop));

    if (this.currentMode.isVisualMode) {
      // Store selection for commands like gv
      this.vimState.lastVisualMode = this.vimState.currentMode;
      this.vimState.lastVisualSelectionStart = this.vimState.cursorStartPosition;
      this.vimState.lastVisualSelectionEnd = this.vimState.cursorPosition;
    }

    // Make sure no two cursors are at the same location.
    // This is a consequence of the fact that allCursors is not a Set.

    // TODO: It should be a set.

    const resultingList: Range[] = [];

    for (const cursor of vimState.allCursors) {
      let shouldAddToList = true;

      for (const alreadyAddedCursor of resultingList) {
        if (cursor.equals(alreadyAddedCursor)) {
          shouldAddToList = false;
          break;
        }
      }

      if (shouldAddToList) {
        resultingList.push(cursor);
      }
    }

    vimState.allCursors = resultingList;

    return vimState;
  }

  private async executeMovement(
    vimState: VimState,
    movement: BaseMovement
  ): Promise<{ vimState: VimState; recordedState: RecordedState }> {
    vimState.lastMovementFailed = false;
    let recordedState = vimState.recordedState;

    for (let i = 0; i < vimState.allCursors.length; i++) {
      /**
       * Essentially what we're doing here is pretending like the
       * current VimState only has one cursor (the cursor that we just
       * iterated to).
       *
       * We set the cursor position to be equal to the iterated one,
       * and then set it back immediately after we're done.
       *
       * The slightly more complicated logic here allows us to write
       * Action definitions without having to think about multiple
       * cursors in almost all cases.
       */
      let cursorPosition = vimState.allCursors[i].stop;
      const old = vimState.cursorPosition;

      vimState.cursorPosition = cursorPosition;
      const result = await movement.execActionWithCount(
        cursorPosition,
        vimState,
        recordedState.count
      );
      vimState.cursorPosition = old;

      if (result instanceof Position) {
        vimState.allCursors[i] = vimState.allCursors[i].withNewStop(result);

        if (!this.currentMode.isVisualMode && !vimState.recordedState.operator) {
          vimState.allCursors[i] = vimState.allCursors[i].withNewStart(result);
        }
      } else if (isIMovement(result)) {
        if (result.failed) {
          vimState.recordedState = new RecordedState();
          vimState.lastMovementFailed = true;
        }

        vimState.allCursors[i] = Range.FromIMovement(result);

        if (result.registerMode) {
          vimState.currentRegisterMode = result.registerMode;
        }
      }

      if (movement.canBeRepeatedWithSemicolon(vimState, result)) {
        VimState.lastRepeatableMovement = movement;
      }
    }

    vimState.recordedState.count = 0;

    // Keep the cursor within bounds
    if (vimState.currentMode !== ModeName.Normal || recordedState.operator) {
      let stop = vimState.cursorPosition;

      // Vim does this weird thing where it allows you to select and delete
      // the newline character, which it places 1 past the last character
      // in the line. This is why we use > instead of >=.

      if (stop.character > Position.getLineLength(stop.line)) {
        vimState.cursorPosition = stop.getLineEnd();
      }
    }

    return { vimState, recordedState };
  }

  private async executeOperator(vimState: VimState): Promise<VimState> {
    let recordedState = vimState.recordedState;

    if (!recordedState.operator) {
      throw new Error("what in god's name");
    }

    let resultVimState = vimState;

    // TODO - if actions were more pure, this would be unnecessary.
    const cachedMode = this.currentMode;
    const cachedRegister = vimState.currentRegisterMode;

    const resultingCursors: Range[] = [];
    let i = 0;

    let resultingModeName: ModeName;
    let startingModeName = vimState.currentMode;

    for (let { start, stop } of vimState.allCursors) {
      if (start.compareTo(stop) > 0) {
        [start, stop] = [stop, start];
      }

      if (!cachedMode.isVisualMode && cachedRegister !== RegisterMode.LineWise) {
        stop = stop.getLeftThroughLineBreaks(true);
      }

      if (this.currentMode.name === ModeName.VisualLine) {
        start = start.getLineBegin();
        stop = stop.getLineEnd();

        vimState.currentRegisterMode = RegisterMode.LineWise;
      }

      recordedState.operator.multicursorIndex = i++;

      resultVimState.currentMode = startingModeName;

      // We run the repeat version of an operator if the last 2 operators are the same.
      if (
        recordedState.operators.length > 1 &&
        recordedState.operators.reverse()[0].constructor ===
          recordedState.operators.reverse()[1].constructor
      ) {
        resultVimState = await recordedState.operator.runRepeat(
          resultVimState,
          start,
          recordedState.count
        );
      } else {
        resultVimState = await recordedState.operator.run(resultVimState, start, stop);
      }

      for (const transformation of resultVimState.recordedState.transformations) {
        if (isTextTransformation(transformation) && transformation.cursorIndex === undefined) {
          transformation.cursorIndex = recordedState.operator.multicursorIndex;
        }
      }

      resultingModeName = resultVimState.currentMode;

      let resultingRange = new Range(
        resultVimState.cursorStartPosition,
        resultVimState.cursorPosition
      );

      resultingCursors.push(resultingRange);
    }

    if (vimState.recordedState.transformations.length > 0) {
      await this.executeCommand(vimState);
    } else {
      // Keep track of all cursors (in the case of multi-cursor).

      resultVimState.allCursors = resultingCursors;

      const selections: vscode.Selection[] = [];

      for (const cursor of vimState.allCursors) {
        selections.push(new vscode.Selection(cursor.start, cursor.stop));
      }

      this.vimState.editor.selections = selections;
    }

    return resultVimState;
  }

  private async executeCommand(vimState: VimState) {
    const transformations = vimState.recordedState.transformations;

    if (transformations.length === 0) {
      return;
    }

    const textTransformations: TextTransformations[] = transformations.filter(x =>
      isTextTransformation(x)
    ) as any;
    const otherTransformations = transformations.filter(x => !isTextTransformation(x));

    let accumulatedPositionDifferences: { [key: number]: PositionDiff[] } = {};

    const doTextEditorEdit = (command: TextTransformations, edit: vscode.TextEditorEdit) => {
      switch (command.type) {
        case 'insertText':
          edit.insert(command.position, command.text);
          break;
        case 'replaceText':
          edit.replace(new vscode.Selection(command.end, command.start), command.text);
          break;
        case 'deleteText':
          let matchRange = PairMatcher.immediateMatchingBracket(command.position);
          if (matchRange) {
            edit.delete(matchRange);
          }
          edit.delete(
            new vscode.Range(command.position, command.position.getLeftThroughLineBreaks())
          );
          break;
        case 'deleteRange':
          edit.delete(new vscode.Selection(command.range.start, command.range.stop));
          break;
        case 'moveCursor':
          break;
        default:
          console.warn(`Unhandled text transformation type: ${command.type}.`);
          break;
      }

      if (command.cursorIndex === undefined) {
        throw new Error('No cursor index - this should never ever happen!');
      }

      if (command.diff) {
        if (!accumulatedPositionDifferences[command.cursorIndex]) {
          accumulatedPositionDifferences[command.cursorIndex] = [];
        }

        accumulatedPositionDifferences[command.cursorIndex].push(command.diff);
      }
    };

    if (textTransformations.length > 0) {
      if (areAnyTransformationsOverlapping(textTransformations)) {
        console.log(
          `Text transformations are overlapping. Falling back to serial
           transformations. This is generally a very bad sign. Try to make
           your text transformations operate on non-overlapping ranges.`
        );

        // TODO: Select one transformation for every cursor and run them all
        // in parallel. Repeat till there are no more transformations.
        for (const command of textTransformations) {
          await this.vimState.editor.edit(edit => doTextEditorEdit(command, edit));
        }
      } else {
        // This is the common case!

        /**
         * batch all text operations together as a single operation
         * (this is primarily necessary for multi-cursor mode, since most
         * actions will trigger at most one text operation).
         */
        await this.vimState.editor.edit(edit => {
          for (const command of textTransformations) {
            doTextEditorEdit(command, edit);
          }
        });
      }
    }

    for (const command of otherTransformations) {
      switch (command.type) {
        case 'insertTextVSCode':
          await TextEditor.insert(command.text);

          vimState.cursorStartPosition = Position.FromVSCodePosition(
            this.vimState.editor.selection.start
          );
          vimState.cursorPosition = Position.FromVSCodePosition(this.vimState.editor.selection.end);
          break;

        case 'showCommandLine':
          await CommandLine.PromptAndRun(vimState.commandInitialText, this.vimState);
          this.updateView(this.vimState);
          break;

        case 'dot':
          if (!vimState.globalState.previousFullAction) {
            return vimState; // TODO(bell)
          }

          const clonedAction = vimState.globalState.previousFullAction.clone();

          await this.rerunRecordedState(vimState, vimState.globalState.previousFullAction);

          vimState.globalState.previousFullAction = clonedAction;
          break;
        case 'macro':
          let recordedMacro = (await Register.getByKey(command.register)).text as RecordedState;

          vimState.isReplayingMacro = true;

          if (command.replay === 'contentChange') {
            vimState = await this.runMacro(vimState, recordedMacro);
          } else {
            let keyStrokes: string[] = [];
            for (let action of recordedMacro.actionsRun) {
              keyStrokes = keyStrokes.concat(action.keysPressed);
            }
            this.vimState.recordedState = new RecordedState();
            await this.handleMultipleKeyEvents(keyStrokes);
          }

          vimState.isReplayingMacro = false;
          vimState.historyTracker.lastInvokedMacro = recordedMacro;

          if (vimState.lastMovementFailed) {
            // movement in last invoked macro failed then we should stop all following repeating macros.
            // Besides, we should reset `lastMovementFailed`.
            vimState.lastMovementFailed = false;
            return;
          }

          break;
        case 'contentChange':
          for (const change of command.changes) {
            await TextEditor.insert(change.text);
            vimState.cursorPosition = Position.FromVSCodePosition(
              this.vimState.editor.selection.start
            );
          }
          const newPos = vimState.cursorPosition.add(command.diff);
          this.vimState.editor.selection = new vscode.Selection(newPos, newPos);
          break;
        case 'tab':
          await vscode.commands.executeCommand('tab');
          if (command.diff) {
            if (command.cursorIndex === undefined) {
              throw new Error('No cursor index - this should never ever happen!');
            }

            if (!accumulatedPositionDifferences[command.cursorIndex]) {
              accumulatedPositionDifferences[command.cursorIndex] = [];
            }

            accumulatedPositionDifferences[command.cursorIndex].push(command.diff);
          }
          break;
        default:
          console.warn(`Unhandled text transformation type: ${command.type}.`);
          break;
      }
    }

    const selections = this.vimState.editor.selections.map(x => {
      let y = Range.FromVSCodeSelection(x);
      y = y.start.isEarlierThan(y.stop) ? y.withNewStop(y.stop.getLeftThroughLineBreaks(true)) : y;
      return new vscode.Selection(
        new vscode.Position(y.start.line, y.start.character),
        new vscode.Position(y.stop.line, y.stop.character)
      );
    });
    const firstTransformation = transformations[0];
    const manuallySetCursorPositions =
      (firstTransformation.type === 'deleteRange' ||
        firstTransformation.type === 'replaceText' ||
        firstTransformation.type === 'insertText') &&
      firstTransformation.manuallySetCursorPositions;

    // We handle multiple cursors in a different way in visual block mode, unfortunately.
    // TODO - refactor that out!
    if (vimState.currentMode !== ModeName.VisualBlock && !manuallySetCursorPositions) {
      vimState.allCursors = [];

      const resultingCursors: Range[] = [];

      for (let i = 0; i < selections.length; i++) {
        let sel = Range.FromVSCodeSelection(selections[i]);

        let resultStart = Position.FromVSCodePosition(sel.start);
        let resultEnd = Position.FromVSCodePosition(sel.stop);

        if (accumulatedPositionDifferences[i] && accumulatedPositionDifferences[i].length > 0) {
          for (const diff of accumulatedPositionDifferences[i]) {
            resultStart = resultStart.add(diff);
            resultEnd = resultEnd.add(diff);
          }

          sel = new Range(resultStart, resultEnd);
        } else {
          sel = new Range(
            Position.FromVSCodePosition(sel.start),
            Position.FromVSCodePosition(sel.stop)
          );
        }

        if (vimState.recordedState.operatorPositionDiff) {
          sel = sel.add(vimState.recordedState.operatorPositionDiff);
        }

        resultingCursors.push(sel);
      }

      vimState.recordedState.operatorPositionDiff = undefined;

      vimState.allCursors = resultingCursors;
    } else {
      if (accumulatedPositionDifferences[0] !== undefined) {
        if (accumulatedPositionDifferences[0].length > 0) {
          vimState.cursorPosition = vimState.cursorPosition.add(
            accumulatedPositionDifferences[0][0]
          );
          vimState.cursorStartPosition = vimState.cursorStartPosition.add(
            accumulatedPositionDifferences[0][0]
          );
        }
      }
    }

    /**
     * This is a bit of a hack because Visual Block Mode isn't fully on board with
     * the new text transformation style yet.
     *
     * (TODO)
     */
    if (firstTransformation.type === 'deleteRange') {
      if (firstTransformation.collapseRange) {
        vimState.cursorPosition = new Position(
          vimState.cursorPosition.line,
          vimState.cursorStartPosition.character
        );
      }
    }

    vimState.recordedState.transformations = [];
    return;
  }

  private async rerunRecordedState(
    vimState: VimState,
    recordedState: RecordedState
  ): Promise<VimState> {
    const actions = recordedState.actionsRun.slice(0);
    const hasRunSurround = recordedState.hasRunSurround;
    const surroundKeys = recordedState.surroundKeys;

    vimState.isRunningDotCommand = true;
    recordedState = new RecordedState();
    vimState.recordedState = recordedState;

    // Replay surround if applicable, otherwise rerun actions
    if (hasRunSurround) {
      await this.handleMultipleKeyEvents(surroundKeys);
    } else {
      let i = 0;
      for (let action of actions) {
        recordedState.actionsRun = actions.slice(0, ++i);
        vimState = await this.runAction(vimState, recordedState, action);

        if (vimState.lastMovementFailed) {
          return vimState;
        }

        await this.updateView(vimState);
      }
      recordedState.actionsRun = actions;
    }
    vimState.isRunningDotCommand = false;

    return vimState;
  }

  private async runMacro(vimState: VimState, recordedMacro: RecordedState): Promise<VimState> {
    const actions = recordedMacro.actionsRun.slice(0);
    let recordedState = new RecordedState();
    vimState.recordedState = recordedState;
    vimState.isRunningDotCommand = true;

    for (let action of actions) {
      recordedState.actionsRun.push(action);
      vimState.keyHistory = vimState.keyHistory.concat(action.keysPressed);

      vimState = await this.runAction(vimState, recordedState, action);

      // We just finished a full action; let's clear out our current state.
      if (vimState.recordedState.actionsRun.length === 0) {
        recordedState = new RecordedState();
        vimState.recordedState = recordedState;
      }

      if (vimState.lastMovementFailed) {
        break;
      }

      await this.updateView(vimState);
    }

    vimState.isRunningDotCommand = false;
    vimState.cursorPositionJustBeforeAnythingHappened = vimState.allCursors.map(x => x.stop);
    return vimState;
  }

  public async updateView(
    vimState: VimState,
    args: { drawSelection: boolean; revealRange: boolean } = {
      drawSelection: true,
      revealRange: true,
    }
  ): Promise<void> {
    // Draw selection (or cursor)

    if (args.drawSelection) {
      let selections: vscode.Selection[];

      if (!vimState.isMultiCursor) {
        let start = vimState.cursorStartPosition;
        let stop = vimState.cursorPosition;

        if (vimState.currentMode === ModeName.Visual) {
          /**
           * Always select the letter that we started visual mode on, no matter
           * if we are in front or behind it. Imagine that we started visual mode
           * with some text like this:
           *
           *   abc|def
           *
           * (The | represents the cursor.) If we now press w, we'll select def,
           * but if we hit b we expect to select abcd, so we need to getRight() on the
           * start of the selection when it precedes where we started visual mode.
           */

          if (start.compareTo(stop) > 0) {
            start = start.getRightThroughLineBreaks();
          }

          selections = [new vscode.Selection(start, stop)];
        } else if (vimState.currentMode === ModeName.VisualLine) {
          selections = [
            new vscode.Selection(
              Position.EarlierOf(start, stop).getLineBegin(),
              Position.LaterOf(start, stop).getLineEnd()
            ),
          ];

          // Maintain cursor position based on which direction the selection is going
          if (start.line <= stop.line) {
            vimState.cursorStartPosition = selections[0].start as Position;
            vimState.cursorPosition = selections[0].end as Position;
          } else {
            vimState.cursorStartPosition = selections[0].end as Position;
            vimState.cursorPosition = selections[0].start as Position;
          }

          // Adjust the selection so that active and anchor are correct, this
          // makes relative line numbers display correctly
          if (
            selections[0].start.line <= selections[0].end.line &&
            vimState.cursorPosition.line <= vimState.cursorStartPosition.line
          ) {
            selections = [new vscode.Selection(selections[0].end, selections[0].start)];
          }
        } else if (vimState.currentMode === ModeName.VisualBlock) {
          selections = [];

          for (const { start: lineStart, end } of Position.IterateLine(vimState)) {
            selections.push(new vscode.Selection(lineStart, end));
          }
        } else {
          selections = [new vscode.Selection(stop, stop)];
        }
      } else {
        // MultiCursor mode is active.

        if (vimState.currentMode === ModeName.Visual) {
          selections = [];

          for (let { start: cursorStart, stop: cursorStop } of vimState.allCursors) {
            if (cursorStart.compareTo(cursorStop) > 0) {
              cursorStart = cursorStart.getRight();
            }

            selections.push(new vscode.Selection(cursorStart, cursorStop));
          }
        } else if (
          vimState.currentMode === ModeName.Normal ||
          vimState.currentMode === ModeName.Insert ||
          vimState.currentMode === ModeName.SearchInProgressMode
        ) {
          selections = [];

          for (const { stop: cursorStop } of vimState.allCursors) {
            selections.push(new vscode.Selection(cursorStop, cursorStop));
          }
        } else {
          console.error('This is pretty bad!');

          selections = [];
        }
      }

      this.vimState.prevSelection = selections[0];
      if (
        vimState.recordedState.actionsRun.filter(x => x instanceof DocumentContentChangeAction)
          .length === 0
      ) {
        this.vimState.editor.selections = selections;
      }
    }

    // Scroll to position of cursor
    if (this.vimState.currentMode === ModeName.SearchInProgressMode) {
      const nextMatch = vimState.globalState.searchState!.getNextSearchMatchPosition(
        vimState.cursorPosition
      ).pos;

      this.vimState.editor.revealRange(new vscode.Range(nextMatch, nextMatch));
    } else {
      if (args.revealRange) {
        this.vimState.editor.revealRange(
          new vscode.Range(vimState.cursorPosition, vimState.cursorPosition)
        );
      }
    }

    let cursorStyle = Mode.translateCursor(this.currentMode.cursorType);
    if (
      this.currentMode.cursorType === VSCodeVimCursorType.Native &&
      configuration.userCursor !== undefined
    ) {
      cursorStyle = configuration.userCursor;
    }

    cursorStyle = configuration.modeToCursorStyleMap[this.currentMode.friendlyName.toLowerCase()] || cursorStyle;

    let options = this.vimState.editor.options;
    options.cursorStyle = cursorStyle;
    this.vimState.editor.options = options;

    let cursorRange: vscode.Range[] = [];
    if (
      this.currentMode.cursorType === VSCodeVimCursorType.TextDecoration &&
      this.currentMode.name !== ModeName.Insert
    ) {
      // Fake block cursor with text decoration. Unfortunately we can't have a cursor
      // in the middle of a selection natively, which is what we need for Visual Mode.
      if (this.currentMode.name === ModeName.Visual) {
        for (const { start: cursorStart, stop: cursorStop } of vimState.allCursors) {
          if (cursorStart.isEarlierThan(cursorStop)) {
            cursorRange.push(new vscode.Range(cursorStop.getLeft(), cursorStop));
          } else {
            cursorRange.push(new vscode.Range(cursorStop, cursorStop.getRight()));
          }
        }
      } else {
        for (const { stop: cursorStop } of vimState.allCursors) {
          cursorRange.push(new vscode.Range(cursorStop, cursorStop.getRight()));
        }
      }
    }

    this.vimState.editor.setDecorations(Decoration.Default, cursorRange);

    // Draw marks
    // I should re-enable this with a config setting at some point

    /*

    for (const mark of this.vimState.historyTracker.getMarks()) {
      rangesToDraw.push(new vscode.Range(mark.position, mark.position.getRight()));
    }

    */

    // Draw search highlight
    let searchRanges: vscode.Range[] = [];
    if (
      (configuration.incsearch && this.currentMode.name === ModeName.SearchInProgressMode) ||
      (configuration.hlsearch && vimState.globalState.hl && vimState.globalState.searchState)
    ) {
      const searchState = vimState.globalState.searchState!;

      searchRanges.push.apply(searchRanges, searchState.matchRanges);

      const { pos, match } = searchState.getNextSearchMatchPosition(vimState.cursorPosition);

      if (match) {
        searchRanges.push(new vscode.Range(pos, pos.getRight(searchState.searchString.length)));
      }
    }
    this.vimState.editor.setDecorations(Decoration.SearchHighlight, searchRanges);

    const easyMotionHighlightRanges =
      this.currentMode.name === ModeName.EasyMotionInputMode
        ? vimState.easyMotion.searchAction
            .getMatches(vimState.cursorPosition, vimState)
            .map(x => x.toRange())
        : [];
    this.vimState.editor.setDecorations(Decoration.EasyMotion, easyMotionHighlightRanges);

    for (let i = 0; i < this.vimState.postponedCodeViewChanges.length; i++) {
      let viewChange = this.vimState.postponedCodeViewChanges[i];
      await vscode.commands.executeCommand(viewChange.command, viewChange.args);
      vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();
    }
    this.vimState.postponedCodeViewChanges = [];

    if (this.currentMode.name === ModeName.EasyMotionMode) {
      // Update all EasyMotion decorations
      this.vimState.easyMotion.updateDecorations();
    }

    this._renderStatusBar();

    await vscode.commands.executeCommand(
      'setContext',
      'vim.mode',
      ModeName[this.vimState.currentMode]
    );
  }

  private _renderStatusBar(): void {
    // change status bar color based on mode
    if (configuration.statusBarColorControl) {
      const colorToSet = configuration.statusBarColors[this.currentMode.friendlyName.toLowerCase()];
      if (colorToSet !== undefined) {
        StatusBar.SetColor(colorToSet);
      }
    }

    let text = [];

    if (configuration.showmodename) {
      text.push(this.currentMode.getStatusBarText(this.vimState));
      if (this.vimState.isMultiCursor) {
        text.push(' MULTI CURSOR ');
      }
    }

    if (configuration.showcmd) {
      text.push(this.currentMode.getStatusBarCommandText(this.vimState));
    }

    if (this.vimState.isRecordingMacro) {
      const macroText = 'Recording @' + this.vimState.recordedMacro.registerName;
      text.push(macroText);
    }

    StatusBar.SetText(
      text.join(' '),
      this.currentMode.name,
      this.vimState.isRecordingMacro,
      this.currentMode.name === ModeName.SearchInProgressMode || this.vimState.isRecordingMacro
    );
  }

  async handleMultipleKeyEvents(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.handleKeyEvent(key!);
    }
  }

  // Return true if a new undo point should be created based on brackets and parenthesis
  private createUndoPointForBrackets(vimState: VimState): boolean {
    // }])> keys all start a new undo state when directly next to an {[(< opening character
    const key = vimState.recordedState.actionKeys[vimState.recordedState.actionKeys.length - 1];

    if (key === undefined) {
      return false;
    }

    if (vimState.currentMode === ModeName.Insert) {
      // Check if the keypress is a closing bracket to a corresponding opening bracket right next to it
      let result = PairMatcher.nextPairedChar(vimState.cursorPosition, key, false);
      if (result !== undefined) {
        if (vimState.cursorPosition.compareTo(result) === 0) {
          return true;
        }
      }

      result = PairMatcher.nextPairedChar(vimState.cursorPosition.getLeft(), key, true);
      if (result !== undefined) {
        if (vimState.cursorPosition.getLeftByCount(2).compareTo(result) === 0) {
          return true;
        }
      }
    }

    return false;
  }

  dispose() {
    this._disposables.map(d => d.dispose());
  }

  // Syncs cursors between vscode representation and vim representation
  syncCursors() {
    if (this.vimState.editor) {
      this.vimState.cursorStartPosition = Position.FromVSCodePosition(
        this.vimState.editor.selection.start
      );
      this.vimState.cursorPosition = Position.FromVSCodePosition(
        this.vimState.editor.selection.start
      );
      this.vimState.desiredColumn = this.vimState.cursorPosition.character;

      this.vimState.prevSelection = this.vimState.editor.selection;
    }
  }
}
