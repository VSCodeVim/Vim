"use strict";

import * as vscode from 'vscode';
import * as _ from 'lodash';

import { getAndUpdateModeHandler } from './../../extension';
import { Transformation } from './../transformations/transformations';
import { Mode, ModeName, VSCodeVimCursorType } from './mode';
import { InsertModeRemapper, OtherModesRemapper } from './remapper';
import { NormalMode } from './modeNormal';
import { InsertMode } from './modeInsert';
import { VisualBlockMode, VisualBlockInsertionType } from './modeVisualBlock';
import { InsertVisualBlockMode } from './modeInsertVisualBlock';
import { VisualMode } from './modeVisual';
import { taskQueue } from './../taskQueue';
import { ReplaceMode } from './modeReplace';
import { SearchInProgressMode } from './modeSearchInProgress';
import { TextEditor } from './../textEditor';
import { VisualLineMode } from './modeVisualLine';
import { HistoryTracker } from './../history/historyTracker';
import {
  BaseMovement, BaseCommand, Actions, BaseAction,
  BaseOperator, isIMovement,
  KeypressState
} from './../actions/actions';
import { Position } from './../motion/position';
import { Range } from './../motion/range';
import { RegisterMode } from './../register/register';
import { showCmdLine } from '../../src/cmd_line/main';
import { Configuration } from '../../src/configuration/configuration';
import { PairMatcher } from './../matching/matcher';
import { Globals } from '../../src/globals';

/**
 * The VimState class holds permanent state that carries over from action
 * to action.
 *
 * Actions defined in actions.ts are only allowed to mutate a VimState in order to
 * indicate what they want to do.
 */
export class VimState {
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

  public isMultiCursor = false;

  /**
   * The keystroke sequence that made up our last complete action (that can be
   * repeated with '.').
   */
  public previousFullAction: RecordedState | undefined = undefined;

  public alteredHistory = false;

  public focusChanged = false;

  /**
   * Used to prevent non-recursive remappings from looping.
   */
  public isCurrentlyPreformingRemapping = false;

  /**
   * The current full action we are building up.
   */
  public currentFullAction: string[] = [];

  /**
   * The position the cursor will be when this action finishes.
   */
  public get cursorPosition(): Position {
    return this.allCursors[0].stop;
  }
  public set cursorPosition(value: Position) {
    this.allCursors[0].stop = value;
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
    this.allCursors[0].start = value;
  }

  /**
   * In Multi Cursor Mode, the position of every cursor.
   */
  public allCursors: Range[] = [ new Range(new Position(0, 0), new Position(0, 0)) ];

  public cursorPositionJustBeforeAnythingHappened = new Position(0, 0);

  public searchState: SearchState | undefined = undefined;

  public searchStatePrevious: SearchState | undefined = undefined;

  public replaceState: ReplaceState | undefined = undefined;

  /**
   * The mode Vim will be in once this action finishes.
   */
  public currentMode = ModeName.Normal;

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

  /**
   * Programmatically triggering an edit will unfortunately ALSO trigger our mouse update
   * function. We use this variable to determine if the update function was triggered
   * by us or by a mouse action.
   */
  public whatILastSetTheSelectionTo: vscode.Selection;
}

export enum SearchDirection {
  Forward = 1,
  Backward = -1
}

export class SearchState {
  private static readonly MAX_SEARCH_RANGES = 1000;
  private static specialCharactersRegex: RegExp = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;

  /**
   * Every range in the document that matches the search string.
   */
  private _matchRanges: vscode.Range[] = [];
  public get matchRanges(): vscode.Range[] {
    return this._matchRanges;
  }

  private _searchCursorStartPosition: Position;
  public get searchCursorStartPosition(): Position {
    return this._searchCursorStartPosition;
  }

  private _matchesDocVersion: number;
  private _searchDirection: SearchDirection = SearchDirection.Forward;
  private isRegex: boolean;

  private _searchString = "";
  public get searchString(): string {
    return this._searchString;
  }

  public set searchString(search: string){
    if (this._searchString !== search) {
      this._searchString = search;
      this._recalculateSearchRanges({ forceRecalc: true });
    }
  }

