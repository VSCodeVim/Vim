import * as vscode from 'vscode';

import { SUPPORT_IME_SWITCHER, SUPPORT_NVIM } from 'platform/constants';
import { Position } from 'vscode';
import { IMovement } from '../actions/baseMotion';
import { IEasyMotion } from '../actions/plugins/easymotion/types';
import { SurroundState } from '../actions/plugins/surround';
import { ExCommandLine, SearchCommandLine } from '../cmd_line/commandLine';
import { Cursor } from '../common/motion/cursor';
import { configuration } from '../configuration/configuration';
import {
  DotCommandStatus,
  isPseudoMode,
  isVisualMode,
  Mode,
  NormalCommandState,
} from '../mode/mode';
import { ModeData } from '../mode/modeData';
import { Logger } from '../util/logger';
import { SearchDirection } from '../vimscript/pattern';
import { HistoryTracker } from './../history/historyTracker';
import { RegisterMode } from './../register/register';
import { ReplaceState } from './../state/replaceState';
import { globalState } from './globalState';
import { RecordedState } from './recordedState';

interface IInputMethodSwitcher {
  switchInputMethod(prevMode: Mode, newMode: Mode): Promise<void>;
}

interface IBaseMovement {
  execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number,
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

  public editor: vscode.TextEditor;

  public get document(): vscode.TextDocument {
    return this.editor.document;
  }

  /**
   * Are multiple cursors currently present?
   */
  public get isMultiCursor(): boolean {
    return this._cursors.length > 1;
  }

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

  /**
   * Keep track of whether the last command that ran is able to be repeated
   * with the dot command.
   */
  public lastCommandDotRepeatable: boolean = true;

  public dotCommandStatus: DotCommandStatus = DotCommandStatus.Waiting;
  public isReplayingMacro: boolean = false;
  public normalCommandState: NormalCommandState = NormalCommandState.Waiting;

  /**
   * The last visual selection before running the dot command
   */
  public dotCommandPreviousVisualSelection: vscode.Selection | undefined = undefined;

  public surround: SurroundState | undefined = undefined;

  /**
   * Used for `<C-o>` in insert/replace mode, which allows you run one normal mode
   * command, then go back to insert/replace mode.
   */
  public modeToReturnToAfterNormalCommand: Mode.Insert | Mode.Replace | undefined;
  public actionCount = 0;

  /**
   * Backwards-compat alias for master's pre-#5842 boolean. Master's `insert.ts`
   * / `put.ts` set/read this; #5842 introduced the typed
   * `modeToReturnToAfterNormalCommand` for the same `<C-o>` flow. Both stay in
   * sync — assigning either updates the other via accessor pattern.
   */
  public get returnToInsertAfterCommand(): boolean {
    return this.modeToReturnToAfterNormalCommand !== undefined;
  }
  public set returnToInsertAfterCommand(value: boolean) {
    if (value) {
      this.modeToReturnToAfterNormalCommand ??= Mode.Insert;
    } else {
      this.modeToReturnToAfterNormalCommand = undefined;
    }
  }

  /**
   * Every time we invoke a VSCode command which might trigger a view update.
   * We should postpone its view updating phase to avoid conflicting with our internal view updating mechanism.
   * This array is used to cache every VSCode view updating event and they will be triggered once we run the inhouse `viewUpdate`.
   */
  public postponedCodeViewChanges: ViewChange[] = [];

  /**
   * @deprecated Use cursor.start instead
   */
  public get cursorStartPosition(): Position {
    return this.cursor.start;
  }
  public set cursorStartPosition(value: Position) {
    if (!value.isValid(this.document)) {
      Logger.warn(`invalid cursor start position. ${value.toString()}.`);
    }
    this.cursor = this.cursor.withNewStart(value);
  }

