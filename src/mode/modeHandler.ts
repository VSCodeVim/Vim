"use strict";

import * as vscode from 'vscode';
import * as _ from 'lodash';

import { getAndUpdateModeHandler } from './../../extension';
import {
  isTextTransformation,
  TextTransformations,
  areAnyTransformationsOverlapping,
  Transformation,
} from './../transformations/transformations';
import { Mode, ModeName, VSCodeVimCursorType } from './mode';
import { InsertModeRemapper, OtherModesRemapper } from './remapper';
import { NormalMode } from './modeNormal';
import { InsertMode } from './modeInsert';
import { VisualBlockMode, VisualBlockInsertionType } from './modeVisualBlock';
import { InsertVisualBlockMode } from './modeInsertVisualBlock';
import { VisualMode } from './modeVisual';
import { taskQueue } from './../taskQueue';
import { ReplaceMode } from './modeReplace';
import { EasyMotionMode } from './modeEasyMotion';
import { SurroundMode , SurroundType} from './modeSurround';
import { Surround } from './../surround/surround';
import { SearchInProgressMode } from './modeSearchInProgress';
import { TextEditor } from './../textEditor';
import { VisualLineMode } from './modeVisualLine';
import { HistoryTracker } from './../history/historyTracker';
import { EasyMotion } from './../easymotion/easymotion';
import {
  BaseMovement, BaseCommand, Actions, BaseAction,
  BaseOperator, DocumentContentChangeAction, CommandInsertInInsertMode, CommandInsertPreviousText, CommandQuitRecordMacro,
  isIMovement, KeypressState } from './../actions/actions';
import { Position, PositionDiff } from './../motion/position';
import { Range } from './../motion/range';
import { RegisterMode, Register } from './../register/register';
import { showCmdLine } from '../../src/cmd_line/main';
import { Configuration } from '../../src/configuration/configuration';
import { PairMatcher } from './../matching/matcher';
import { Globals } from '../../src/globals';
import { ReplaceState } from './../state/replaceState';
import { GlobalState } from './../state/globalState';

export class ViewChange {
  public command: string;
  public args: any;
}

/**
 * The VimState class holds permanent state that carries over from action
 * to action.
 *
 * Actions defined in actions.ts are only allowed to mutate a VimState in order to
 * indicate what they want to do.
 */
export class VimState {
  private _id = Math.floor(Math.random() * 10000) % 10000;

  public get id(): number { return this._id; }

  /**
   * The column the cursor wants to be at, or Number.POSITIVE_INFINITY if it should always
   * be the rightmost column.
   *
   * Example: If you go to the end of a 20 character column, this value
   * will be 20, even if you press j and the next column is only 5 characters.
   * This is because if the third column is 25 characters, the cursor will go
   * back to the 20th column.
   */
  public desiredColumn = 0;

  public historyTracker: HistoryTracker;

  public easyMotion: EasyMotion;

  public surround: Surround;

  /**
   * For timing out remapped keys like jj to esc.
   */
  public lastKeyPressedTimestamp = 0;

  /**
   * Are multiple cursors currently present?
   */
  public isMultiCursor = false;

  /**
   * Tracks movements that can be repeated with ; and , (namely t, T, f, and F).
   */
  public static lastRepeatableMovement : BaseMovement | undefined = undefined;

  public lastMovementFailed: boolean = false;

  public alteredHistory = false;

  public isRunningDotCommand = false;

  public focusChanged = false;

  /**
   * Used for command like <C-o> which allows you to return to insert after a command
   */
  public returnToInsertAfterCommand = false;
  public actionCount = 0;

  /**
   * Every time we invoke a VS Code command which might trigger Code's view update,
   * we should postpone its view updating phase to avoid conflicting with our internal view updating mechanism.
   * This array is used to cache every VS Code view updating event and they will be triggered once we run the inhouse `viewUpdate`.
   */
  public postponedCodeViewChanges: ViewChange[] = [];

  /**
   * Used to prevent non-recursive remappings from looping.
   */
  public isCurrentlyPerformingRemapping = false;

  /**
   * The current full action we are building up.
   */
  public currentFullAction: string[] = [];

  public globalState: GlobalState = new GlobalState;

  /**
   * The position the cursor will be when this action finishes.
   */
  public get cursorPosition(): Position {
    return this.allCursors[0].stop;
  }
  public set cursorPosition(value: Position) {
    this.allCursors[0] = this.allCursors[0].withNewStop(value);
  }

  /**
   * The effective starting position of the movement, used along with cursorPosition to determine
   * the range over which to run an Operator. May rarely be different than where the cursor
   * actually starts e.g. if you use the "aw" text motion in the middle of a word.
   */
  public get cursorStartPosition(): Position {
    return this.allCursors[0].start;
  }
  public set cursorStartPosition(value: Position) {
    this.allCursors[0] = this.allCursors[0].withNewStart(value);
  }

  /**
   * In Multi Cursor Mode, the position of every cursor.
   */
  private _allCursors: Range[] = [ new Range(new Position(0, 0), new Position(0, 0)) ];

  public get allCursors(): Range[] {
    return this._allCursors;
  }

  public set allCursors(value: Range[]) {
    for (const cursor of value) {
      if (!cursor.start.isValid() || !cursor.stop.isValid()) {
        console.log("invalid value for set cursor position. This is probably bad?");
      }
    }

    this._allCursors = value;

    this.isMultiCursor = this._allCursors.length > 1;
  }

  public cursorPositionJustBeforeAnythingHappened = [ new Position(0, 0) ];

  public isRecordingMacro: boolean = false;

  public replaceState: ReplaceState | undefined = undefined;