  private _recalculateSearchRanges({ forceRecalc }: { forceRecalc?: boolean } = {}): void {
    const search = this.searchString;

    if (search === "") { return; }

    if (this._matchesDocVersion !== TextEditor.getDocumentVersion() || forceRecalc) {
      // Calculate and store all matching ranges
      this._matchesDocVersion = TextEditor.getDocumentVersion();
      this._matchRanges = [];

      /* Decide whether the search is case sensitive.
       * If ignorecase is false, the search is case sensitive.
       * If ignorecase is true, the search should be case insensitive.
       * If both ignorecase and smartcase are true, the search is case sensitive only when the search string contains UpperCase character.
       */
      let ignorecase = Configuration.getInstance().ignorecase;

      if (ignorecase && Configuration.getInstance().smartcase && /[A-Z]/.test(search)) {
        ignorecase = false;
      }

      let searchRE = search;
      if (!this.isRegex) {
        searchRE = search.replace(SearchState.specialCharactersRegex, "\\$&");
      }

      const regexFlags = ignorecase ? 'gi' : 'g';

      let regex: RegExp;
      try {
        regex = new RegExp(searchRE, regexFlags);
      } catch (err) {
        // Couldn't compile the regexp, try again with special characters escaped
        searchRE = search.replace(SearchState.specialCharactersRegex, "\\$&");
        regex = new RegExp(searchRE, regexFlags);
      }

      outer:
      for (let lineIdx = 0; lineIdx < TextEditor.getLineCount(); lineIdx++) {
        const line = TextEditor.getLineAt(new Position(lineIdx, 0)).text;
        let result = regex.exec(line);

        while (result) {
          if (this._matchRanges.length >= SearchState.MAX_SEARCH_RANGES) {
            break outer;
          }

          this.matchRanges.push(new vscode.Range(
            new Position(lineIdx, result.index),
            new Position(lineIdx, result.index + result[0].length)
          ));

          if (result.index === regex.lastIndex) {
            regex.lastIndex++;
          }

          result = regex.exec(line);
        }
      }
    }
  }

  /**
   * The position of the next search, or undefined if there is no match.
   *
   * Pass in -1 as direction to reverse the direction we search.
   */
  public getNextSearchMatchPosition(startPosition: Position, direction = 1): { pos: Position, match: boolean} {
    this._recalculateSearchRanges();

    if (this._matchRanges.length === 0) {
      // TODO(bell)
      return { pos: startPosition, match: false };
    }

    const effectiveDirection = direction * this._searchDirection;

    if (effectiveDirection === SearchDirection.Forward) {
      for (let matchRange of this._matchRanges) {
        if (matchRange.start.compareTo(startPosition) > 0) {
          return { pos: Position.FromVSCodePosition(matchRange.start), match: true };
        }
      }

      // Wrap around
      // TODO(bell)
      return { pos: Position.FromVSCodePosition(this._matchRanges[0].start), match: true };
    } else {
      for (let matchRange of this._matchRanges.slice(0).reverse()) {
        if (matchRange.start.compareTo(startPosition) < 0) {
          return { pos: Position.FromVSCodePosition(matchRange.start), match: true };
        }
      }

      // TODO(bell)
      return {
        pos: Position.FromVSCodePosition(this._matchRanges[this._matchRanges.length - 1].start),
        match: true
      };
    }
  }

  constructor(direction: SearchDirection, startPosition: Position, searchString = "", { isRegex = false } = {}) {
    this._searchDirection = direction;
    this._searchCursorStartPosition = startPosition;
    this.searchString = searchString;
    this.isRegex = isRegex;
  }
}

export class ReplaceState {
  private _replaceCursorStartPosition: Position;

  public get replaceCursorStartPosition() {
    return this._replaceCursorStartPosition;
  }

  public originalChars: string[] = [];