  /**
   * @deprecated Use cursor.stop instead
   */
  public get cursorStopPosition(): Position {
    return this.cursor.stop;
  }
  public set cursorStopPosition(value: Position) {
    if (!value.isValid(this.document)) {
      Logger.warn(`invalid cursor stop position. ${value.toString()}.`);
    }
    this.cursor = this.cursor.withNewStop(value);
  }

  /**
   * The position of every cursor. Will never be empty.
   */
  private _cursors: Cursor[] = [Cursor.atPosition(new Position(0, 0))];

  /**
   * The 'primary' or 'active' cursor.
   * What this means is somewhat context dependent, but generally it's safe to
   * use this when you only care about a single cursor.
   */
  public get cursor(): Cursor {
    return this._cursors[0];
  }
  public set cursor(value: Cursor) {
    this._cursors[0] = value;
  }

  public get cursors(): Cursor[] {
    return this._cursors;
  }
  public set cursors(value: readonly Cursor[]) {
    if (value.length === 0) {
      Logger.warn('Tried to set VimState.cursors to an empty array');
      return;
    }

    const map = new Map<string, Cursor>();
    for (const cursor of value) {
      if (!cursor.isValid(this.document)) {
        Logger.warn(`Invalid cursor position: ${cursor.toString()}`);
      }

      // use a map to ensure no two cursors are at the same location.
      map.set(cursor.toString(), cursor);
    }

    this._cursors = [...map.values()];
  }

