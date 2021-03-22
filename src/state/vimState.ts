import * as vscode from 'vscode';

import { IMovement } from '../actions/baseMotion';
import { configuration } from '../configuration/configuration';
import { IEasyMotion } from '../actions/plugins/easymotion/types';
import { EditorIdentity } from './../editorIdentity';
import { HistoryTracker } from './../history/historyTracker';
import { Logger } from '../util/logger';
import { Mode } from '../mode/mode';
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

interface IBaseMovement {
  execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement>;
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

  public easyMotion: IEasyMotion;

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
  public lastSemicolonRepeatableMovement: IBaseMovement | undefined = undefined;

  /**
   * Tracks movements that can be repeated with , (e.g. t, T, f, and F).
   */
  public lastCommaRepeatableMovement: IBaseMovement | undefined = undefined;

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
   * Used for `<C-o>` in insert mode, which allows you run one normal mode
   * command, then go back to insert mode.
   */
  public returnToInsertAfterCommand = false;
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

  private inputMethodSwitcher?: IInputMethodSwitcher;
  /**
   * The mode Vim is currently including pseudo-modes like OperatorPendingMode
   * This is to be used only by the Remappers when getting the remappings so don't
   * use it anywhere else.
   */
  public get currentModeIncludingPseudoModes(): Mode {
    return this.recordedState.isOperatorPending(this._currentMode)
      ? Mode.OperatorPendingMode
      : this._currentMode;
  }

  public async setCurrentMode(mode: Mode): Promise<void> {
    await this.inputMethodSwitcher?.switchInputMethod(this._currentMode, mode);
    if (this.returnToInsertAfterCommand && mode === Mode.Insert) {
      this.returnToInsertAfterCommand = false;
    }
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

  public constructor(editor: vscode.TextEditor, easyMotion: IEasyMotion) {
    this.editor = editor;
    this.identity = EditorIdentity.fromEditor(editor);
    this.historyTracker = new HistoryTracker(this);
    this.easyMotion = easyMotion;
  }

  async load() {
    if (SUPPORT_NVIM) {
      const m = await import('../neovim/neovim');
      this.nvim = new m.NeovimWrapper();
    }

    if (SUPPORT_IME_SWITCHER) {
      const ime = await import('../actions/plugins/imswitcher');
      this.inputMethodSwitcher = new ime.InputMethodSwitcher();
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
