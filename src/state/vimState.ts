import * as vscode from 'vscode';

import { BaseMovement } from '../actions/baseMotion';
import { configuration } from '../configuration/configuration';
import { EasyMotion } from './../actions/plugins/easymotion/easymotion';
import { EditorIdentity } from './../editorIdentity';
import { HistoryTracker } from './../history/historyTracker';
import { Logger } from '../util/logger';
import { isPseudoMode, isVisualMode, Mode } from '../mode/mode';
import { Range } from './../common/motion/range';
import { RecordedState } from './recordedState';
import { RegisterMode } from './../register/register';
import { ReplaceState } from './../state/replaceState';
import { SurroundState } from '../actions/plugins/surround';
import { SUPPORT_NVIM, SUPPORT_IME_SWITCHER } from 'platform/constants';
import { Position } from 'vscode';

interface IInputMethodSwitcher {
  switchInputMethod(prevMode: Mode, newMode: Mode): Promise<void>;
}

interface INVim {
  run(vimState: VimState, command: string): Promise<{ statusBarText: string; error: boolean }>;

  dispose(): void;
}

/**
 * The VimState class holds permanent state that carries over from action
 * to action.
 *
 * Actions defined in actions.ts are only allowed to mutate a VimState in order to
 * indicate what they want to do.
 *
 * Each ModeHandler holds a VimState, so there is one for each open editor.
 */
export class VimState implements vscode.Disposable {
  private static readonly logger = Logger.get('VimState');

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

  public identity: EditorIdentity;

  public editor: vscode.TextEditor;

  public get document(): vscode.TextDocument {
    return this.editor.document;
  }

  /**
   * Are multiple cursors currently present?
   */
  // TODO: why isn't this a function?
  public isMultiCursor = false;

  /**
   * Is the multicursor something like visual block "multicursor", where
   * natively in vim there would only be one cursor whose changes were applied
   * to all lines after edit.
   */
  public isFakeMultiCursor = false;

  /**
   * Tracks movements that can be repeated with ; (e.g. t, T, f, and F).
   */
  public lastSemicolonRepeatableMovement: BaseMovement | undefined = undefined;

  /**
   * Tracks movements that can be repeated with , (e.g. t, T, f, and F).
   */
  public lastCommaRepeatableMovement: BaseMovement | undefined = undefined;

  // TODO: move into ModeHandler
  public lastMovementFailed: boolean = false;

  public alteredHistory = false;

  public isRunningDotCommand = false;
  public isReplayingMacro: boolean = false;

  /**
   * The last visual selection before running the dot command
   */
  public dotCommandPreviousVisualSelection: vscode.Selection | undefined = undefined;

  /**
   * The first line number that was visible when SearchInProgressMode began (undefined if not searching)
   */
  public firstVisibleLineBeforeSearch: number | undefined = undefined;

  // TODO: move into ModeHandler
  public focusChanged = false;

  public surround: SurroundState | undefined = undefined;

  /**
   * Used for `<C-o>` in insert/replace mode, which allows you run one normal mode
   * command, then go back to insert/replace mode.
   */
  public modeToReturnToAfterNormalCommand: Mode.Insert | Mode.Replace | undefined;
  public actionCount = 0;

  /**
   * Every time we invoke a VSCode command which might trigger a view update.
   * We should postpone its view updating phase to avoid conflicting with our internal view updating mechanism.
   * This array is used to cache every VSCode view updating event and they will be triggered once we run the inhouse `viewUpdate`.
   */
  public postponedCodeViewChanges: ViewChange[] = [];

  /**
   * All the keys we've pressed so far.
   */
  public keyHistory: string[] = [];

  /**
   * The cursor position (start, stop) when this action finishes.
   */
  public get cursorStartPosition(): Position {
    return this.cursors[0].start;
  }
  public set cursorStartPosition(value: Position) {
    if (!value.isValid(this.editor)) {
      VimState.logger.warn(`invalid cursor start position. ${value.toString()}.`);
    }
    this.cursors[0] = this.cursors[0].withNewStart(value);
  }

  public get cursorStopPosition(): Position {
    return this.cursors[0].stop;
  }
  public set cursorStopPosition(value: Position) {
    if (!value.isValid(this.editor)) {
      VimState.logger.warn(`invalid cursor stop position. ${value.toString()}.`);
    }
    this.cursors[0] = this.cursors[0].withNewStop(value);
  }

