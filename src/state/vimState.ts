import * as vscode from 'vscode';

import { BaseMovement } from '../actions/baseMotion';
import { configuration } from '../configuration/configuration';
import { EasyMotion } from './../actions/plugins/easymotion/easymotion';
import { EditorIdentity } from './../editorIdentity';
import { HistoryTracker } from './../history/historyTracker';
import { Logger } from '../util/logger';
import { Mode } from '../mode/mode';
import { Position } from './../common/motion/position';
import { Range } from './../common/motion/range';
import { RecordedState } from './recordedState';
import { RegisterMode } from './../register/register';
import { ReplaceState } from './../state/replaceState';
import { IKeyRemapping } from '../configuration/iconfiguration';
import { SurroundState } from '../actions/plugins/surround';
import { SUPPORT_NVIM, SUPPORT_IME_SWITCHER } from 'platform/constants';

interface IInputMethodSwitcher {
  switchInputMethod(prevMode: Mode, newMode: Mode);
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

  /**
   * For timing out remapped keys like jj to esc.
   */
  public lastKeyPressedTimestamp = 0;

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
   * Used to indicate that a non recursive remap is being handled. This is used to prevent non-recursive
   * remappings from looping.
   */
  public isCurrentlyPerformingNonRecursiveRemapping = false;

  /**
   * Used to indicate that a recursive remap is being handled. This is used to prevent recursive remappings
   * from looping farther then maxMapDepth and to stop recursive remappings when an action fails.
   */
  public isCurrentlyPerformingRecursiveRemapping = false;

  /**
   * Used to indicate that a remap is being handled and the keys sent to modeHandler were not typed
   * by the user.
   */
  public get isCurrentlyPerformingRemapping() {
    return (
      this.isCurrentlyPerformingNonRecursiveRemapping ||
      this.isCurrentlyPerformingRecursiveRemapping
    );
  }

  /**
   * When performing a recursive remapping that has no parent remappings and that finishes while
   * still waiting for timeout or another key to come we store that remapping here. This is used
   * to be able to handle those buffered keys and any other key that the user might press to brake
   * the timeout seperatly. Because if an error happens in the middle of a remap, the remaining
   * remap keys shouldn't be handled but the user pressed ones should, but if an error happens on
   * a user typed key, the following typed keys will still be handled.
   *
   * Example: having the following remapings:
   * * `nmap <leader>lf Lfill`
   * * `nmap Lfillc 4I<space><esc>`
   * * `nmap Lfillp 2I<space><esc>`
   * When user presses `<leader>lf` it remaps that to `Lfill` but because that is an ambiguous remap
   * it creates the timeout and returns from remapper setting the performing remapping flag to false.
   * This allows the user to then press `c` or `p` and the corresponding remap would run. But if the
   * user presses another key or the timeout finishes we need to handle the `Lfill` keys and they
   * need to know they were sent by a remap and not by the user so that in case the find 'i' in
   * `Lfill` fails the last two `l` shouldn't be executed and any keys typed by the user after the
   * remap that brake the timeout need to be handled seperatly from `Lfill`.
   * (Check the tests for this example to understand better).
   *
   * To prevent this, we stored the remapping that finished waiting for timeout so that, if the
   * timeout finishes or the user presses some keys that brake the potential remap, we will know
   * what was the remapping waiting for timeout. So in case the timeout finishes we set the
   * currently performing recursive remapping flag to true manually, send the <TimeoutFinished> key
   * and in the end we set the flag back to false again and clear the stored remapping. In case
   * the user presses one or more keys that brake the potential timeout we set the flag to true
   * manually, handle the keys from the remapping and then set the flag back to false, clear the
   * stored remapping and handle the keys pressed by the user seperatly.
   * We do this because any VimError or ForceStopRemappingError are thrown only when performing a
   * remapping.
   */
  public wasPerformingRemapThatFinishedWaitingForTimeout: IKeyRemapping | false = false;

