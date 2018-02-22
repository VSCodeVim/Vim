import { Nvim } from 'promised-neovim-client';
import * as vscode from 'vscode';

import { ModeName } from '../mode/mode';
import { BaseMovement } from './../actions/motion';
import { EasyMotion } from './../actions/plugins/easymotion/easymotion';
import { Position } from './../common/motion/position';
import { Range } from './../common/motion/range';
import { EditorIdentity } from './../editorIdentity';
import { HistoryTracker } from './../history/historyTracker';
import { RegisterMode } from './../register/register';
import { GlobalState } from './../state/globalState';
import { ReplaceState } from './../state/replaceState';
import { RecordedState } from './recordedState';
import { Neovim } from '../neovim/neovim';

/**
 * The VimState class holds permanent state that carries over from action
 * to action.
 *
 * Actions defined in actions.ts are only allowed to mutate a VimState in order to
 * indicate what they want to do.
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
  public static lastSemicolonRepeatableMovement: BaseMovement | undefined = undefined;

  /**
   * Tracks movements that can be repeated with , (e.g. t, T, f, and F).
   */
  public static lastCommaRepeatableMovement: BaseMovement | undefined = undefined;

  public lastMovementFailed: boolean = false;

  public alteredHistory = false;

  public isRunningDotCommand = false;

  public focusChanged = false;

  public surround:
    | undefined
    | {
        active: boolean;
        operator: 'change' | 'delete' | 'yank';
        target: string | undefined;
        replacement: string | undefined;
        range: Range | undefined;
        isVisualLine: boolean;
      } = undefined;

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
   * All the keys we've pressed so far.
   */
  public keyHistory: string[] = [];

  public globalState: GlobalState = new GlobalState();

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
  private _allCursors: Range[] = [new Range(new Position(0, 0), new Position(0, 0))];

  public get allCursors(): Range[] {
    return this._allCursors;
  }

  public set allCursors(value: Range[]) {
    for (const cursor of value) {
      if (!cursor.start.isValid() || !cursor.stop.isValid()) {
        console.log('invalid value for set cursor position. This is probably bad?');
      }
    }

    this._allCursors = value;

    this.isMultiCursor = this._allCursors.length > 1;
  }

  public cursorPositionJustBeforeAnythingHappened = [new Position(0, 0)];

  public isRecordingMacro: boolean = false;
  public isReplayingMacro: boolean = false;

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
   * The mode Vim will be in once this action finishes.
   */
  private _currentMode: ModeName = ModeName.Normal;

  public get currentMode(): number {
    return this._currentMode;
  }

  public set currentMode(value: number) {
    this._currentMode = value;
  }

  public currentRegisterMode = RegisterMode.AscertainFromCurrentMode;

  public get effectiveRegisterMode(): RegisterMode {
    if (this.currentRegisterMode !== RegisterMode.AscertainFromCurrentMode) {
      return this.currentRegisterMode;
    }
    switch (this.currentMode) {
      case ModeName.VisualLine:
        return RegisterMode.LineWise;
      case ModeName.VisualBlock:
        return RegisterMode.BlockWise;
      default:
        return RegisterMode.CharacterWise;
    }
  }

  public registerName = '"';

  public commandInitialText = '';

  public recordedState = new RecordedState();

  public recordedMacro = new RecordedState();

  /**
   * Programmatically triggering an edit will unfortunately ALSO trigger our mouse update
   * function. We use this variable to determine if the update function was triggered
   * by us or by a mouse action.
   */
  public prevSelection: vscode.Selection;

  public nvim: Neovim;

  public constructor(editor: vscode.TextEditor) {
    this.editor = editor;
    this.identity = new EditorIdentity(editor);
    this.historyTracker = new HistoryTracker(this);
    this.easyMotion = new EasyMotion();
  }

  dispose() {
    if (this.nvim) {
      this.nvim.dispose();
    }
  }
}

export class ViewChange {
  public command: string;
  public args: any;
}