  /**
   * Stores last visual mode for gv
   */
  public lastVisualMode: ModeName;

  /**
   * Last selection that was active
   */
  public lastVisualSelectionStart: Position;
  public lastVisualSelectionEnd: Position;

  /**
   * Was the previous mouse click past EOL
   */
  public lastClickWasPastEol: boolean = false;

  /**
   * The mode Vim will be in once this action finishes.
   */
  private _currentMode: ModeName;

  public get currentMode(): number {
    return this._currentMode;
  }

  public set currentMode(value: number) {
    this._currentMode = value;

    vscode.commands.executeCommand('setContext', 'vim.mode', ModeName[value]);
  }

  public getModeObject(modeHandler: ModeHandler): Mode {
    return modeHandler.modeList.find(mode => mode.isActive);
  }

  public currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;

  public effectiveRegisterMode(): RegisterMode {
    if (this.currentRegisterMode === RegisterMode.FigureItOutFromCurrentMode) {
      if (this.currentMode === ModeName.VisualLine) {
        return RegisterMode.LineWise;
      } else if (this.currentMode === ModeName.VisualBlock || this.currentMode === ModeName.VisualBlockInsertMode) {
        return RegisterMode.BlockWise;
      } else {
        return RegisterMode.CharacterWise;
      }
    } else {
      return this.currentRegisterMode;
    }
  }

  /**
   * The top left of a selected block of text. Useful for Visual Block mode.
   */
  public get topLeft(): Position {
    return VisualBlockMode.getTopLeftPosition(this.cursorStartPosition, this.cursorPosition);
  }

  /**
   * The bottom right of a selected block of text. Useful for Visual Block mode.
   */
  public get bottomRight(): Position {
    return VisualBlockMode.getBottomRightPosition(this.cursorStartPosition, this.cursorPosition);
  }

  public registerName = '"';

  public commandInitialText = "";

  public recordedState = new RecordedState();

  public recordedMacro = new RecordedState();

  /**
   * Programmatically triggering an edit will unfortunately ALSO trigger our mouse update
   * function. We use this variable to determine if the update function was triggered
   * by us or by a mouse action.
   */
  public whatILastSetTheSelectionTo: vscode.Selection;
}

/**
 * The RecordedState class holds the current action that the user is
 * doing. Example: Imagine that the user types:
 *
 * 5"qdw
 *
 * Then the relevent state would be
 *   * count of 5
 *   * copy into q register
 *   * delete operator
 *   * word movement
 *
 *
 * Or imagine the user types:
 *
 * vw$}}d
 *
 * Then the state would be
 *   * Visual mode action
 *   * (a list of all the motions you ran)
 *   * delete operator
 */
export class RecordedState {
  constructor() {
    const useClipboard = Configuration.useSystemClipboard;
    this.registerName = useClipboard ? '*' : '"';
  }

  /**
   * The keys the user has pressed that have not caused an action to be
   * executed yet. Used for showcmd and command remapping.
   */
  public commandList: string[] = [];

  /**
   * String representation of the exact keys that the user entered. Used for
   * showcmd.
   */
  public get commandString(): string {
    let result = "";

    for (const key of this.commandList) {
      if (key === Configuration.leader) {
        result += "<leader>";
      } else {
        result += key;
      }
    }

    return result;
  }

  /**
   * Keeps track of keys pressed for the next action. Comes in handy when parsing
   * multiple length movements, e.g. gg.
   */
  public actionKeys: string[] = [];

  /**
   * Every action that has been run.
   */
  public actionsRun: BaseAction[] = [];

  public hasRunOperator = false;

  /**
   * This is kind of a hack and should be associated with something like this:
   *
   * https://github.com/VSCodeVim/Vim/issues/805
   */
  public operatorPositionDiff: PositionDiff | undefined;

  public isInsertion = false;

  /**
   * If we're in Visual Block mode, the way in which we're inserting characters (either inserting
   * at the beginning or appending at the end).
   */

  public visualBlockInsertionType = VisualBlockInsertionType.Insert;

  /**
   * If in surround mode, what type of surround mode are we in
   */

  public surroundType = SurroundType.ChangeSurround;

  /**
   * The text transformations that we want to run. They will all be run after the action has been processed.
   *
   * Running an individual action will generally queue up to one of these, but if you're in
   * multi-cursor mode, you'll queue one per cursor, or more.
   *
   * Note that the text transformations are run in parallel. This is useful in most cases,
   * but will get you in trouble in others.
   */
  public transformations: Transformation[] = [];

  /**
   * The operator (e.g. d, y, >) the user wants to run, if there is one.
   */
  public get operator(): BaseOperator {
    const list = _.filter(this.actionsRun, a => a instanceof BaseOperator);

    if (list.length > 1) { throw "Too many operators!"; }

    return list[0] as any;
  }

  /**
   * The command (e.g. i, ., R, /) the user wants to run, if there is one.
   */
  public get command(): BaseCommand {
    const list = _.filter(this.actionsRun, a => a instanceof BaseCommand);

    // TODO - disregard <Esc>, then assert this is of length 1.

    return list[0] as any;
  }

  public get hasRunAMovement(): boolean {
    return _.filter(this.actionsRun, a => a.isMotion).length > 0;
  }

  /**
   * The number of times the user wants to repeat this action.
   */
  public count: number = 0;

  /**
   * The register name for this action.
   */
  public registerName: string;

  public clone(): RecordedState {
    const res = new RecordedState();

    // TODO: Actual clone.

    res.actionKeys      = this.actionKeys.slice(0);
    res.actionsRun      = this.actionsRun.slice(0);
    res.hasRunOperator  = this.hasRunOperator;

    return res;
  }