  /**
   * The position of every cursor. Will never be empty.
   */
  private _cursors: Range[] = [new Range(new Position(0, 0), new Position(0, 0))];

  public get cursors(): Range[] {
    return this._cursors;
  }
  public set cursors(value: Range[]) {
    if (value.length === 0) {
      VimState.logger.warn('Tried to set VimState.cursors to an empty array');
      return;
    }

    const map = new Map<string, Range>();
    for (const cursor of value) {
      if (!cursor.isValid(this.editor)) {
        VimState.logger.warn(`invalid cursor position. ${cursor.toString()}.`);
      }

      // use a map to ensure no two cursors are at the same location.
      map.set(cursor.toString(), cursor);
    }

    this._cursors = [...map.values()];
    this.isMultiCursor = this._cursors.length > 1;
  }

  /**
   * Initial state of cursors prior to any action being performed
   */
  private _cursorsInitialState: Range[];
  public get cursorsInitialState(): Range[] {
    return this._cursorsInitialState;
  }
  public set cursorsInitialState(cursors: Range[]) {
    this._cursorsInitialState = [...cursors];
  }

  public replaceState: ReplaceState | undefined = undefined;

  /**
   * Stores the mode that vimState had before entering the current visual mode.
   * This is used to create the pseudo modes of Insert/Replace visual modes, like
   * when you select with `<S-arrowKey>` when in InsertMode, or when you use `<C-o>`
   * on InsertMode and then enter visual mode with `v`, `V` or `<C-v>`.
   *
   * This should be cleared everytime we leave a visual mode.
   */
  public modeBeforeEnteringVisualMode?: Mode;

  /**
   * Stores last visual mode as well as what was selected for `gv`
   */
  public lastVisualSelection:
    | {
        mode: Mode;
        start: Position;
        end: Position;
      }
    | undefined = undefined;

  /**
   * Was the previous mouse click past EOL
   */
  public lastClickWasPastEol: boolean = false;

  /**
   * Used internally to ignore selection changes that were performed by us.
   * 'ignoreIntermediateSelections': set to true when running an action, during this time
   * all selections change events will be ignored.
   * 'ourSelections': keeps track of our selections that will trigger a selection change event
   * so that we can ignore them.
   */
  public selectionsChanged = {
    /**
     * Set to true when running an action, during this time
     * all selections change events will be ignored.
     */
    ignoreIntermediateSelections: false,
    /**
     * keeps track of our selections that will trigger a selection change event
     * so that we can ignore them.
     */
    ourSelections: Array<string>(),
  };

  /**
   * The mode Vim will be in once this action finishes.
   */
  private _currentMode: Mode = Mode.Normal;

  public get currentMode(): Mode {
    return this._currentMode;
  }

  private _inputMethodSwitcher?: IInputMethodSwitcher;
  /**
   * The mode Vim is currently including pseudo-modes like OperatorPendingMode
   * This is to be used only by the Remappers when getting the remappings or the
   * 'showmode' to show the mode to user o don't use it anywhere else.
   */
  public get currentModeIncludingPseudoModes(): Mode {
    if (this.recordedState.isOperatorPending(this._currentMode)) {
      return Mode.OperatorPendingMode;
    } else if (this.modeToReturnToAfterNormalCommand && this._currentMode === Mode.Normal) {
      if (this.modeToReturnToAfterNormalCommand === Mode.Insert) {
        return Mode.InsertNormal;
      } else {
        return Mode.ReplaceNormal;
      }
    } else if (
      isVisualMode(this._currentMode) &&
      this.modeBeforeEnteringVisualMode !== undefined &&
      this.modeBeforeEnteringVisualMode !== Mode.Normal
    ) {
      let previous = '';
      if (this.modeBeforeEnteringVisualMode === Mode.Insert) {
        previous = 'insert';
      } else if (this.modeBeforeEnteringVisualMode === Mode.Replace) {
        previous = 'replace';
      } else {
        // This shouldn't happen but in case it does we can exit gracefully with
        // the currentMode
        return this._currentMode;
      }

      switch (this._currentMode) {
        case Mode.Visual:
          return previous === 'insert' ? Mode.InsertVisual : Mode.ReplaceVisual;
        case Mode.VisualLine:
          return previous === 'insert' ? Mode.InsertVisualLine : Mode.ReplaceVisualLine;
        case Mode.VisualBlock:
          return previous === 'insert' ? Mode.InsertVisualBlock : Mode.ReplaceVisualBlock;
        case Mode.Select:
          return previous === 'insert' ? Mode.InsertSelect : Mode.ReplaceSelect;
        case Mode.SelectLine:
          return previous === 'insert' ? Mode.InsertSelectLine : Mode.ReplaceSelectLine;
        case Mode.SelectBlock:
          return previous === 'insert' ? Mode.InsertSelectBlock : Mode.ReplaceSelectBlock;
        default:
          // This shouldn't happen but in case it does we can exit gracefully with
          // the currentMode
          return this._currentMode;
      }
    } else {
      return this._currentMode;
    }
  }