  /**
   * Initial state of cursors prior to any action being performed
   */
  private _cursorsInitialState!: readonly Cursor[];
  public get cursorsInitialState(): readonly Cursor[] {
    return this._cursorsInitialState;
  }
  public set cursorsInitialState(cursors: readonly Cursor[]) {
    this._cursorsInitialState = [...cursors];
  }

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
        mode: Mode.Visual | Mode.VisualLine | Mode.VisualBlock;
        start: Position;
        end: Position;
      }
    | undefined = undefined;

  /**
   * The current mode and its associated state.
   */
  public modeData: ModeData = { mode: Mode.Normal };

  public get currentMode(): Mode {
    return this.modeData.mode;
  }

  private inputMethodSwitcher?: IInputMethodSwitcher;
  /**
   * The mode Vim is currently including pseudo-modes like OperatorPendingMode
   * This is to be used only by the Remappers when getting the remappings or the
   * 'showmode' to show the mode to user o don't use it anywhere else.
   */
  public get currentModeIncludingPseudoModes(): Mode {
    if (this.recordedState.getOperatorState(this.currentMode) === 'pending') {
      return Mode.OperatorPendingMode;
    } else if (this.modeToReturnToAfterNormalCommand && this.currentMode === Mode.Normal) {
      return this.modeToReturnToAfterNormalCommand === Mode.Insert
        ? Mode.InsertNormal
        : Mode.ReplaceNormal;
    } else if (
      isVisualMode(this.currentMode) &&
      this.modeBeforeEnteringVisualMode !== undefined &&
      this.modeBeforeEnteringVisualMode !== Mode.Normal
    ) {
      const previous: 'insert' | 'replace' | undefined =
        this.modeBeforeEnteringVisualMode === Mode.Insert
          ? 'insert'
          : this.modeBeforeEnteringVisualMode === Mode.Replace
            ? 'replace'
            : undefined;
      if (previous === undefined) {
        // Defensive: shouldn't happen but exit gracefully with the real mode.
        return this.currentMode;
      }
      switch (this.currentMode) {
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
          return this.currentMode;
      }
    } else {
      return this.currentMode;
    }
  }

  public async setModeData(modeData: ModeData): Promise<void> {
    if (modeData === undefined) {
      // TODO: remove this once we're sure this is no longer an issue (#6500, #6464)
      throw new Error('Tried setting modeData to undefined');
    }

    await this.inputMethodSwitcher?.switchInputMethod(this.currentMode, modeData.mode);
    if (
      this.modeToReturnToAfterNormalCommand &&
      [Mode.Insert, Mode.Replace].includes(modeData.mode)
    ) {
      this.modeToReturnToAfterNormalCommand = undefined;
    }

    if (modeData.mode === Mode.SearchInProgressMode) {
      globalState.searchState = modeData.commandLine.getSearchState();
    }

    this.setTextEditorLineNumbersStyle(modeData.mode);

    this.modeData = modeData;
  }

  public setTextEditorLineNumbersStyle(mode: Mode): void {
    if (configuration.smartRelativeLine) {
      this.editor.options.lineNumbers = [Mode.Insert, Mode.Disabled].includes(mode)
        ? vscode.TextEditorLineNumbersStyle.On
        : vscode.TextEditorLineNumbersStyle.Relative;
    }
  }

  public async setCurrentMode(mode: Mode): Promise<void> {
    if (mode === undefined) {
      // TODO: remove this once we're sure this is no longer an issue (#6500, #6464)
      throw new Error('Tried setting currentMode to undefined');
    }
    if (isPseudoMode(mode)) {
      throw new Error(`Can't set current mode to a pseudo mode like '${Mode[mode]}'`);
    }

    if (isVisualMode(mode) && !isVisualMode(this.currentMode)) {
      // Entering a visual/select mode. Remember where to return to ONLY if we
      // came from Insert or Replace (the `<C-o>` / `<S-arrow>` from-Insert
      // flow); other source modes (Normal, SearchInProgressMode, etc.) go
      // back to Normal on exit, so don't pollute modeBeforeEnteringVisualMode.
      const target = this.modeToReturnToAfterNormalCommand ?? this.currentMode;
      this.modeBeforeEnteringVisualMode = [Mode.Insert, Mode.Replace].includes(target)
        ? target
        : undefined;
    } else if (isVisualMode(this.currentMode) && !isVisualMode(mode)) {
      // Leaving a visual/select mode. If we had stored an Insert/Replace return
      // target and the new mode isn't Insert/Replace itself, force the return.
      // (If the user is going to Insert/Replace deliberately, leave it be.)
      if (this.modeBeforeEnteringVisualMode && ![Mode.Insert, Mode.Replace].includes(mode)) {
        mode = this.modeBeforeEnteringVisualMode;
      }
      this.modeBeforeEnteringVisualMode = undefined;
    }

    if (this.modeToReturnToAfterNormalCommand && [Mode.Insert, Mode.Replace].includes(mode)) {
      this.modeToReturnToAfterNormalCommand = undefined;
    }

    await this.setModeData(
      mode === Mode.Replace
        ? {
            mode,
            replaceState: new ReplaceState(
              this.cursors.map((cursor) => cursor.stop),
              this.recordedState.count,
            ),
          }
        : mode === Mode.CommandlineInProgress
          ? {
              mode,
              commandLine: new ExCommandLine('', this.modeData.mode),
            }
          : mode === Mode.SearchInProgressMode
            ? {
                mode,
                commandLine: new SearchCommandLine(this, '', SearchDirection.Forward),
                firstVisibleLineBeforeSearch: this.editor.visibleRanges[0].start.line,
              }
            : mode === Mode.Insert
              ? {
                  mode,
                  highSurrogate: undefined,
                }
              : { mode },
    );
  }

  /**
   * The currently active `RegisterMode`.
   *
   * When setting, `undefined` means "default for current `Mode`".
   */
  public set currentRegisterMode(registerMode: RegisterMode | undefined) {
    this._currentRegisterMode = registerMode;
  }
  public get currentRegisterMode(): RegisterMode {
    if (this._currentRegisterMode) {
      return this._currentRegisterMode;
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
  private _currentRegisterMode: RegisterMode | undefined;

  public recordedState = new RecordedState();

  /** The macro currently being recorded, if one exists. */
  public macro: RecordedState | undefined;

  public nvim?: INVim;

  public constructor(editor: vscode.TextEditor, easyMotion: IEasyMotion) {
    this.editor = editor;
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

export interface ViewChange {
  command: string;
  args: any;
}
