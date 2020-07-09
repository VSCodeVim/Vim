import * as vscode from 'vscode';

import { Actions, BaseAction, KeypressState } from './../actions/base';
import { BaseMovement } from '../actions/baseMotion';
import { CommandInsertInInsertMode, CommandInsertPreviousText } from './../actions/commands/insert';
import { Jump } from '../jumps/jump';
import { Logger } from '../util/logger';
import { Mode, VSCodeVimCursorType, isVisualMode, getCursorStyle, isStatusBarMode } from './mode';
import { PairMatcher } from './../common/matching/matcher';
import { Position, PositionDiff } from './../common/motion/position';
import { Range } from './../common/motion/range';
import { RecordedState } from './../state/recordedState';
import { Register, RegisterMode } from './../register/register';
import { Remappers } from '../configuration/remapper';
import { StatusBar } from '../statusBar';
import { TextEditor } from './../textEditor';
import { VimError, ErrorCode } from './../error';
import { VimState } from './../state/vimState';
import { VsCodeContext } from '../util/vscode-context';
import { commandLine } from '../cmd_line/commandLine';
import { configuration } from '../configuration/configuration';
import { decoration } from '../configuration/decoration';
import { scrollView } from '../util/util';
import {
  BaseCommand,
  CommandQuitRecordMacro,
  DocumentContentChangeAction,
  ActionOverrideCmdD,
  CommandRegister,
  CommandVisualMode,
} from './../actions/commands/actions';
import {
  areAnyTransformationsOverlapping,
  isTextTransformation,
  TextTransformations,
  areAllSameTransformation,
  isMultiCursorTextTransformation,
  InsertTextVSCodeTransformation,
} from './../transformations/transformations';
import { globalState } from '../state/globalState';
import { reportSearch } from '../util/statusBarTextUtils';
import { Notation } from '../configuration/notation';
import { ModeHandlerMap } from './modeHandlerMap';
import { EditorIdentity } from '../editorIdentity';
import { BaseOperator } from '../actions/operator';

/**
 * ModeHandler is the extension's backbone. It listens to events and updates the VimState.
 * One of these exists for each editor - see ModeHandlerMap
 *
 * See:  https://github.com/VSCodeVim/Vim/blob/master/.github/CONTRIBUTING.md#the-vim-state-machine
 */
export class ModeHandler implements vscode.Disposable {
  private _disposables: vscode.Disposable[] = [];
  private _remappers: Remappers;
  private readonly _logger = Logger.get('ModeHandler');

  // TODO: clarify the difference between ModeHandler.currentMode and VimState.currentMode
  private _currentMode: Mode;
  public vimState: VimState;

  get currentMode(): Mode {
    return this._currentMode;
  }

  private async setCurrentMode(modeName: Mode): Promise<void> {
    await this.vimState.setCurrentMode(modeName);
    this._currentMode = modeName;
  }

  public static async create(textEditor = vscode.window.activeTextEditor!): Promise<ModeHandler> {
    const modeHandler = new ModeHandler(textEditor);
    await modeHandler.vimState.load();
    await modeHandler.setCurrentMode(configuration.startInInsertMode ? Mode.Insert : Mode.Normal);
    modeHandler.syncCursors();
    return modeHandler;
  }

  private constructor(textEditor: vscode.TextEditor) {
    this._remappers = new Remappers();

    this.vimState = new VimState(textEditor);
    this._disposables.push(this.vimState);
  }