  /**
   * Holds the current map depth count (number of nested remaps without using a character). In recursive remaps
   * every time we map a key when already performing a remapping this number increases by one. When a remapping
   * handling uses a character this number resets to 0.
   *
   * When it reaches the maxMapDepth it throws the VimError E223.
   * (check vim documentation :help maxmapdepth)
   */
  public mapDepth: number = 0;

  /**
   * Used to reset the mapDepth on nested recursive remaps. Is set to false every time we get a remapping and is set to
   * true when a character is used. We consider a character as being used when we get an action.
   * (check vim documentation :help maxmapdepth).
   *
   * Example 1: if we remap `x -> y` and `y -> x` if we press any of those keys we will continuously find a new
   * remap and increase the mapDepth without ever using an action until we hit maxMapDepth and we get E223 stopping
   * it all.
   *
   * Example 2: if we map `a -> x`, `x -> y`, `y -> b` and `b -> w` and we set maxMapDepth to 4 we get 'E223 Recursive
   * Mapping', because we get to the fourth remap without ever executing an action, but if we change the 'y' map to
   * `y -> wb`, now the max mapDepth we hit is 3 and then we execute the action 'w' that resets the mapDepth and then
   * call another remap of `b -> w` that executes another 'w', meaning that after pressing 'a' the result would be 'ww'.
   * Another option would be to increase the maxMapDepth to 5 or more and then we could use the initial remaps that would
   * turn the pressing of 'a' into a single 'w'.
   *
   * Example 3 (possible use case): if we remap `<leader>cb -> 0i//<Space><Esc>j<leader>cb` that recursively calls itself,
   * every time the`0` key is sent we set remapUsedACharacter to true and reset mapDepth to 0 on all nested remaps so even
   * if it calls itself more than 1000 times (on a file with more than 1000 lines) the mapDepth will always be reset to 0,
   * which allows the remap to keep calling itself to comment all the lines until either we get to the last line and the 'j'
   * action fails stopping the entire remap chain or the user presses `<C-c>` or `<Esc>` to forcelly stop the recursive remaps.
   *
   * P.S. This behavior is weird, because we should reduce the mapDepth by one when the remapping finished handling
   * or if it failed. But this is the way Vim does it. This allows the user to create infinite looping remaps
   * that call themselves and only stop after an error or the user pressing a key (usually <C-c> but we also
   * allow <Esc> because the user might not allow the use of ctrl keys).
   *
   * P.S.2 This is a complicated explanation for a seemingly simple feature, but I wrote this because when I first read the
   * Vim documentation it wasn't very clear to me how this worked, I first thought that mapDepth was like a map count but that
   * is not the case because we can have thousands of nested remaps without ever hitting maxMapDepth like in Example 3, and I
   * only started to understand it better when I tried Example 2 in Vim and some variations of it.
   */
  public remapUsedACharacter: boolean = false;

  /**
   * This will force Stop a recursive remapping. Used by <C-c> or <Esc> key when there is a recursive remapping
   */
  public forceStopRecursiveRemapping: boolean = false;

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
   * The position of every cursor.
   */
  private _cursors: Range[] = [new Range(new Position(0, 0), new Position(0, 0))];

  public get cursors(): Range[] {
    return this._cursors;
  }
  public set cursors(value: Range[]) {
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

  private _inputMethodSwitcher?: IInputMethodSwitcher;
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
    await this._inputMethodSwitcher?.switchInputMethod(this._currentMode, mode);
    if (this.returnToInsertAfterCommand && mode === Mode.Insert) {
      this.returnToInsertAfterCommand = false;
    }
    this._currentMode = mode;

    if (configuration.smartRelativeLine) {
      const activeTextEditor = vscode.window.activeTextEditor;

      if (activeTextEditor) {
        if (mode === Mode.Insert) {
          activeTextEditor.options.lineNumbers = vscode.TextEditorLineNumbersStyle.On;
        } else {
          activeTextEditor.options.lineNumbers = vscode.TextEditorLineNumbersStyle.Relative;
        }
      }
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