  public operatorReadyToExecute(mode: ModeName): boolean {
    // Visual modes do not require a motion -- they ARE the motion.
    return this.operator &&
      !this.hasRunOperator &&
      mode !== ModeName.SearchInProgressMode &&
      (this.hasRunAMovement || (
      mode === ModeName.Visual ||
      mode === ModeName.VisualLine ));
  }

  public get isInInitialState(): boolean {
    return this.operator  === undefined &&
         this.actionsRun.length === 0   &&
         this.count     === 1;
  }
}

interface IViewState {
  selectionStart: Position;
  selectionStop : Position;
  currentMode   : ModeName;
}

export class ModeHandler implements vscode.Disposable {
  public static IsTesting = false;

  private _toBeDisposed: vscode.Disposable[] = [];
  private _modes: Mode[];
  private static _statusBarItem: vscode.StatusBarItem;
  private _vimState: VimState;
  private _insertModeRemapper: InsertModeRemapper;
  private _otherModesRemapper: OtherModesRemapper;
  private _otherModesNonRecursive: OtherModesRemapper;
  private _insertModeNonRecursive: InsertModeRemapper;

  public get vimState(): VimState {
    return this._vimState;
  }

  /**
   * Filename associated with this ModeHandler. Only used for debugging.
   */
  public fileName: string;

  private _caretDecoration = vscode.window.createTextEditorDecorationType({
    dark: {
      // used for dark colored themes
      backgroundColor: 'rgba(224, 224, 224, 0.4)',
      borderColor: 'rgba(0, 0, 0, 1.0)'
    },
    light: {
      // used for light colored themes
      backgroundColor: 'rgba(32, 32, 32, 0.4)',
      borderColor: 'rgba(0, 0, 0, 1.0)'
    },
    borderStyle: 'solid',
    borderWidth: '1px'
  });

  private _searchHighlightDecoration: vscode.TextEditorDecorationType;

  private get currentModeName(): ModeName {
    return this.currentMode.name;
  }

  public get modeList(): Mode[] {
    return this._modes;
  }