  /**
   * Updates VSCodeVim's internal representation of cursors to match VSCode's selections.
   * This loses some information, so it should only be done when necessary.
   */
  public syncCursors() {
    // TODO: getCursorsAfterSync() is basically this, but stupider
    setImmediate(() => {
      if (this.vimState.editor) {
        const { selections } = this.vimState.editor;
        if (
          !this.vimState.cursorStartPosition.isEqual(selections[0].anchor) ||
          !this.vimState.cursorStopPosition.isEqual(selections[0].active)
        ) {
          this.vimState.desiredColumn = selections[0].active.character;
        }

        this.vimState.cursors = selections.map(({ active, anchor }) =>
          active.isBefore(anchor)
            ? new Range(
                Position.FromVSCodePosition(anchor).getLeft(),
                Position.FromVSCodePosition(active)
              )
            : new Range(Position.FromVSCodePosition(anchor), Position.FromVSCodePosition(active))
        );
      }
    }, 0);
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
  public async handleSelectionChange(e: vscode.TextEditorSelectionChangeEvent): Promise<void> {
    let selection = e.selections[0];
    if (
      (e.selections.length !== this.vimState.cursors.length || this.vimState.isMultiCursor) &&
      this.vimState.currentMode !== Mode.VisualBlock
    ) {
      // Number of selections changed, make sure we know about all of them still
      this.vimState.cursors = e.textEditor.selections.map(
        (sel) =>
          new Range(
            // Adjust the cursor positions because cursors & selections don't match exactly
            sel.anchor.isAfter(sel.active)
              ? Position.FromVSCodePosition(sel.anchor).getLeft()
              : Position.FromVSCodePosition(sel.anchor),
            Position.FromVSCodePosition(sel.active)
          )
      );
      return this.updateView(this.vimState);
    }

    /**
     * We only trigger our view updating process if it's a mouse selection.
     * Otherwise we only update our internal cursor positions accordingly.
     */
    if (e.kind !== vscode.TextEditorSelectionChangeKind.Mouse) {
      if (selection) {
        if (isVisualMode(this.vimState.currentMode)) {
          /**
           * In Visual Mode, our `cursorPosition` and `cursorStartPosition` can not reflect `active`,
           * `start`, `end` and `anchor` information in a selection.
           * See `Fake block cursor with text decoration` section of `updateView` method.
           */
          return;
        }

        this.vimState.cursorStopPosition = Position.FromVSCodePosition(selection.active);
        this.vimState.cursorStartPosition = Position.FromVSCodePosition(selection.start);
      }
      return;
    }

    if (e.selections.length === 1) {
      this.vimState.isMultiCursor = false;
    }

    if (isStatusBarMode(this.vimState.currentMode)) {
      return;
    }

    let toDraw = false;

    if (selection) {
      let newPosition = Position.FromVSCodePosition(selection.active);

      // Only check on a click, not a full selection (to prevent clicking past EOL)
      if (newPosition.character >= newPosition.getLineEnd().character && selection.isEmpty) {
        if (this.vimState.currentMode !== Mode.Insert) {
          this.vimState.lastClickWasPastEol = true;

          // This prevents you from mouse clicking past the EOL
          newPosition = newPosition.withColumn(Math.max(newPosition.getLineEnd().character - 1, 0));

          // Switch back to normal mode since it was a click not a selection
          await this.setCurrentMode(Mode.Normal);

          toDraw = true;
        }
      } else if (selection.isEmpty) {
        this.vimState.lastClickWasPastEol = false;
      }

      this.vimState.cursorStopPosition = newPosition;
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
        let selectionStart = new Position(selection.anchor.line, selection.anchor.character);

        if (selectionStart.character > selectionStart.getLineEnd().character) {
          selectionStart = new Position(selectionStart.line, selectionStart.getLineEnd().character);
        }

        this.vimState.cursorStartPosition = selectionStart;

        if (selectionStart.isAfter(newPosition)) {
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
          !isVisualMode(this.vimState.currentMode) &&
          this.currentMode !== Mode.Insert
        ) {
          await this.setCurrentMode(Mode.Visual);

          // double click mouse selection causes an extra character to be selected so take one less character
        }
      } else if (this.vimState.currentMode !== Mode.Insert) {
        await this.setCurrentMode(Mode.Normal);
      }

      return this.updateView(this.vimState, { drawSelection: toDraw, revealRange: false });
    }
  }