  constructor(startPosition: Position) {
    this._replaceCursorStartPosition = startPosition;
    let text = TextEditor.getLineAt(startPosition).text.substring(startPosition.character);
    for (let [key, value] of text.split("").entries()) {
      this.originalChars[key + startPosition.character] = value;
    }
  }
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
    const useClipboard = Configuration.getInstance().useSystemClipboard;
    this.registerName = useClipboard ? '*' : '"';
  }
  /**
   * Keeps track of keys pressed for the next action. Comes in handy when parsing
   * multiple length movements, e.g. gg.
   */
  public actionKeys: string[] = [];

  public actionsRun: BaseAction[] = [];

  public hasRunOperator = false;

  public visualBlockInsertionType = VisualBlockInsertionType.Insert;

  public transformations: Transformation[] = [];

  /**
   * The operator (e.g. d, y, >) the user wants to run, if there is one.
   */
  public get operator(): BaseOperator {
    const list = _.filter(this.actionsRun, a => a instanceof BaseOperator);

    if (list.length > 1) { throw "Too many operators!"; }

    return list[0] as any;
  }

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
    res.hasRunOperator    = this.hasRunOperator;

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

  public toString(): string {
    let res = "";

    for (const action of this.actionsRun) {
      res += action!.toString();
    }

    return res;
  }
}

interface IViewState {
  selectionStart: Position;
  selectionStop : Position;
  currentMode   : ModeName;
}

export class ModeHandler implements vscode.Disposable {
  public static IsTesting = false;

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
  public filename: string;

  private _caretDecoration = vscode.window.createTextEditorDecorationType(
  {
    dark: {
      // used for dark colored themes
      backgroundColor: 'rgba(224, 224, 224, 0.4)',
      borderColor: 'rgba(224, 224, 224, 0.4)'
    },
    light: {
      // used for light colored themes
      backgroundColor: 'rgba(32, 32, 32, 0.4)',
      borderColor: 'rgba(32, 32, 32, 0.4)'
    },
    borderStyle: 'solid',
    borderWidth: '1px'
  });

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