  /**
   * isTesting speeds up tests drastically by turning off our checks for
   * mouse events.
   */
  constructor(filename = "") {
    ModeHandler.IsTesting = Globals.isTesting;

    this.fileName = filename;

    this._vimState = new VimState();
    this._insertModeRemapper = new InsertModeRemapper(true);
    this._otherModesRemapper = new OtherModesRemapper(true);
    this._insertModeNonRecursive = new InsertModeRemapper(false);
    this._otherModesNonRecursive = new OtherModesRemapper(false);

    this._modes = [
      new NormalMode(this),
      new InsertMode(),
      new VisualMode(),
      new VisualBlockMode(),
      new InsertVisualBlockMode(),
      new VisualLineMode(),
      new SearchInProgressMode(),
      new ReplaceMode(),
      new EasyMotionMode(),
      new SurroundMode()
    ];
    this.vimState.historyTracker = new HistoryTracker();
    this.vimState.easyMotion = new EasyMotion();
    this.vimState.surround = new Surround();

    if (Configuration.startInInsertMode) {
      this._vimState.currentMode = ModeName.Insert;
    } else {
      this._vimState.currentMode = ModeName.Normal;
    }

    this._searchHighlightDecoration = vscode.window.createTextEditorDecorationType({
      backgroundColor: Configuration.searchHighlightColor
    });

    this.setCurrentModeByName(this._vimState);

    // Sometimes, Visual Studio Code will start the cursor in a position which
    // is not (0, 0) - e.g., if you previously edited the file and left the
    // cursor somewhere else when you closed it. This will set our cursor's
    // position to the position that VSC set it to.
    if (vscode.window.activeTextEditor) {
      this._vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
      this._vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
      this._vimState.whatILastSetTheSelectionTo = vscode.window.activeTextEditor.selection;
    }

    // Handle scenarios where mouse used to change current position.
    const disposer = vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
      taskQueue.enqueueTask({
        promise: () => this.handleSelectionChange(e),
        isRunning: false,

        /**
         * We don't want these to become backlogged! If they do, we'll update
         * the selection to an incorrect value and see a jittering cursor.
         */
        highPriority: true,
      });
    });

    this._toBeDisposed.push(disposer);
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
    let selection = e.selections[0];

    if (ModeHandler.IsTesting) {
      return;
    }

    if (e.textEditor.document.fileName !== this.fileName) {
      return;
    }

    if (this._vimState.focusChanged) {
      this._vimState.focusChanged = false;

      return;
    }

    if (this.currentModeName === ModeName.VisualBlockInsertMode ||
      this.currentModeName === ModeName.EasyMotionMode ||
      this.currentModeName === ModeName.SurroundMode) {
      // AArrgghhhh - johnfn

      return;
    }

    if (this.vimState.isMultiCursor) {
      // AAAAAARGGHHHHH - johnfn

      return;
    }

    /**
     * We only trigger our view updating process if it's a mouse selection.
     * Otherwise we only update our internal cursor postions accordingly.
     */
    if (e.kind !== vscode.TextEditorSelectionChangeKind.Mouse) {
      if (selection) {
        if (this._vimState.getModeObject(this).isVisualMode) {
          /**
           * In Visual Mode, our `cursorPosition` and `cursorStartPosition` can not refect `active`,
           * `start`, `end` and `anchor` information in a selection.
           * See `Fake block cursor with text decoration` section of `updateView` method.
           */
          return;
        }

        this._vimState.cursorPosition = Position.FromVSCodePosition(selection.active);
        this._vimState.cursorStartPosition = Position.FromVSCodePosition(selection.start);
      }
      return;
    }

    if (this._vimState.isMultiCursor && e.selections.length === 1) {
      this._vimState.isMultiCursor = false;
    }

    if (this._vimState.isMultiCursor) {
      return;
    }

    // See comment about whatILastSetTheSelectionTo.
    if (this._vimState.whatILastSetTheSelectionTo.isEqual(selection)) {
      return;
    }

    if (this._vimState.currentMode === ModeName.SearchInProgressMode ||
        this._vimState.currentMode === ModeName.VisualBlockInsertMode) {
      return;
    }

    let toDraw = false;

    if (selection) {
      let newPosition = new Position(selection.active.line, selection.active.character);

      // Only check on a click, not a full selection (to prevent clicking past EOL)
      if (newPosition.character >= newPosition.getLineEnd().character && selection.isEmpty) {
        if (this._vimState.currentMode !== ModeName.Insert) {

          this._vimState.lastClickWasPastEol = true;

          // This prevents you from mouse clicking past the EOL
          newPosition = new Position(newPosition.line, Math.max(newPosition.getLineEnd().character - 1, 0));

          // Switch back to normal mode since it was a click not a selection
          this._vimState.currentMode = ModeName.Normal;
          this.setCurrentModeByName(this._vimState);

          toDraw = true;
        }
      } else if (selection.isEmpty) {
        this._vimState.lastClickWasPastEol = false;
      }

      this._vimState.cursorPosition    = newPosition;
      this._vimState.cursorStartPosition = newPosition;

      this._vimState.desiredColumn     = newPosition.character;

      // start visual mode?

      if (selection.anchor.line === selection.active.line
        && selection.anchor.character >= newPosition.getLineEnd().character - 1
        && selection.active.character >= newPosition.getLineEnd().character - 1) {
         // This prevents you from selecting EOL
      } else if (!selection.anchor.isEqual(selection.active)) {
        var selectionStart = new Position(selection.anchor.line, selection.anchor.character);

        if (selectionStart.character > selectionStart.getLineEnd().character) {
          selectionStart = new Position(selectionStart.line, selectionStart.getLineEnd().character);
        }

        this._vimState.cursorStartPosition = selectionStart;

        if (selectionStart.compareTo(newPosition) > 0) {
          this._vimState.cursorStartPosition = this._vimState.cursorStartPosition.getLeft();
        }

        // If we prevented from clicking past eol but it is part of this selection, include the last char
        if (this._vimState.lastClickWasPastEol) {
          const newStart = new Position(selection.anchor.line, selection.anchor.character + 1);
          vscode.window.activeTextEditor.selection = new vscode.Selection(newStart, selection.end);
          this._vimState.cursorStartPosition = selectionStart;
          this._vimState.lastClickWasPastEol = false;
        }

        if (!this._vimState.getModeObject(this).isVisualMode &&
             this._vimState.getModeObject(this).name !== ModeName.Insert) {
          this._vimState.currentMode = ModeName.Visual;
          this.setCurrentModeByName(this._vimState);

          // double click mouse selection causes an extra character to be selected so take one less character
          this._vimState.cursorPosition = this._vimState.cursorPosition.getLeft();
        }
      } else {
        if (this._vimState.currentMode !== ModeName.Insert) {
          this._vimState.currentMode = ModeName.Normal;
          this.setCurrentModeByName(this._vimState);
        }
      }

      await this.updateView(this._vimState, {drawSelection: toDraw, revealRange: true});
    }
  }

  /**
   * The active mode.
   */
  get currentMode(): Mode {
    return this._modes.find(mode => mode.isActive);
  }

  setCurrentModeByName(vimState: VimState): void {
    let activeMode: Mode;

    this._vimState.currentMode = vimState.currentMode;

    for (let mode of this._modes) {
      if (mode.name === vimState.currentMode) {
        activeMode = mode;
      }

      mode.isActive = (mode.name === vimState.currentMode);
    }
  }

  async handleKeyEvent(key: string): Promise<Boolean> {
    const now = Number(new Date());

    this._vimState.cursorPositionJustBeforeAnythingHappened = this._vimState.allCursors.map(x => x.stop);
    this._vimState.recordedState.commandList.push(key);

    try {
      const keys = this._vimState.recordedState.commandList;
      const withinTimeout = now - this._vimState.lastKeyPressedTimestamp < Configuration.timeout;

      let handled = false;

      /**
       * Check that
       *
       * 1) We are not already performing a nonrecursive remapping.
       * 2) We haven't timed out of our previous remapping.
       * 3) We are not in the middle of executing another command.
       */

      if (!this._vimState.isCurrentlyPerformingRemapping &&
          (withinTimeout || keys.length === 1)) {


        handled = handled || await this._insertModeRemapper.sendKey(keys, this, this.vimState);
        handled = handled || await this._otherModesRemapper.sendKey(keys, this, this.vimState);
        handled = handled || await this._insertModeNonRecursive.sendKey(keys, this, this.vimState);
        handled = handled || await this._otherModesNonRecursive.sendKey(keys, this, this.vimState);
      }

      if (!handled) {
        this._vimState = await this.handleKeyEventHelper(key, this._vimState);
      }
    } catch (e) {
      console.log('error.stack');
      console.log(e);
      console.log(e.stack);
    }

    if (this._vimState.focusChanged) {
      await getAndUpdateModeHandler();
    }

    this._vimState.lastKeyPressedTimestamp = now;
    this._renderStatusBar();

    return true;
  }

  async handleKeyEventHelper(key: string, vimState: VimState): Promise<VimState> {

    // Catch any text change not triggered by us (example: tab completion).
    vimState.historyTracker.addChange(this._vimState.cursorPositionJustBeforeAnythingHappened);

    let recordedState = vimState.recordedState;

    recordedState.actionKeys.push(key);
    vimState.currentFullAction.push(key);

    let result = Actions.getRelevantAction(recordedState.actionKeys, vimState);

    if (result === KeypressState.NoPossibleMatch) {
      vimState.recordedState = new RecordedState();
      vimState.recordedState.commandList = [];

      return vimState;
    } else if (result === KeypressState.WaitingOnKeys) {

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

        if (action instanceof CommandInsertInInsertMode || action instanceof CommandInsertPreviousText) {
          // delay the macro recording
          actionToRecord = undefined;
        } else {
          // Push real document content change to the stack
          lastAction.contentChanges = lastAction.contentChanges.concat(vimState.historyTracker.currentContentChanges);
          vimState.historyTracker.currentContentChanges = [];
          recordedState.actionsRun.push(action);
        }
      } else {
        if (action instanceof CommandInsertInInsertMode || action instanceof CommandInsertPreviousText) {
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

    if (vimState.isRecordingMacro && actionToRecord && !(actionToRecord instanceof CommandQuitRecordMacro)) {
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

  async runAction(vimState: VimState, recordedState: RecordedState, action: BaseAction): Promise<VimState> {
    let ranRepeatableAction = false;
    let ranAction = false;

    // If arrow keys or mouse was used prior to entering characters while in insert mode, create an undo point
    // this needs to happen before any changes are made

    /*
    TODO

    // If arrow keys or mouse were in insert mode, create an undo point.
    // This needs to happen before any changes are made

    let prevPos = vimState.historyTracker.getLastHistoryEndPosition();
    if (prevPos !== undefined && !vimState.isRunningDotCommand) {
      if (vimState.cursorPositionJustBeforeAnythingHappened.line !== prevPos.line ||
          vimState.cursorPositionJustBeforeAnythingHappened.character !== prevPos.character) {

        vimState.globalState.previousFullAction = recordedState;
        vimState.historyTracker.finishCurrentStep();
      }
    }
    */

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
    const prevState = this.currentModeName;
    if (vimState.currentMode !== this.currentModeName) {
      this.setCurrentModeByName(vimState);

      // We don't want to mark any searches as a repeatable action
      if (vimState.currentMode === ModeName.Normal && prevState !== ModeName.SearchInProgressMode &&
        vimState.currentMode !== ModeName.SearchInProgressMode) {
        ranRepeatableAction = true;
      }
    }

    if (recordedState.operatorReadyToExecute(vimState.currentMode)) {
      vimState = await this.executeOperator(vimState);

      vimState.recordedState.hasRunOperator = true;
      ranRepeatableAction = vimState.recordedState.operator.canBeRepeatedWithDot;
      ranAction = true;
    }

    // And then we have to do it again because an operator could
    // have changed it as well. (TODO: do you even decomposition bro)

    if (vimState.currentMode !== this.currentModeName) {
      this.setCurrentModeByName(vimState);

      if (vimState.currentMode === ModeName.Normal) {
        ranRepeatableAction = true;
      }
    }

    if (ranAction && vimState.currentMode !== ModeName.Insert) {
      vimState.recordedState.commandList = [];
    }

    ranRepeatableAction = (ranRepeatableAction && vimState.currentMode === ModeName.Normal) || this.createUndoPointForBrackets(vimState);
    ranAction = ranAction && vimState.currentMode === ModeName.Normal;

    // Record down previous action and flush temporary state
    if (ranRepeatableAction) {
      vimState.globalState.previousFullAction = vimState.recordedState;

      if (recordedState.isInsertion) {
        Register.putByKey(recordedState, '.');
      }
    }

    if (ranAction) {
      vimState.recordedState = new RecordedState();

      // Return to insert mode after 1 command in this case for <C-o>
      if (vimState.returnToInsertAfterCommand) {
        if (vimState.actionCount > 0) {
          vimState.currentMode = ModeName.Insert;
          vimState.returnToInsertAfterCommand = false;
          vimState.actionCount = 0;
          this.setCurrentModeByName(vimState);
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

      if (this._vimState.alteredHistory) {
        this._vimState.alteredHistory = false;
        vimState.historyTracker.ignoreChange();
      } else {
        vimState.historyTracker.addChange(this._vimState.cursorPositionJustBeforeAnythingHappened);
      }
    }

    if (ranRepeatableAction) {
      vimState.historyTracker.finishCurrentStep();
    }

    recordedState.actionKeys = [];
    vimState.currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;

    if (this.currentModeName === ModeName.Normal) {
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

      if (vimState.currentMode === ModeName.Normal &&
          stop.character >= currentLineLength && currentLineLength > 0) {

        vimState.allCursors[i] = vimState.allCursors[i].withNewStop(
          stop.getLineEnd().getLeft()
        );
      }
    }

    // Update the current history step to have the latest cursor position

    vimState.historyTracker.setLastHistoryEndPosition(vimState.allCursors.map(x => x.stop));

    if (vimState.getModeObject(this).isVisualMode) {
      // Store selection for commands like gv
      this._vimState.lastVisualMode = this._vimState.currentMode;
      this._vimState.lastVisualSelectionStart = this._vimState.cursorStartPosition;
      this._vimState.lastVisualSelectionEnd = this._vimState.cursorPosition;
    }

    // Updated desired column

    const movement = action instanceof BaseMovement ? action : undefined;

    if ((movement && !movement.doesntChangeDesiredColumn) ||
        (recordedState.command &&
         vimState.currentMode !== ModeName.VisualBlock &&
         vimState.currentMode !== ModeName.VisualBlockInsertMode)) {
      // We check !operator here because e.g. d$ should NOT set the desired column to EOL.

      if (movement && movement.setsDesiredColumnToEOL && !recordedState.operator) {
        vimState.desiredColumn = Number.POSITIVE_INFINITY;
      } else {
        vimState.desiredColumn = vimState.cursorPosition.character;
      }
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

  private async executeMovement(vimState: VimState, movement: BaseMovement)
    : Promise<{ vimState: VimState, recordedState: RecordedState }> {

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
      const cursorPosition = vimState.allCursors[i].stop;
      const old = vimState.cursorPosition;

      vimState.cursorPosition = cursorPosition;
      const result = await movement.execActionWithCount(cursorPosition, vimState, recordedState.count);
      vimState.cursorPosition = old;

      if (result instanceof Position) {
        vimState.allCursors[i] = vimState.allCursors[i].withNewStop(result);

        if (!vimState.getModeObject(this).isVisualMode &&
          !vimState.recordedState.operator) {

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

    if (vimState.currentMode === ModeName.Normal && !recordedState.operator) {
      for (const { stop, i } of Range.IterateRanges(vimState.allCursors)) {
        if (stop.character >= Position.getLineLength(stop.line)) {
          vimState.allCursors[i].withNewStop(
            stop.getLineEnd().getLeft()
          );
        }
      }
    } else {
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

    let resultVimState   = vimState;

    // TODO - if actions were more pure, this would be unnecessary.
    const cachedMode     = this._vimState.getModeObject(this);
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
        if (Position.EarlierOf(start, stop) === start) {
          stop = stop.getLeft();
        } else {
          stop = stop.getRight();
        }
      }

      if (this.currentModeName === ModeName.VisualLine) {
        start = start.getLineBegin();
        stop  = stop.getLineEnd();

        vimState.currentRegisterMode = RegisterMode.LineWise;
      }

      recordedState.operator.multicursorIndex = i++;

      resultVimState.currentMode = startingModeName;

      resultVimState = await recordedState.operator.run(resultVimState, start, stop);

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
        selections.push(new vscode.Selection(
          cursor.start,
          cursor.stop,
        ));
      }

      vscode.window.activeTextEditor.selections = selections;
    }

    return resultVimState;
  }

  private async executeCommand(vimState: VimState): Promise<VimState> {
    const transformations = vimState.recordedState.transformations;

    if (transformations.length === 0) {
      return vimState;
    }

    const textTransformations: TextTransformations[] = transformations.filter(x => isTextTransformation(x)) as any;
    const otherTransformations = transformations.filter(x => !isTextTransformation(x));

    let accumulatedPositionDifferences: { [key: number]: PositionDiff[] } = {};

    if (textTransformations.length > 0) {
      if (areAnyTransformationsOverlapping(textTransformations)) {
        // TODO: Select one transformation for every cursor and run them all
        // in parallel. Repeat till there are no more transformations.

        for (const command of textTransformations) {
          await vscode.window.activeTextEditor.edit(edit => {
            switch (command.type) {
              case "insertText":
                edit.insert(command.position, command.text);
                break;

              case "replaceText":
                edit.replace(new vscode.Selection(command.end, command.start), command.text);
                break;

              case "deleteText":
                edit.delete(new vscode.Range(command.position, command.position.getLeftThroughLineBreaks()));
                break;

              case "deleteRange":
                edit.delete(new vscode.Selection(command.range.start, command.range.stop));
                break;
            }

            if (command.cursorIndex === undefined) {
              throw new Error("No cursor index - this should never ever happen!");
            }

            if (command.diff) {
              if (!accumulatedPositionDifferences[command.cursorIndex]) {
                accumulatedPositionDifferences[command.cursorIndex] = [];
              }

              accumulatedPositionDifferences[command.cursorIndex].push(command.diff);
            }
          });
        };
      } else {
        // This is the common case!

        /**
         * batch all text operations together as a single operation
         * (this is primarily necessary for multi-cursor mode, since most
         * actions will trigger at most one text operation).
         */
        await vscode.window.activeTextEditor.edit(edit => {
          for (const command of textTransformations) {
            switch (command.type) {
              case "insertText":
                edit.insert(command.position, command.text);
                break;

              case "replaceText":
                edit.replace(new vscode.Selection(command.end, command.start), command.text);
                break;

              case "deleteText":
                edit.delete(new vscode.Range(command.position, command.position.getLeftThroughLineBreaks()));
                break;

              case "deleteRange":
                edit.delete(new vscode.Selection(command.range.start, command.range.stop));
                break;
            }

            if (command.cursorIndex === undefined) {
              throw new Error("No cursor index - this should never ever happen!");
            }

            if (command.diff) {
              if (!accumulatedPositionDifferences[command.cursorIndex]) {
                accumulatedPositionDifferences[command.cursorIndex] = [];
              }

              accumulatedPositionDifferences[command.cursorIndex].push(command.diff);
            }
          }
        });
      }
    }

    for (const command of otherTransformations) {
      switch (command.type) {
        case "insertTextVSCode":
          await TextEditor.insert(command.text);

          vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
          vimState.cursorPosition      = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.end);
          break;

        case "showCommandLine":
          await showCmdLine(vimState.commandInitialText, this);
          break;

        case "dot":
          if (!vimState.globalState.previousFullAction) {
            return vimState; // TODO(bell)
          }

          const clonedAction = vimState.globalState.previousFullAction.clone();

          await this.rerunRecordedState(vimState, vimState.globalState.previousFullAction);

          vimState.globalState.previousFullAction = clonedAction;
          break;
        case "macro":
          let recordedMacro = (await Register.getByKey(command.register)).text as RecordedState;

          if (command.replay === "contentChange") {
            vimState = await this.runMacro(vimState, recordedMacro);
          } else {
            let keyStrokes: string[] = [];
            for (let action of recordedMacro.actionsRun) {
              keyStrokes = keyStrokes.concat(action.keysPressed);
            }
            this.vimState.recordedState = new RecordedState();
            await this.handleMultipleKeyEvents(keyStrokes);
          }

          vimState.historyTracker.lastInvokedMacro = recordedMacro;

          if (vimState.lastMovementFailed) {
            // movement in last invoked macro failed then we should stop all following repeating macros.
            // Besides, we should reset `lastMovementFailed`.
            vimState.lastMovementFailed = false;
            return vimState;
          }
          break;
      }
    }

    const selections = vscode.window.activeTextEditor.selections;
    const firstTransformation = transformations[0];
    const manuallySetCursorPositions = ((firstTransformation.type === "deleteRange" || firstTransformation.type === "replaceText")
      && firstTransformation.manuallySetCursorPositions);

    // We handle multiple cursors in a different way in visual block mode, unfortunately.
    // TODO - refactor that out!
    if (vimState.currentMode !== ModeName.VisualBlockInsertMode &&
      vimState.currentMode !== ModeName.VisualBlock &&
      !manuallySetCursorPositions) {
      vimState.allCursors = [];

      const resultingCursors: Range[] = [];

      for (let i = 0; i < selections.length; i++) {
        let sel = Range.FromVSCodeSelection(selections[i]);

        let resultStart = Position.FromVSCodePosition(sel.start);
        let resultEnd   = Position.FromVSCodePosition(sel.stop);

        if (accumulatedPositionDifferences[i] && accumulatedPositionDifferences[i].length > 0) {
          for (const diff of accumulatedPositionDifferences[i]) {
            resultStart = resultStart.add(diff);
            resultEnd   = resultEnd  .add(diff);
          }

          sel = new Range(
            resultStart,
            resultEnd
          );
        } else {
          sel = new Range(
            Position.FromVSCodePosition(sel.start),
            Position.FromVSCodePosition(sel.stop),
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
          vimState.cursorPosition = vimState.cursorPosition.add(accumulatedPositionDifferences[0][0]);
          vimState.cursorStartPosition = vimState.cursorStartPosition.add(accumulatedPositionDifferences[0][0]);
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
        vimState.cursorPosition = new Position(vimState.cursorPosition.line, vimState.cursorStartPosition.character);
      }
    }

    vimState.recordedState.transformations = [];

    return vimState;
  }

  async rerunRecordedState(vimState: VimState, recordedState: RecordedState): Promise<VimState> {
    const actions = recordedState.actionsRun.slice(0);

    recordedState = new RecordedState();
    vimState.recordedState = recordedState;
    vimState.isRunningDotCommand = true;

    let i = 0;

    for (let action of actions) {
      recordedState.actionsRun = actions.slice(0, ++i);
      vimState = await this.runAction(vimState, recordedState, action);

      if (vimState.lastMovementFailed) {
        return vimState;
      }

      await this.updateView(vimState);
    }

    vimState.isRunningDotCommand = false;

    recordedState.actionsRun = actions;

    return vimState;
  }

  async runMacro(vimState: VimState, recordedMacro: RecordedState): Promise<VimState> {
    const actions = recordedMacro.actionsRun.slice(0);
    let recordedState = new RecordedState();
    vimState.recordedState = recordedState;
    vimState.isRunningDotCommand = true;
    let i = 0;

    for (let action of actions) {
      recordedState.actionsRun = actions.slice(0, ++i);
      vimState = await this.runAction(vimState, recordedState, action);

      if (vimState.lastMovementFailed) {
        break;
      }

      await this.updateView(vimState);
    }

    vimState.isRunningDotCommand = false;
    vimState.cursorPositionJustBeforeAnythingHappened = vimState.allCursors.map(x => x.stop);
    return vimState;
  }

  public async updateView(vimState: VimState,
    args: {drawSelection: boolean, revealRange: boolean} = {drawSelection: true, revealRange: true}): Promise<void> {
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
            start = start.getRight();
          }

          selections = [ new vscode.Selection(start, stop) ];
        } else if (vimState.currentMode === ModeName.VisualLine) {
          selections = [new vscode.Selection(
            Position.EarlierOf(start, stop).getLineBegin(),
            Position.LaterOf(start, stop).getLineEnd()
          )];

          // Maintain cursor position based on which direction the selection is going
          if (start.line <= stop.line) {
            vimState.cursorStartPosition = selections[0].start as Position;
            vimState.cursorPosition = selections[0].end as Position;
          } else {
            vimState.cursorStartPosition = selections[0].end as Position;
            vimState.cursorPosition = selections[0].start as Position;
          }
        } else if (vimState.currentMode === ModeName.VisualBlock) {
          selections = [];

          for (const { start: lineStart, end } of Position.IterateLine(vimState)) {
            selections.push(new vscode.Selection(
              lineStart,
              end
            ));
          }
        } else {
          selections = [ new vscode.Selection(stop, stop) ];
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
        } else if (vimState.currentMode === ModeName.Normal ||
                   vimState.currentMode === ModeName.Insert ||
                   vimState.currentMode === ModeName.SearchInProgressMode) {
          selections = [];

          for (const { stop: cursorStop } of vimState.allCursors) {
            selections.push(new vscode.Selection(cursorStop, cursorStop));
          }
        } else {
          console.error("This is pretty bad!");

          selections = [];
        }
      }

      this._vimState.whatILastSetTheSelectionTo = selections[0];
      vscode.window.activeTextEditor.selections = selections;
    }

    // Scroll to position of cursor
    if (this._vimState.currentMode === ModeName.SearchInProgressMode) {
      const nextMatch = vimState.globalState.searchState!.getNextSearchMatchPosition(vimState.cursorPosition).pos;

      vscode.window.activeTextEditor.revealRange(new vscode.Range(nextMatch, nextMatch));
    } else {
      if (args.revealRange) {
        vscode.window.activeTextEditor.revealRange(new vscode.Range(vimState.cursorPosition, vimState.cursorPosition));
      }
    }

    let cursorRange: vscode.Range[] = [];

    // Draw block cursor.

    if (Configuration.useSolidBlockCursor) {
      await vscode.workspace
        .getConfiguration("editor")
        .update("cursorBlinking", this.currentMode.name !== ModeName.Insert ? "solid" : "blink", true);
    }

    // Use native block cursor if possible.
    let cursorStyle = this.currentMode.cursorType === VSCodeVimCursorType.Native &&
      this.currentMode.name !== ModeName.VisualBlockInsertMode &&
      this.currentMode.name !== ModeName.Insert ?
      vscode.TextEditorCursorStyle.Block : vscode.TextEditorCursorStyle.Line;

    let options = vscode.window.activeTextEditor.options;
    options.cursorStyle = cursorStyle;
    vscode.window.activeTextEditor.options = options;

    // TODO xconverge: temporary workaround for vscode bug not changing cursor style properly
    // https://github.com/Microsoft/vscode/issues/17472
    // https://github.com/Microsoft/vscode/issues/17513
    if (options.cursorStyle === vscode.TextEditorCursorStyle.Block) {
      vscode.window.activeTextEditor.options.cursorStyle = vscode.TextEditorCursorStyle.Line;
      vscode.window.activeTextEditor.options.cursorStyle = vscode.TextEditorCursorStyle.Block;
    } else if (options.cursorStyle === vscode.TextEditorCursorStyle.Line) {
      vscode.window.activeTextEditor.options.cursorStyle = vscode.TextEditorCursorStyle.Block;
      vscode.window.activeTextEditor.options.cursorStyle = vscode.TextEditorCursorStyle.Line;
    }

    if (this.currentMode.cursorType === VSCodeVimCursorType.TextDecoration &&
      this.currentMode.name !== ModeName.Insert) {

      // Fake block cursor with text decoration. Unfortunately we can't have a cursor
      // in the middle of a selection natively, which is what we need for Visual Mode.

      for (const { stop: cursorStop } of vimState.allCursors) {
        cursorRange.push(new vscode.Range(cursorStop, cursorStop.getRight()));
      }
    }

    vscode.window.activeTextEditor.setDecorations(this._caretDecoration, cursorRange);

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
      (Configuration.incsearch && this.currentMode.name === ModeName.SearchInProgressMode) ||
      ((Configuration.hlsearch && Configuration.hl) && vimState.globalState.searchState)) {

      const searchState = vimState.globalState.searchState!;

      searchRanges.push.apply(searchRanges, searchState.matchRanges);

      const { pos, match } = searchState.getNextSearchMatchPosition(vimState.cursorPosition);

      if (match) {
        searchRanges.push(new vscode.Range(
          pos,
          pos.getRight(searchState.searchString.length)));
      }
    }

    vscode.window.activeTextEditor.setDecorations(this._searchHighlightDecoration, searchRanges);

    for (let i = 0; i < this.vimState.postponedCodeViewChanges.length; i++) {
      let viewChange = this.vimState.postponedCodeViewChanges[i];
      await vscode.commands.executeCommand(viewChange.command, viewChange.args);
    }

    this.vimState.postponedCodeViewChanges = [];

    if (this.currentMode.name === ModeName.SearchInProgressMode) {
      this.setStatusBarText(`Searching for: ${ this.vimState.globalState.searchState!.searchString }`);
    } else if (this.currentMode.name === ModeName.EasyMotionMode) {
      // Update all EasyMotion decorations
      this._vimState.easyMotion.updateDecorations();

      this.setStatusBarText(`Current depth: ${ this.vimState.easyMotion.accumulation }`);
    } else {
      this._renderStatusBar();
    }

    vscode.commands.executeCommand('setContext', 'vim.useCtrlKeys', Configuration.useCtrlKeys);
    vscode.commands.executeCommand('setContext', 'vim.platform', process.platform);
  }

  private _renderStatusBar(): void {
      const modeText = `-- ${this.currentMode.text.toUpperCase()} ${this._vimState.isMultiCursor ? 'MULTI CURSOR' : ''} --`;
      const macroText = ` ${this._vimState.isRecordingMacro ? 'Recording @' + this._vimState.recordedMacro.registerName : ''}`;
      let currentCommandText = ` ${ this._vimState.recordedState.commandString }`;

      if (this._vimState.currentMode === ModeName.Insert) {
        currentCommandText = "";
      }

      if (this._vimState.currentMode === ModeName.SearchInProgressMode) {
        currentCommandText = ` ${ this._vimState.globalState.searchState!.searchString }`;
      }

      this.setStatusBarText(`${ modeText }${ currentCommandText }${ macroText }`);
  }

  async handleMultipleKeyEvents(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.handleKeyEvent(key!);
    }
  }

  /**
   * Set the text in the status bar on the bottom of the screen.
   */
  setStatusBarText(text: string): void {
    if (!ModeHandler._statusBarItem) {
      ModeHandler._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }

    ModeHandler._statusBarItem.text = text || '';
    ModeHandler._statusBarItem.show();
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
    for (const disposable of this._toBeDisposed) {
      disposable.dispose();
    }
  }
}