  async handleMultipleKeyEvents(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.handleKeyEvent(key);
    }
  }

  public async handleKeyEvent(key: string): Promise<void> {
    const now = Number(new Date());
    const printableKey = Notation.printableKey(key);

    this._logger.debug(`handling key=${printableKey}.`);

    // rewrite copy
    if (configuration.overrideCopy) {
      // The conditions when you trigger a "copy" rather than a ctrl-c are
      // too sophisticated to be covered by the "when" condition in package.json
      if (key === '<D-c>') {
        key = '<copy>';
      }

      if (key === '<C-c>' && process.platform !== 'darwin') {
        if (
          !configuration.useCtrlKeys ||
          this.vimState.currentMode === Mode.Visual ||
          this.vimState.currentMode === Mode.VisualBlock ||
          this.vimState.currentMode === Mode.VisualLine
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

    this.vimState.cursorsInitialState = this.vimState.cursors;
    this.vimState.recordedState.commandList.push(key);

    const oldMode = this.vimState.currentMode;
    const oldVisibleRange = this.vimState.editor.visibleRanges[0];
    const oldStatusBarText = StatusBar.getText();

    try {
      const isWithinTimeout = now - this.vimState.lastKeyPressedTimestamp < configuration.timeout;
      if (!isWithinTimeout) {
        // sufficient time has elapsed since the prior keypress,
        // only consider the last keypress for remapping
        this.vimState.recordedState.commandList = [
          this.vimState.recordedState.commandList[
            this.vimState.recordedState.commandList.length - 1
          ],
        ];
      }

      let handled = false;
      const isOperatorCombination = this.vimState.recordedState.operator;

      // Check for remapped keys if:
      // 1. We are not currently performing a non-recursive remapping
      // 2. We are not in normal mode performing on an operator
      //    Example: ciwjj should be remapped if jj -> <Esc> in insert mode
      //             dd should not remap the second "d", if d -> "_d in normal mode
      if (
        !this.vimState.isCurrentlyPerformingRemapping &&
        (!isOperatorCombination || this.vimState.currentMode !== Mode.Normal)
      ) {
        handled = await this._remappers.sendKey(
          this.vimState.recordedState.commandList,
          this,
          this.vimState
        );
      }

      if (handled) {
        this.vimState.recordedState.resetCommandList();
      } else {
        this.vimState = await this.handleKeyEventHelper(key, this.vimState);
      }
    } catch (e) {
      if (e instanceof VimError) {
        StatusBar.displayError(this.vimState, e);
      } else {
        throw new Error(`Failed to handle key=${key}. ${e.message}`);
      }
    }

    this.vimState.lastKeyPressedTimestamp = now;

    // We don't want to immediately erase any message that resulted from the action just performed
    if (StatusBar.getText() === oldStatusBarText) {
      // Clear the status bar of high priority messages if the mode has changed, the view has scrolled
      // or it is recording a Macro
      const forceClearStatusBar =
        (this.vimState.currentMode !== oldMode && this.vimState.currentMode !== Mode.Normal) ||
        this.vimState.editor.visibleRanges[0] !== oldVisibleRange ||
        this.vimState.isRecordingMacro;
      StatusBar.clear(this.vimState, forceClearStatusBar);
    }

    this._logger.debug(`handleKeyEvent('${printableKey}') took ${Number(new Date()) - now}ms`);
  }

  private async handleKeyEventHelper(key: string, vimState: VimState): Promise<VimState> {
    if (vscode.window.activeTextEditor !== this.vimState.editor) {
      this._logger.warn('Current window is not active');
      return this.vimState;
    }

    // Catch any text change not triggered by us (example: tab completion).
    vimState.historyTracker.addChange(this.vimState.cursorsInitialState.map((c) => c.stop));

    vimState.keyHistory.push(key);

    let recordedState = vimState.recordedState;
    recordedState.actionKeys.push(key);

    let result = Actions.getRelevantAction(recordedState.actionKeys, vimState);
    switch (result) {
      case KeypressState.NoPossibleMatch:
        if (!this._remappers.isPotentialRemap) {
          vimState.recordedState = new RecordedState();
        }

        StatusBar.updateShowCmd(this.vimState);
        return vimState;
      case KeypressState.WaitingOnKeys:
        StatusBar.updateShowCmd(this.vimState);
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
          lastAction.addChanges(vimState.historyTracker.currentContentChanges);
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

    if (vimState.currentMode === Mode.Insert) {
      recordedState.isInsertion = true;
    }

    // Update view
    await this.updateView(vimState);

    if (action.isJump) {
      globalState.jumpTracker.recordJump(
        Jump.fromStateBefore(vimState),
        Jump.fromStateNow(vimState)
      );
    }

    if (!this._remappers.isPotentialRemap && recordedState.isInsertion) {
      vimState.recordedState.resetCommandList();
    }

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
          globalState.previousFullAction = recordedState;
          vimState.historyTracker.finishCurrentStep();
        }
      }
    }
    */

    if (vimState.currentMode === Mode.Visual) {
      vimState.cursors = vimState.cursors.map((c) =>
        c.start.isBefore(c.stop) ? c.withNewStop(c.stop.getLeftThroughLineBreaks(true)) : c
      );
    }

    if (action instanceof BaseMovement) {
      ({ vimState, recordedState } = await this.executeMovement(vimState, action));
      ranAction = true;
    }

    if (action instanceof BaseCommand) {
      vimState = await action.execCount(vimState.cursorStopPosition, vimState);

      vimState = await this.executeCommand(vimState);

      if (action.isCompleteAction) {
        ranAction = true;
      }

      if (action.canBeRepeatedWithDot) {
        ranRepeatableAction = true;
      }
    }

    if (action instanceof DocumentContentChangeAction) {
      vimState = await action.exec(vimState.cursorStopPosition, vimState);
    }

    if (action instanceof BaseOperator) {
      recordedState.operatorCount = recordedState.count;
    }

    // Update mode (note the ordering allows you to go into search mode,
    // then return and have the motion immediately applied to an operator).
    const prevMode = this.currentMode;
    if (vimState.currentMode !== this.currentMode) {
      await this.setCurrentMode(vimState.currentMode);

      // We don't want to mark any searches as a repeatable action
      if (
        vimState.currentMode === Mode.Normal &&
        prevMode !== Mode.SearchInProgressMode &&
        prevMode !== Mode.CommandlineInProgress &&
        prevMode !== Mode.EasyMotionInputMode &&
        prevMode !== Mode.EasyMotionMode
      ) {
        ranRepeatableAction = true;
      }
    }

    // Set context for overriding cmd-V, this is only done in search entry and
    // commandline modes
    if (isStatusBarMode(vimState.currentMode) !== isStatusBarMode(prevMode)) {
      await VsCodeContext.Set('vim.overrideCmdV', isStatusBarMode(vimState.currentMode));
    }

    if (recordedState.operatorReadyToExecute(vimState.currentMode)) {
      if (vimState.recordedState.operator) {
        vimState = await this.executeOperator(vimState);
        vimState.recordedState.hasRunOperator = true;
        ranRepeatableAction = vimState.recordedState.operator!.canBeRepeatedWithDot;
        ranAction = true;
      }
    }

    if (vimState.currentMode === Mode.Visual) {
      vimState.cursors = vimState.cursors.map((c) =>
        c.start.isBefore(c.stop)
          ? c.withNewStop(
              c.stop.isLineEnd() ? c.stop.getRightThroughLineBreaks() : c.stop.getRight()
            )
          : c
      );
    }

    // And then we have to do it again because an operator could
    // have changed it as well. (TODO: do you even decomposition bro)
    if (vimState.currentMode !== this.currentMode) {
      await this.setCurrentMode(vimState.currentMode);

      if (vimState.currentMode === Mode.Normal) {
        ranRepeatableAction = true;
      }
    }
    if (
      (ranAction && !(action instanceof CommandRegister) && vimState.currentMode !== Mode.Insert) ||
      action instanceof CommandVisualMode
    ) {
      vimState.recordedState.resetCommandList();
    }

    ranRepeatableAction =
      (ranRepeatableAction && vimState.currentMode === Mode.Normal) ||
      this.createUndoPointForBrackets(vimState);
    ranAction = ranAction && vimState.currentMode === Mode.Normal;

    // Record down previous action and flush temporary state
    if (ranRepeatableAction) {
      globalState.previousFullAction = vimState.recordedState;

      if (recordedState.isInsertion) {
        Register.putByKey(recordedState, '.', undefined, true);
      }
    }

    // Update desiredColumn
    if (!action.preservesDesiredColumn()) {
      if (action instanceof BaseMovement) {
        // We check !operator here because e.g. d$ should NOT set the desired column to EOL.
        if (action.setsDesiredColumnToEOL && !recordedState.operator) {
          vimState.desiredColumn = Number.POSITIVE_INFINITY;
        } else {
          vimState.desiredColumn = vimState.cursorStopPosition.character;
        }
      } else if (vimState.currentMode !== Mode.VisualBlock) {
        // TODO: explain why not VisualBlock
        vimState.desiredColumn = vimState.cursorStopPosition.character;
      }
    }

    if (ranAction) {
      vimState.recordedState = new RecordedState();

      // Return to insert mode after 1 command in this case for <C-o>
      if (vimState.returnToInsertAfterCommand) {
        if (vimState.actionCount > 0) {
          await this.setCurrentMode(Mode.Insert);
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
        vimState.historyTracker.addChange(this.vimState.cursorsInitialState.map((c) => c.stop));
      }
    }

    // Don't record an undo point for every action of a macro, only at the very end
    if (ranRepeatableAction && !vimState.isReplayingMacro) {
      vimState.historyTracker.finishCurrentStep();
    }

    recordedState.actionKeys = [];
    vimState.currentRegisterMode = RegisterMode.AscertainFromCurrentMode;

    if (this.currentMode === Mode.Normal) {
      vimState.cursorStartPosition = vimState.cursorStopPosition;
    }

    // Ensure cursors are within bounds
    if (!vimState.editor.document.isClosed && vimState.editor === vscode.window.activeTextEditor) {
      vimState.cursors = vimState.cursors.map((cursor: Range) => {
        // adjust start/stop
        const documentEndPosition = TextEditor.getDocumentEnd(vimState.editor);
        const documentLineCount = TextEditor.getLineCount(vimState.editor);
        if (cursor.start.line >= documentLineCount) {
          cursor = cursor.withNewStart(documentEndPosition);
        }
        if (cursor.stop.line >= documentLineCount) {
          cursor = cursor.withNewStop(documentEndPosition);
        }

        // adjust column
        if (vimState.currentMode === Mode.Normal) {
          const currentLineLength = TextEditor.getLineLength(cursor.stop.line);
          if (currentLineLength > 0) {
            const lineEndPosition = cursor.start.getLineEnd().getLeftThroughLineBreaks(true);
            if (cursor.start.character >= currentLineLength) {
              cursor = cursor.withNewStart(lineEndPosition);
            }

            if (cursor.stop.character >= currentLineLength) {
              cursor = cursor.withNewStop(lineEndPosition);
            }
          }
        }
        return cursor;
      });
    }

    // Update the current history step to have the latest cursor position
    vimState.historyTracker.setLastHistoryEndPosition(vimState.cursors.map((c) => c.stop));

    if (isVisualMode(this.vimState.currentMode) && !this.vimState.isRunningDotCommand) {
      // Store selection for commands like gv
      this.vimState.lastVisualSelection = {
        mode: this.vimState.currentMode,
        start: this.vimState.cursorStartPosition,
        end: this.vimState.cursorStopPosition,
      };
    }

    return vimState;
  }

  private async executeMovement(
    vimState: VimState,
    movement: BaseMovement
  ): Promise<{ vimState: VimState; recordedState: RecordedState }> {
    vimState.lastMovementFailed = false;
    let recordedState = vimState.recordedState;

    for (let i = 0; i < vimState.cursors.length; i++) {
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
      const oldCursorPositionStart = vimState.cursorStartPosition;
      const oldCursorPositionStop = vimState.cursorStopPosition;

      vimState.cursorStartPosition = vimState.cursors[i].start;
      let cursorPosition = vimState.cursors[i].stop;
      vimState.cursorStopPosition = cursorPosition;

      const result = await movement.execActionWithCount(
        cursorPosition,
        vimState,
        recordedState.count
      );

      // We also need to update the specific cursor, in case the cursor position was modified inside
      // the handling functions (e.g. 'it')
      vimState.cursors[i] = new Range(vimState.cursorStartPosition, vimState.cursorStopPosition);

      vimState.cursorStartPosition = oldCursorPositionStart;
      vimState.cursorStopPosition = oldCursorPositionStop;

      if (result instanceof Position) {
        vimState.cursors[i] = vimState.cursors[i].withNewStop(result);

        if (!isVisualMode(this.currentMode) && !vimState.recordedState.operator) {
          vimState.cursors[i] = vimState.cursors[i].withNewStart(result);
        }
      } else {
        if (result.failed) {
          vimState.recordedState = new RecordedState();
          vimState.lastMovementFailed = true;
        }

        vimState.cursors[i] = new Range(result.start, result.stop);

        if (result.registerMode) {
          vimState.currentRegisterMode = result.registerMode;
        }
      }
    }

    vimState.recordedState.count = 0;

    // Keep the cursor within bounds
    if (vimState.currentMode !== Mode.Normal || recordedState.operator) {
      let stop = vimState.cursorStopPosition;

      // Vim does this weird thing where it allows you to select and delete
      // the newline character, which it places 1 past the last character
      // in the line. This is why we use > instead of >=.

      if (stop.character > TextEditor.getLineLength(stop.line)) {
        vimState.cursorStopPosition = stop.getLineEnd();
      }
    }

    return { vimState, recordedState };
  }

  private async executeOperator(vimState: VimState): Promise<VimState> {
    let recordedState = vimState.recordedState;
    const operator = recordedState.operator!;

    // TODO - if actions were more pure, this would be unnecessary.
    const startingMode = vimState.currentMode;
    const startingRegisterMode = vimState.currentRegisterMode;

    const resultingCursors: Range[] = [];
    for (let [i, { start, stop }] of vimState.cursors.entries()) {
      operator.multicursorIndex = i;

      if (start.isAfter(stop)) {
        [start, stop] = [stop, start];
      }

      if (!isVisualMode(startingMode) && startingRegisterMode !== RegisterMode.LineWise) {
        stop = stop.getLeftThroughLineBreaks(true);
      }

      if (this.currentMode === Mode.VisualLine) {
        start = start.getLineBegin();
        stop = stop.getLineEnd();

        vimState.currentRegisterMode = RegisterMode.LineWise;
      }

      await vimState.setCurrentMode(startingMode);

      // We run the repeat version of an operator if the last 2 operators are the same.
      if (
        recordedState.operators.length > 1 &&
        recordedState.operators.reverse()[0].constructor ===
          recordedState.operators.reverse()[1].constructor
      ) {
        vimState = await operator.runRepeat(vimState, start, recordedState.count);
      } else {
        vimState = await operator.run(vimState, start, stop);
      }

      for (const transformation of vimState.recordedState.transformations) {
        if (isTextTransformation(transformation) && transformation.cursorIndex === undefined) {
          transformation.cursorIndex = operator.multicursorIndex;
        }
      }

      let resultingRange = new Range(vimState.cursorStartPosition, vimState.cursorStopPosition);

      resultingCursors.push(resultingRange);
    }

    if (vimState.recordedState.transformations.length > 0) {
      vimState = await this.executeCommand(vimState);
    } else {
      // Keep track of all cursors (in the case of multi-cursor).
      vimState.cursors = resultingCursors;
      vimState.editor.selections = vimState.cursors.map(
        (cursor) => new vscode.Selection(cursor.start, cursor.stop)
      );
    }

    return vimState;
  }

  private async executeCommand(vimState: VimState): Promise<VimState> {
    const transformations = vimState.recordedState.transformations;

    if (transformations.length === 0) {
      return vimState;
    }

    const textTransformations: TextTransformations[] = transformations.filter((x) =>
      isTextTransformation(x)
    ) as any;
    const multicursorTextTransformations: InsertTextVSCodeTransformation[] = transformations.filter(
      (x) => isMultiCursorTextTransformation(x)
    ) as any;

    const otherTransformations = transformations.filter(
      (x) => !isTextTransformation(x) && !isMultiCursorTextTransformation(x)
    );

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
          this._logger.warn(`Unhandled text transformation type: ${command.type}.`);
          break;
      }

      if (command.cursorIndex === undefined) {
        throw new Error('No cursor index - this should never ever happen!');
      }

      if (command.diff) {
        if (!accumulatedPositionDifferences[command.cursorIndex!]) {
          accumulatedPositionDifferences[command.cursorIndex!] = [];
        }

        accumulatedPositionDifferences[command.cursorIndex!].push(command.diff);
      }
    };

    if (textTransformations.length > 0) {
      if (areAnyTransformationsOverlapping(textTransformations)) {
        this._logger.debug(
          `Text transformations are overlapping. Falling back to serial
           transformations. This is generally a very bad sign. Try to make
           your text transformations operate on non-overlapping ranges.`
        );

        // TODO: Select one transformation for every cursor and run them all
        // in parallel. Repeat till there are no more transformations.
        for (const transformation of textTransformations) {
          await this.vimState.editor.edit((edit) => doTextEditorEdit(transformation, edit));
        }
      } else {
        // This is the common case!

        /**
         * batch all text operations together as a single operation
         * (this is primarily necessary for multi-cursor mode, since most
         * actions will trigger at most one text operation).
         */
        await this.vimState.editor.edit((edit) => {
          for (const command of textTransformations) {
            doTextEditorEdit(command, edit);
          }
        });
      }
    }

    if (multicursorTextTransformations.length > 0) {
      if (areAllSameTransformation(multicursorTextTransformations)) {
        /**
         * Apply the transformation only once instead of to each cursor
         * if they are all the same.
         *
         * This lets VSCode do multicursor snippets, auto braces and
         * all the usual jazz VSCode does on text insertion.
         */
        const { text } = multicursorTextTransformations[0];

        // await vscode.commands.executeCommand('default:type', { text });
        await TextEditor.insert(text);
      } else {
        this._logger.warn(
          `Unhandled multicursor transformations. Not all transformations are the same!`
        );
      }
    }

    for (const transformation of otherTransformations) {
      switch (transformation.type) {
        case 'insertTextVSCode':
          await TextEditor.insert(transformation.text);
          vimState.cursors[0] = Range.FromVSCodeSelection(this.vimState.editor.selection);
          break;

        case 'showCommandHistory':
          let cmd = await commandLine.showHistory(vimState.currentCommandlineText);
          if (cmd && cmd.length !== 0) {
            await commandLine.Run(cmd, this.vimState);
            this.updateView(this.vimState);
          }
          break;

        case 'showSearchHistory':
          const searchState = await globalState.showSearchHistory();
          if (searchState) {
            globalState.searchState = searchState;
            const nextMatch = searchState.getNextSearchMatchPosition(
              vimState.cursorStartPosition,
              transformation.direction
            );

            if (!nextMatch) {
              throw VimError.fromCode(
                transformation.direction > 0 ? ErrorCode.SearchHitBottom : ErrorCode.SearchHitTop,
                searchState.searchString
              );
            }

            vimState.cursorStopPosition = nextMatch.pos;
            this.updateView(this.vimState);
            reportSearch(nextMatch.index, searchState.getMatchRanges().length, vimState);
          }
          break;

        case 'dot':
          if (!globalState.previousFullAction) {
            return vimState; // TODO(bell)
          }

          await this.rerunRecordedState(vimState, globalState.previousFullAction.clone());
          break;

        case 'macro':
          let recordedMacro = (await Register.getByKey(transformation.register))
            .text as RecordedState;

          if (!(recordedMacro instanceof RecordedState)) {
            return vimState;
          }

          vimState.isReplayingMacro = true;

          if (transformation.register === ':') {
            await commandLine.Run(recordedMacro.commandString, vimState);
          } else if (transformation.replay === 'contentChange') {
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
            return vimState;
          }
          break;

        case 'contentChange':
          for (const change of transformation.changes) {
            await TextEditor.insert(change.text);
            vimState.cursorStopPosition = Position.FromVSCodePosition(
              this.vimState.editor.selection.start
            );
          }
          const newPos = vimState.cursorStopPosition.add(transformation.diff);
          this.vimState.editor.selection = new vscode.Selection(newPos, newPos);
          break;

        case 'tab':
          await vscode.commands.executeCommand('tab');
          if (transformation.diff) {
            if (transformation.cursorIndex === undefined) {
              throw new Error('No cursor index - this should never ever happen!');
            }

            if (!accumulatedPositionDifferences[transformation.cursorIndex]) {
              accumulatedPositionDifferences[transformation.cursorIndex] = [];
            }

            accumulatedPositionDifferences[transformation.cursorIndex].push(transformation.diff);
          }
          break;

        case 'reindent':
          await vscode.commands.executeCommand('editor.action.reindentselectedlines');
          if (transformation.diff) {
            if (transformation.cursorIndex === undefined) {
              throw new Error('No cursor index - this should never ever happen!');
            }

            if (!accumulatedPositionDifferences[transformation.cursorIndex]) {
              accumulatedPositionDifferences[transformation.cursorIndex] = [];
            }

            accumulatedPositionDifferences[transformation.cursorIndex].push(transformation.diff);
          }
          break;

        default:
          this._logger.warn(`Unhandled text transformation type: ${transformation.type}.`);
          break;
      }
    }

    const selections = this.vimState.editor.selections.map((sel) => {
      let range = Range.FromVSCodeSelection(sel);
      if (range.start.isBefore(range.stop)) {
        range = range.withNewStop(range.stop.getLeftThroughLineBreaks(true));
      }
      return new vscode.Selection(range.start, range.stop);
    });
    const firstTransformation = transformations[0];
    const manuallySetCursorPositions =
      (firstTransformation.type === 'deleteRange' ||
        firstTransformation.type === 'replaceText' ||
        firstTransformation.type === 'insertText') &&
      firstTransformation.manuallySetCursorPositions;

    // We handle multiple cursors in a different way in visual block mode, unfortunately.
    // TODO - refactor that out!
    if (vimState.currentMode !== Mode.VisualBlock && !manuallySetCursorPositions) {
      vimState.cursors = selections.map((sel, idx) => {
        const diffs = accumulatedPositionDifferences[idx] ?? [];
        if (vimState.recordedState.operatorPositionDiff) {
          diffs.push(vimState.recordedState.operatorPositionDiff);
        }

        return diffs.reduce(
          (cursor, diff) => new Range(cursor.start.add(diff), cursor.stop.add(diff)),
          Range.FromVSCodeSelection(sel)
        );
      });

      vimState.recordedState.operatorPositionDiff = undefined;
    } else if (accumulatedPositionDifferences[0]?.length > 0) {
      const diff = accumulatedPositionDifferences[0][0];
      vimState.cursorStopPosition = vimState.cursorStopPosition.add(diff);
      vimState.cursorStartPosition = vimState.cursorStartPosition.add(diff);
    }

    /**
     * This is a bit of a hack because Visual Block Mode isn't fully on board with
     * the new text transformation style yet.
     *
     * (TODO)
     */
    if (firstTransformation.type === 'deleteRange') {
      if (firstTransformation.collapseRange) {
        vimState.cursorStopPosition = new Position(
          vimState.cursorStopPosition.line,
          vimState.cursorStartPosition.character
        );
      }
    }

    vimState.recordedState.transformations = [];
    return vimState;
  }

  private async rerunRecordedState(
    vimState: VimState,
    recordedState: RecordedState
  ): Promise<VimState> {
    const actions = [...recordedState.actionsRun];
    const { hasRunSurround, surroundKeys } = recordedState;

    vimState.isRunningDotCommand = true;

    // If a previous visual selection exists, store it for use in replay of some commands
    if (vimState.lastVisualSelection) {
      vimState.dotCommandPreviousVisualSelection = new vscode.Selection(
        vimState.lastVisualSelection.start,
        vimState.lastVisualSelection.end
      );
    }

    recordedState = new RecordedState();
    vimState.recordedState = recordedState;

    // Replay surround if applicable, otherwise rerun actions
    if (hasRunSurround) {
      await this.handleMultipleKeyEvents(surroundKeys);
    } else {
      for (const [i, action] of actions.entries()) {
        recordedState.actionsRun = actions.slice(0, i + 1);
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
    let recordedState = new RecordedState();
    vimState.recordedState = recordedState;
    vimState.isRunningDotCommand = true;

    for (let action of recordedMacro.actionsRun) {
      let originalLocation = Jump.fromStateNow(vimState);

      vimState.cursorsInitialState = vimState.cursors;

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

      if (action.isJump) {
        globalState.jumpTracker.recordJump(originalLocation, Jump.fromStateNow(vimState));
      }
    }

    vimState.isRunningDotCommand = false;
    vimState.cursorsInitialState = vimState.cursors;
    return vimState;
  }

  public updateSearchHighlights(showHighlights: boolean) {
    let searchRanges: vscode.Range[] = [];
    if (showHighlights) {
      searchRanges = globalState.searchState?.getMatchRanges(this.vimState.editor.document) ?? [];
    }
    this.vimState.editor.setDecorations(decoration.SearchHighlight, searchRanges);
  }

  public async updateView(
    vimState: VimState,
    args: { drawSelection: boolean; revealRange: boolean } = {
      drawSelection: true,
      revealRange: true,
    }
  ): Promise<void> {
    // Draw selection (or cursor)

    if (
      args.drawSelection &&
      !vimState.recordedState.actionsRun.some(
        (action) => action instanceof DocumentContentChangeAction
      )
    ) {
      let selectionMode: Mode = vimState.currentMode;
      if (vimState.currentMode === Mode.SearchInProgressMode) {
        selectionMode = globalState.searchState!.previousMode;
      } else if (vimState.currentMode === Mode.CommandlineInProgress) {
        selectionMode = commandLine.previousMode;
      } else if (vimState.currentMode === Mode.SurroundInputMode) {
        selectionMode = vimState.surround!.previousMode;
      }

      const selections = [] as vscode.Selection[];
      for (const cursor of vimState.cursors) {
        let { start, stop } = cursor;
        switch (selectionMode) {
          case Mode.Visual:
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
            if (start.isAfter(stop)) {
              start = start.getRight();
            }

            selections.push(new vscode.Selection(start, stop));
            break;

          case Mode.VisualLine:
            if (start.isBeforeOrEqual(stop)) {
              selections.push(new vscode.Selection(start.getLineBegin(), stop.getLineEnd()));
            } else {
              selections.push(new vscode.Selection(start.getLineEnd(), stop.getLineBegin()));
            }
            break;

          case Mode.VisualBlock:
            for (const line of TextEditor.iterateLinesInBlock(vimState, cursor)) {
              selections.push(new vscode.Selection(line.start, line.end));
            }
            break;

          default:
            // Note that this collapses the selection onto one position
            selections.push(new vscode.Selection(stop, stop));
            break;
        }
      }

      this.vimState.editor.selections = selections;
    }

    // Scroll to position of cursor
    if (
      vimState.editor.visibleRanges.length > 0 &&
      !vimState.postponedCodeViewChanges.some((change) => change.command === 'editorScroll')
    ) {
      /**
       * This variable decides to which cursor we scroll the view.
       * It is meant as a patch to #880.
       * Extend this condition if it is the desired behaviour for other actions as well.
       */
      const isLastCursorTracked =
        vimState.recordedState.getLastActionRun() instanceof ActionOverrideCmdD;

      let cursorToTrack: Range;
      if (isLastCursorTracked) {
        cursorToTrack = vimState.cursors[vimState.cursors.length - 1];
      } else {
        cursorToTrack = vimState.cursors[0];
      }

      const isCursorAboveRange = (visibleRange: vscode.Range): boolean =>
        visibleRange.start.line - cursorToTrack.stop.line >= 15;
      const isCursorBelowRange = (visibleRange: vscode.Range): boolean =>
        cursorToTrack.stop.line - visibleRange.end.line >= 15;

      const { visibleRanges } = vimState.editor;
      const centerViewportAroundCursor =
        visibleRanges.every(isCursorAboveRange) || visibleRanges.every(isCursorBelowRange);

      const revealType = centerViewportAroundCursor
        ? vscode.TextEditorRevealType.InCenter
        : vscode.TextEditorRevealType.Default;

      if (this.vimState.currentMode === Mode.SearchInProgressMode) {
        const nextMatch = globalState.searchState!.getNextSearchMatchPosition(
          vimState.cursorStopPosition
        );

        if (nextMatch?.match) {
          this.vimState.editor.revealRange(
            new vscode.Range(nextMatch.pos, nextMatch.pos),
            revealType
          );
        } else if (vimState.firstVisibleLineBeforeSearch !== undefined) {
          const offset =
            vimState.editor.visibleRanges[0].start.line - vimState.firstVisibleLineBeforeSearch;
          scrollView(vimState, offset);
        }
      } else if (args.revealRange) {
        if (
          !isLastCursorTracked ||
          this.vimState.cursorsInitialState.length !== this.vimState.cursors.length
        ) {
          /**
           * We scroll the view if either:
           * 1. the cursor we want to keep in view is the main one (this is the "standard"
           * (before this commit) situation)
           * 2. if we track the last cursor, but no additional cursor was created in this step
           * (in the Cmd+D situation this means that no other matches were found)
           */
          this.vimState.editor.revealRange(
            new vscode.Range(cursorToTrack.stop, cursorToTrack.stop),
            revealType
          );
        }
      }
    }

    // cursor style
    let cursorStyle = configuration.getCursorStyleForMode(Mode[this.currentMode]);
    if (!cursorStyle) {
      const cursorType = getCursorType(this.vimState, this.currentMode);
      cursorStyle = getCursorStyle(cursorType);
      if (
        cursorType === VSCodeVimCursorType.Native &&
        configuration.editorCursorStyle !== undefined
      ) {
        cursorStyle = configuration.editorCursorStyle;
      }
    }
    this.vimState.editor.options.cursorStyle = cursorStyle;

    // cursor block
    let cursorRange: vscode.Range[] = [];
    if (
      getCursorType(this.vimState, this.currentMode) === VSCodeVimCursorType.TextDecoration &&
      this.currentMode !== Mode.Insert
    ) {
      // Fake block cursor with text decoration. Unfortunately we can't have a cursor
      // in the middle of a selection natively, which is what we need for Visual Mode.
      if (this.currentMode === Mode.Visual) {
        for (const { start: cursorStart, stop: cursorStop } of vimState.cursors) {
          if (cursorStart.isBefore(cursorStop)) {
            cursorRange.push(new vscode.Range(cursorStop.getLeft(), cursorStop));
          } else {
            cursorRange.push(new vscode.Range(cursorStop, cursorStop.getRight()));
          }
        }
      } else {
        for (const { stop: cursorStop } of vimState.cursors) {
          cursorRange.push(new vscode.Range(cursorStop, cursorStop.getRight()));
        }
      }
    }

    this.vimState.editor.setDecorations(decoration.Default, cursorRange);

    // TODO: draw marks (#3963)

    const showHighlights =
      (configuration.incsearch && this.currentMode === Mode.SearchInProgressMode) ||
      (configuration.hlsearch && globalState.hl);
    for (const editor of vscode.window.visibleTextEditors) {
      ModeHandlerMap.get(EditorIdentity.fromEditor(editor))?.updateSearchHighlights(showHighlights);
    }

    const easyMotionHighlightRanges =
      this.currentMode === Mode.EasyMotionInputMode
        ? vimState.easyMotion.searchAction
            .getMatches(vimState.cursorStopPosition, vimState)
            .map((match) => match.toRange())
        : [];
    this.vimState.editor.setDecorations(decoration.EasyMotion, easyMotionHighlightRanges);

    for (const viewChange of this.vimState.postponedCodeViewChanges) {
      await vscode.commands.executeCommand(viewChange.command, viewChange.args);
    }
    this.vimState.postponedCodeViewChanges = [];

    if (this.currentMode === Mode.EasyMotionMode) {
      // Update all EasyMotion decorations
      this.vimState.easyMotion.updateDecorations();
    }

    StatusBar.clear(this.vimState, false);
    StatusBar.updateShowCmd(this.vimState);

    await VsCodeContext.Set('vim.mode', Mode[this.vimState.currentMode]);

    // Tell VSCode that the cursor position changed, so it updates its highlights for
    // `editor.occurrencesHighlight`.

    const range = new vscode.Range(vimState.cursorStartPosition, vimState.cursorStopPosition);
    if (!/\s+/.test(vimState.editor.document.getText(range))) {
      vscode.commands.executeCommand('editor.action.wordHighlight.trigger');
    }
  }

  // Return true if a new undo point should be created based on brackets and parentheses
  private createUndoPointForBrackets(vimState: VimState): boolean {
    // }])> keys all start a new undo state when directly next to an {[(< opening character
    const key = vimState.recordedState.actionKeys[vimState.recordedState.actionKeys.length - 1];

    if (key === undefined) {
      return false;
    }

    if (vimState.currentMode === Mode.Insert) {
      // Check if the keypress is a closing bracket to a corresponding opening bracket right next to it
      let result = PairMatcher.nextPairedChar(vimState.cursorStopPosition, key);
      if (result !== undefined) {
        if (vimState.cursorStopPosition.isEqual(result)) {
          return true;
        }
      }

      result = PairMatcher.nextPairedChar(vimState.cursorStopPosition.getLeft(), key);
      if (result !== undefined) {
        if (vimState.cursorStopPosition.getLeft(2).isEqual(result)) {
          return true;
        }
      }
    }

    return false;
  }

  dispose() {
    this._disposables.map((d) => d.dispose());
  }
}

function getCursorType(vimState: VimState, mode: Mode): VSCodeVimCursorType {
  switch (mode) {
    case Mode.Normal:
      return VSCodeVimCursorType.Block;
    case Mode.Insert:
      return VSCodeVimCursorType.Native;
    case Mode.Visual:
      return VSCodeVimCursorType.TextDecoration;
    case Mode.VisualBlock:
      return VSCodeVimCursorType.TextDecoration;
    case Mode.VisualLine:
      return VSCodeVimCursorType.TextDecoration;
    case Mode.SearchInProgressMode:
      return getCursorType(vimState, globalState.searchState!.previousMode);
    case Mode.CommandlineInProgress:
      return getCursorType(vimState, commandLine.previousMode);
    case Mode.Replace:
      return VSCodeVimCursorType.Underline;
    case Mode.EasyMotionMode:
      return VSCodeVimCursorType.Block;
    case Mode.EasyMotionInputMode:
      return VSCodeVimCursorType.Block;
    case Mode.SurroundInputMode:
      return getCursorType(vimState, vimState.surround!.previousMode);
    case Mode.Disabled:
    default:
      return VSCodeVimCursorType.Line;
  }
}