    this.filename = filename;

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
    ];
    this.vimState.historyTracker = new HistoryTracker();

    this._vimState.currentMode = ModeName.Normal;

    this.setCurrentModeByName(this._vimState);

    // Sometimes, Visual Studio Code will start the cursor in a position which
    // is not (0, 0) - e.g., if you previously edited the file and left the cursor
    // somewhere else when you closed it. This will set our cursor's position to the position
    // that VSC set it to.
    if (vscode.window.activeTextEditor) {
      this._vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
      this._vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    }

    // Handle scenarios where mouse used to change current position.
    vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
      taskQueue.enqueueTask({
        promise: () => this.handleSelectionChange(e),
        isRunning: false,
      });
    });
  }

  private async handleSelectionChange(e: vscode.TextEditorSelectionChangeEvent): Promise<void> {
    let selection = e.selections[0];

    if (ModeHandler.IsTesting) {
      return;
    }

    if (e.textEditor.document.fileName !== this.filename) {
      return;
    }

    if (this._vimState.focusChanged) {
      this._vimState.focusChanged = false;

      return;
    }

    if (this._vimState.currentMode !== ModeName.VisualBlock           &&
        this._vimState.currentMode !== ModeName.VisualBlockInsertMode &&
      e.selections.length > this._vimState.allCursors.length) {
      // Hey, we just added a selection. Either trigger or update Multi Cursor Mode.

      console.log('Changed number of cursors?');

      if (e.selections.length >= 2) {
        this._vimState.currentMode = ModeName.Visual;
        this._vimState.isMultiCursor = true;

        this.setCurrentModeByName(this._vimState);
      } else {
        // The selections ran together - go back to visual mode.
        this._vimState.currentMode = ModeName.Visual;
        this.setCurrentModeByName(this._vimState);
        this._vimState.isMultiCursor = false;
      }

      this._vimState.allCursors = [];

      for (const sel of e.selections) {
        this._vimState.allCursors.push(Range.FromVSCodeSelection(sel));
      }

      await this.updateView(this._vimState);

      return;
    }

    if (this._vimState.isMultiCursor && e.selections.length === 1) {
      this._vimState.isMultiCursor = false;
    }

    if (this._vimState.isMultiCursor) {
      return;
    }

    if (this.currentModeName === ModeName.VisualBlock) {
      // Not worth it until we get a better API for this stuff.

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

    if (selection) {
      var newPosition = new Position(selection.active.line, selection.active.character);

      if (newPosition.character >= newPosition.getLineEnd().character) {
          newPosition = new Position(newPosition.line, Math.max(newPosition.getLineEnd().character, 0));
      }

      this._vimState.cursorPosition    = newPosition;
      this._vimState.cursorStartPosition = newPosition;

      this._vimState.desiredColumn     = newPosition.character;

      // start visual mode?

      if (!selection.anchor.isEqual(selection.active)) {
        var selectionStart = new Position(selection.anchor.line, selection.anchor.character);

        if (selectionStart.character > selectionStart.getLineEnd().character) {
          selectionStart = new Position(selectionStart.line, selectionStart.getLineEnd().character);
        }

        this._vimState.cursorStartPosition = selectionStart;

        if (selectionStart.compareTo(newPosition) > 0) {
          this._vimState.cursorStartPosition = this._vimState.cursorStartPosition.getLeft();
        }

        if (!this._vimState.getModeObject(this).isVisualMode) {
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

      await this.updateView(this._vimState, false);
    }
  }

  /**
   * The active mode.
   */
  get currentMode(): Mode {
    return this._modes.find(mode => mode.isActive);
  }

  setCurrentModeByName(vimState: VimState) {
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
    this._vimState.cursorPositionJustBeforeAnythingHappened = this._vimState.cursorPosition;

    try {
      let handled = false;
      if (!this._vimState.isCurrentlyPreformingRemapping) {
        // Non-recursive remapping do not allow for further mappings
        handled = handled || await this._insertModeRemapper.sendKey(key, this, this.vimState);
        handled = handled || await this._otherModesRemapper.sendKey(key, this, this.vimState);
        handled = handled || await this._insertModeNonRecursive.sendKey(key, this, this.vimState);
        handled = handled || await this._otherModesNonRecursive.sendKey(key, this, this.vimState);
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
      console.log("Nothing matched!");

      vimState.recordedState = new RecordedState();
      return vimState;
    } else if (result === KeypressState.WaitingOnKeys) {
      return vimState;
    }

    let action = result as BaseAction;

    recordedState.actionsRun.push(action);

    vimState = await this.runAction(vimState, recordedState, action);

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

    // Update view
    await this.updateView(vimState);

    return vimState;
  }

  async runAction(vimState: VimState, recordedState: RecordedState, action: BaseAction): Promise<VimState> {
    let ranRepeatableAction = false;
    let ranAction = false;

    // If arrow keys or mouse was used prior to entering characters while in insert mode, create an undo point
    // this needs to happen before any changes are made
    let prevPos = vimState.historyTracker.getLastHistoryEndPosition();
    if (prevPos !== undefined) {
      if (vimState.cursorPositionJustBeforeAnythingHappened.line !== prevPos.line ||
        vimState.cursorPositionJustBeforeAnythingHappened.character !== prevPos.character) {
        vimState.previousFullAction = recordedState;
        vimState.historyTracker.finishCurrentStep();
      }
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

    // Update mode (note the ordering allows you to go into search mode,
    // then return and have the motion immediately applied to an operator).

    if (vimState.currentMode !== this.currentModeName) {
      this.setCurrentModeByName(vimState);

      if (vimState.currentMode === ModeName.Normal) {
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

    ranRepeatableAction = (ranRepeatableAction && vimState.currentMode === ModeName.Normal) || this.createUndoPointForBrackets(vimState);
    ranAction = ranAction && vimState.currentMode === ModeName.Normal;

    // Record down previous action and flush temporary state
    if (ranRepeatableAction) {
      vimState.previousFullAction = vimState.recordedState;
    }

    if (ranAction) {
      vimState.recordedState = new RecordedState();
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

    // console.log(vimState.historyTracker.toString());

    recordedState.actionKeys = [];
    vimState.currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;

    if (this.currentModeName === ModeName.Normal) {
      vimState.cursorStartPosition = vimState.cursorPosition;
    }

    // Ensure cursor is within bounds
    for (const { stop, i } of Range.IterateRanges(vimState.allCursors)) {
      if (stop.line >= TextEditor.getLineCount()) {
        vimState.allCursors[i].stop = vimState.cursorPosition.getDocumentEnd();
      }

      const currentLineLength = TextEditor.getLineAt(stop).text.length;

      if (vimState.currentMode === ModeName.Normal &&
          stop.character >= currentLineLength && currentLineLength > 0) {

        vimState.allCursors[i].stop = stop.getLineEnd();
      }
    }

    // Update the current history step to have the latest cursor position incase it is needed
    vimState.historyTracker.setLastHistoryEndPosition(vimState.cursorPosition);

    return vimState;
  }

  private async executeMovement(vimState: VimState, movement: BaseMovement)
    : Promise<{ vimState: VimState, recordedState: RecordedState }> {

    let recordedState = vimState.recordedState;

    for (let i = 0; i < vimState.allCursors.length; i++) {
      const cursorPosition = vimState.allCursors[i].stop;
      const result = await movement.execActionWithCount(cursorPosition, vimState, recordedState.count);

      if (result instanceof Position) {
        vimState.allCursors[i].stop = result;

        if (!vimState.getModeObject(this).isVisualMode &&
            !vimState.recordedState.operator) {

          vimState.allCursors[i].start = result;
        }
      } else if (isIMovement(result)) {
        if (result.failed) {
          vimState.recordedState = new RecordedState();
        }

        vimState.allCursors[i] = Range.FromIMovement(result);

        if (result.registerMode) {
          vimState.currentRegisterMode = result.registerMode;
        }
      }
    }

    vimState.recordedState.count = 0;

    let stop = vimState.cursorPosition;

    // Keep the cursor within bounds

    if (vimState.currentMode === ModeName.Normal && !recordedState.operator) {
      for (const { stop, i } of Range.IterateRanges(vimState.allCursors)) {
        if (stop.character >= Position.getLineLength(stop.line)) {
          vimState.allCursors[i].stop = stop.getLineEnd().getLeft();
        }
      }
    } else {

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

      resultVimState = await recordedState.operator.run(resultVimState, start, stop);

      resultingCursors.push(new Range(
        resultVimState.cursorStartPosition,
        resultVimState.cursorPosition
      ));
    }

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

    return resultVimState;
  }

  private async executeCommand(vimState: VimState): Promise<VimState> {
    const transformations = vimState.recordedState.transformations;

    const isTextTransformation = (x: string) => {
      return x === 'insertText' ||
             x === 'deleteText';
    };

    const textTransformations  = transformations.filter(x => isTextTransformation(x.type));
    const otherTransformations = transformations.filter(x => !isTextTransformation(x.type));

    await vscode.window.activeTextEditor.edit(edit => {
      for (const command of transformations) {
        switch (command.type) {
          case "insertText":
            edit.insert(command.associatedCursor, command.text);
            break;

          case "deleteText":
            edit.delete(new vscode.Range(command.position, command.position.getLeft()));
            break;
        }
      }
    });

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
          if (!vimState.previousFullAction) {
            return vimState; // TODO(bell)
          }

          const clonedAction = vimState.previousFullAction.clone();

          await this.rerunRecordedState(vimState, vimState.previousFullAction);

          vimState.previousFullAction = clonedAction;
          break;
      }
    }

    vimState.recordedState.transformations = [];
    vimState.allCursors = [];

    for (const sel of vscode.window.activeTextEditor.selections) {
      vimState.allCursors.push(Range.FromVSCodeSelection(sel));
    }

    return vimState;
  }

  async rerunRecordedState(vimState: VimState, recordedState: RecordedState): Promise<VimState> {
    const actions = recordedState.actionsRun.slice(0);

    recordedState = new RecordedState();
    vimState.recordedState = recordedState;

    let i = 0;

    for (let action of actions) {
      recordedState.actionsRun = actions.slice(0, ++i);
      vimState = await this.runAction(vimState, recordedState, action);
    }

    recordedState.actionsRun = actions;

    return vimState;
  }

  public async updateView(vimState: VimState, drawSelection = true): Promise<void> {
    // Update cursor position

    let start = vimState.cursorStartPosition;
    let stop  = vimState.cursorPosition;

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
    }

    // Draw selection (or cursor)

    if (drawSelection) {
      let selections: vscode.Selection[];

      if (!vimState.isMultiCursor) {
        if (vimState.currentMode === ModeName.Visual) {
          selections = [ new vscode.Selection(start, stop) ];
        } else if (vimState.currentMode === ModeName.VisualLine) {
          selections = [ new vscode.Selection(
            Position.EarlierOf(start, stop).getLineBegin(),
            Position.LaterOf(start, stop).getLineEnd()
          ) ];
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

          for (const { start, stop } of vimState.allCursors) {
            selections.push(new vscode.Selection(start, stop));
          }
        } else if (vimState.currentMode === ModeName.Normal ||
                   vimState.currentMode === ModeName.Insert) {
          selections = [];

          for (const { stop } of vimState.allCursors) {
            selections.push(new vscode.Selection(stop, stop));
          }
        } else {
          console.error("This is pretty bad!");

          selections = [];
        }
      }

      this._vimState.whatILastSetTheSelectionTo = selections[0];
      vscode.window.activeTextEditor.selections = selections;
    }

    // Scroll to position of cursor TODO multi

    vscode.window.activeTextEditor.revealRange(new vscode.Range(vimState.cursorPosition, vimState.cursorPosition));

    let rangesToDraw: vscode.Range[] = [];

    // Draw block cursor.

    if (Configuration.getInstance().useSolidBlockCursor) {
      if (this.currentMode.name !== ModeName.Insert) {
        for (const { stop } of vimState.allCursors) {
          rangesToDraw.push(new vscode.Range(stop, stop.getRight()));
        }
      }
    } else {
      // Use native block cursor if possible.

      const options = vscode.window.activeTextEditor.options;

      options.cursorStyle = this.currentMode.cursorType === VSCodeVimCursorType.Native &&
                            this.currentMode.name       !== ModeName.VisualBlockInsertMode &&
                            this.currentMode.name       !== ModeName.Insert ?
        vscode.TextEditorCursorStyle.Block : vscode.TextEditorCursorStyle.Line;
      vscode.window.activeTextEditor.options = options;
    }

    if (this.currentMode.cursorType === VSCodeVimCursorType.TextDecoration &&
      this.currentMode.name !== ModeName.Insert) {

      // Fake block cursor with text decoration. Unfortunately we can't have a cursor
      // in the middle of a selection natively, which is what we need for Visual Mode.

      rangesToDraw.push(new vscode.Range(stop, stop.getRight()));
    }

    // Draw marks
    // I should re-enable this with a config setting at some point

    /*

    for (const mark of this.vimState.historyTracker.getMarks()) {
      rangesToDraw.push(new vscode.Range(mark.position, mark.position.getRight()));
    }

    */

    // Draw search highlight

    if (this.currentMode.name === ModeName.SearchInProgressMode ||
      (Configuration.getInstance().hlsearch && vimState.searchState)) {
      const searchState = vimState.searchState!;

      rangesToDraw.push.apply(rangesToDraw, searchState.matchRanges);

      const { pos, match } =  searchState.getNextSearchMatchPosition(vimState.cursorPosition);

      if (match) {
        rangesToDraw.push(new vscode.Range(
          pos,
          pos.getRight(searchState.searchString.length)));
      }
    }

    vscode.window.activeTextEditor.setDecorations(this._caretDecoration, rangesToDraw);

    if (this.currentMode.name === ModeName.SearchInProgressMode) {
      this.setupStatusBarItem(`Searching for: ${ this.vimState.searchState!.searchString }`);
    } else {
      this.setupStatusBarItem(`-- ${ this.currentMode.text.toUpperCase() } ${ this._vimState.isMultiCursor ? 'MULTI CURSOR' : '' } --`);
    }

    vscode.commands.executeCommand('setContext', 'vim.mode', this.currentMode.text);
    vscode.commands.executeCommand('setContext', 'vim.useCtrlKeys', Configuration.getInstance().useCtrlKeys);
  }

  async handleMultipleKeyEvents(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.handleKeyEvent(key!);
    }
  }

  setupStatusBarItem(text: string): void {
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
    // do nothing
  }
}
