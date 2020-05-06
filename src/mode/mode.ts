import * as vscode from 'vscode';
import { VimState } from '../state/vimState';
import { globalState } from '../state/globalState';
import { SearchDirection } from '../state/searchState';
import { Position } from '../common/motion/position';

export enum Mode {
  Normal,
  Insert,
  Visual,
  VisualBlock,
  VisualLine,
  SearchInProgressMode,
  CommandlineInProgress,
  Replace,
  EasyMotionMode,
  EasyMotionInputMode,
  SurroundInputMode,
  Disabled,
}

export enum VSCodeVimCursorType {
  Block,
  Line,
  LineThin,
  Underline,
  TextDecoration,
  Native,
}

export enum VisualBlockInsertionType {
  /**
   * Triggered with I
   */
  Insert,

  /**
   * Triggered with A
   */
  Append,
}

/**
 * Is the given mode visual, visual line, or visual block?
 */
export function isVisualMode(mode: Mode) {
  return [Mode.Visual, Mode.VisualLine, Mode.VisualBlock].includes(mode);
}

/**
 * Is the given mode one where the cursor is on the status bar?
 * This means SearchInProgess and CommandlineInProgress modes.
 */
export function isStatusBarMode(mode: Mode): boolean {
  return [Mode.SearchInProgressMode, Mode.CommandlineInProgress].includes(mode);
}

export function statusBarText(vimState: VimState) {
  const cursorChar =
    vimState.recordedState.actionKeys[vimState.recordedState.actionKeys.length - 1] === '<C-r>'
      ? '"'
      : '|';
  switch (vimState.currentMode) {
    case Mode.Normal:
      return '-- NORMAL --';
    case Mode.Insert:
      return '-- INSERT --';
    case Mode.Visual:
      return '-- VISUAL --';
    case Mode.VisualBlock:
      return '-- VISUAL BLOCK --';
    case Mode.VisualLine:
      return '-- VISUAL LINE --';
    case Mode.Replace:
      return '-- REPLACE --';
    case Mode.EasyMotionMode:
      return '-- EASYMOTION --';
    case Mode.EasyMotionInputMode:
      return '-- EASYMOTION INPUT --';
    case Mode.SurroundInputMode:
      return '-- SURROUND INPUT --';
    case Mode.Disabled:
      return '-- VIM: DISABLED --';
    case Mode.SearchInProgressMode:
      if (globalState.searchState === undefined) {
        this._logger.warn(`globalState.searchState is undefined.`);
        return '';
      }
      const leadingChar =
        globalState.searchState.searchDirection === SearchDirection.Forward ? '/' : '?';

      let searchWithCursor = globalState.searchState!.searchString.split('');
      searchWithCursor.splice(vimState.statusBarCursorCharacterPos, 0, cursorChar);

      return `${leadingChar}${searchWithCursor.join('')}`;
    case Mode.CommandlineInProgress:
      let commandWithCursor = vimState.currentCommandlineText.split('');
      commandWithCursor.splice(vimState.statusBarCursorCharacterPos, 0, cursorChar);

      return `:${commandWithCursor.join('')}`;
    default:
      return '';
  }
}

export function statusBarCommandText(vimState: VimState) {
  switch (vimState.currentMode) {
    case Mode.SurroundInputMode:
      return vimState.surround && vimState.surround.replacement
        ? vimState.surround.replacement
        : '';
    case Mode.EasyMotionMode:
      return `Target key: ${vimState.easyMotion.accumulation}`;
    case Mode.EasyMotionInputMode:
      if (!vimState.easyMotion) {
        return '';
      }

      const searchCharCount = vimState.easyMotion.searchAction.searchCharCount;
      const message =
        searchCharCount > 0
          ? `Search for ${searchCharCount} character(s): `
          : 'Search for characters: ';
      return message + vimState.easyMotion.searchAction.getSearchString();
    case Mode.Visual:
      const cmd = vimState.recordedState.commandString;

      // Don't show the `v` that brings you into visual mode
      return cmd.length === 0 || cmd[0] === 'v' ? cmd.slice(1) : cmd;
    case Mode.Normal:
    case Mode.VisualBlock:
    case Mode.VisualLine:
    case Mode.Replace:
    case Mode.Disabled:
      return vimState.recordedState.commandString;
    default:
      return '';
  }
}

export function getCursorStyle(cursorType: VSCodeVimCursorType) {
  switch (cursorType) {
    case VSCodeVimCursorType.Block:
      return vscode.TextEditorCursorStyle.Block;
    case VSCodeVimCursorType.Line:
      return vscode.TextEditorCursorStyle.Line;
    case VSCodeVimCursorType.LineThin:
      return vscode.TextEditorCursorStyle.LineThin;
    case VSCodeVimCursorType.Underline:
      return vscode.TextEditorCursorStyle.Underline;
    case VSCodeVimCursorType.TextDecoration:
      return vscode.TextEditorCursorStyle.LineThin;
    case VSCodeVimCursorType.Native:
    default:
      return vscode.TextEditorCursorStyle.Block;
  }
}

export function getCursorType(mode: Mode): VSCodeVimCursorType {
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
      return VSCodeVimCursorType.Block;
    case Mode.SearchInProgressMode:
      return VSCodeVimCursorType.Block;
    case Mode.CommandlineInProgress:
      return VSCodeVimCursorType.Block;
    case Mode.Replace:
      return VSCodeVimCursorType.Underline;
    case Mode.EasyMotionMode:
      return VSCodeVimCursorType.Block;
    case Mode.EasyMotionInputMode:
      return VSCodeVimCursorType.Block;
    case Mode.SurroundInputMode:
      return VSCodeVimCursorType.Block;
    case Mode.Disabled:
    default:
      return VSCodeVimCursorType.Line;
  }
}

export function visualBlockGetTopLeftPosition(start: Position, stop: Position): Position {
  return new Position(Math.min(start.line, stop.line), Math.min(start.character, stop.character));
}

export function visualBlockGetBottomRightPosition(start: Position, stop: Position): Position {
  return new Position(Math.max(start.line, stop.line), Math.max(start.character, stop.character));
}