  public async setCurrentMode(mode: Mode): Promise<void> {
    if (isPseudoMode(mode)) {
      throw new Error(`Can't set current mode to a pseudo mode like '${Mode[mode]}'`);
    }

    await this._inputMethodSwitcher?.switchInputMethod(this._currentMode, mode);

    if (isVisualMode(mode) && !isVisualMode(this._currentMode)) {
      // we are changing to a visual mode so we need to store the currentMode or
      // in case `<C-o>` was used we need to store the mode before the `<C-o>`
      this.modeBeforeEnteringVisualMode =
        this.modeToReturnToAfterNormalCommand ?? this._currentMode;
    } else if (isVisualMode(this._currentMode) && !isVisualMode(mode)) {
      // Leaving visual mode

      // Check if we had a modeBeforeEnteringVisualMode defined, if we did we
      // need to force that mode now. We do this here this way so that we didn't
      // have to insert this logic on every command and operator that can run
      // on visual modes. Unless we are going to Insert/Replace Mode which should
      // be the possible modes before, in that case we leave it be, because if
      // modeBefore was replace but now we used a command that puts us in insert
      // we do want to be put in InsertMode and not be forced to ReplaceMode, after
      // exiting we can go back to normal.
      if (this.modeBeforeEnteringVisualMode && ![Mode.Insert, Mode.Replace].includes(mode)) {
        mode = this.modeBeforeEnteringVisualMode;
      }
      this.modeBeforeEnteringVisualMode = undefined;
    }

    if (this.modeToReturnToAfterNormalCommand && [Mode.Insert, Mode.Replace].includes(mode)) {
      this.modeToReturnToAfterNormalCommand = undefined;
    }

    // Change the mode:
    this._currentMode = mode;

    if (configuration.smartRelativeLine) {
      this.editor.options.lineNumbers =
        mode === Mode.Insert
          ? vscode.TextEditorLineNumbersStyle.On
          : vscode.TextEditorLineNumbersStyle.Relative;
    }

    if (mode === Mode.SearchInProgressMode) {
      this.firstVisibleLineBeforeSearch = this.editor.visibleRanges[0].start.line;
    } else {
      this.firstVisibleLineBeforeSearch = undefined;
    }
  }

  public currentRegisterMode = RegisterMode.AscertainFromCurrentMode;

  public get effectiveRegisterMode(): RegisterMode {
    if (this.currentRegisterMode !== RegisterMode.AscertainFromCurrentMode) {
      return this.currentRegisterMode;
    }
    switch (this.currentMode) {
      case Mode.VisualLine:
        return RegisterMode.LineWise;
      case Mode.VisualBlock:
        return RegisterMode.BlockWise;
      default:
        return RegisterMode.CharacterWise;
    }
  }

  public currentCommandlineText = '';
  public statusBarCursorCharacterPos = 0;

  public recordedState = new RecordedState();

  /** The macro currently being recorded, if one exists. */
  public macro: RecordedState | undefined;

  public lastInvokedMacro: RecordedState | undefined;

  public nvim?: INVim;

  public constructor(editor: vscode.TextEditor) {
    this.editor = editor;
    this.identity = EditorIdentity.fromEditor(editor);
    this.historyTracker = new HistoryTracker(this);
    this.easyMotion = new EasyMotion();
  }

  async load() {
    if (SUPPORT_NVIM) {
      const m = await import('../neovim/neovim');
      this.nvim = new m.NeovimWrapper();
    }

    if (SUPPORT_IME_SWITCHER) {
      const ime = await import('../actions/plugins/imswitcher');
      this._inputMethodSwitcher = new ime.InputMethodSwitcher();
    }
  }

  dispose() {
    this.nvim?.dispose();
  }
}

export class ViewChange {
  public command: string;
  public args: any;
}
