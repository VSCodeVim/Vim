import * as vscode from 'vscode';
import { VimState } from '../state/vimState';
import { globalState } from '../state/globalState';
import { SearchDirection } from '../state/searchState';
import { Position } from '../common/motion/position';

export enum ModeName {
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

export function isVisualMode(mode: ModeName) {
  return [ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock].includes(mode);
}

export function statusBarText(vimState: VimState) {
  const cursorChar =
    vimState.recordedState.actionKeys[vimState.recordedState.actionKeys.length - 1] === '<C-r>'
      ? '"'
      : '|';
  switch (vimState.currentMode) {
    case ModeName.Normal:
      return '-- NORMAL --';
    case ModeName.Insert:
      return '-- INSERT --';
    case ModeName.Visual:
      return '-- VISUAL --';
    case ModeName.VisualBlock:
      return '-- VISUAL BLOCK --';
    case ModeName.VisualLine:
      return '-- VISUAL LINE --';
    case ModeName.Replace:
      return '-- REPLACE --';
    case ModeName.EasyMotionMode:
      return '-- EASYMOTION --';
    case ModeName.EasyMotionInputMode:
      return '-- EASYMOTION INPUT --';
    case ModeName.SurroundInputMode:
      return '-- SURROUND INPUT --';
    case ModeName.Disabled:
      return '-- VIM: DISABLED --';
    case ModeName.SearchInProgressMode:
      if (globalState.searchState === undefined) {
        this._logger.warn(`globalState.searchState is undefined.`);
        return '';
      }
      const leadingChar =
        globalState.searchState.searchDirection === SearchDirection.Forward ? '/' : '?';

      let searchWithCursor = globalState.searchState!.searchString.split('');
      searchWithCursor.splice(vimState.statusBarCursorCharacterPos, 0, cursorChar);

      return `${leadingChar}${searchWithCursor.join('')}`;
    case ModeName.CommandlineInProgress:
      let commandWithCursor = vimState.currentCommandlineText.split('');
      commandWithCursor.splice(vimState.statusBarCursorCharacterPos, 0, cursorChar);

      return `:${commandWithCursor.join('')}`;
    default:
      return '';
  }
}

export function statusBarCommandText(vimState: VimState) {
  switch (vimState.currentMode) {
    case ModeName.SurroundInputMode:
      return vimState.surround && vimState.surround.replacement
        ? vimState.surround.replacement
        : '';
    case ModeName.EasyMotionMode:
      return `Target key: ${vimState.easyMotion.accumulation}`;
    case ModeName.EasyMotionInputMode:
      if (!vimState.easyMotion) {
        return '';
      }

      const searchCharCount = vimState.easyMotion.searchAction.searchCharCount;
      const message =
        searchCharCount > 0
          ? `Search for ${searchCharCount} character(s): `
          : 'Search for characters: ';
      return message + vimState.easyMotion.searchAction.getSearchString();
    case ModeName.Visual:
      const cmd = vimState.recordedState.commandString;

      // Don't show the `v` that brings you into visual mode
      return cmd.length === 0 || cmd[0] === 'v' ? cmd.slice(1) : cmd;
    case ModeName.Normal:
    case ModeName.VisualBlock:
    case ModeName.VisualLine:
    case ModeName.Replace:
    case ModeName.Disabled:
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

export function getCursorType(mode: ModeName): VSCodeVimCursorType {
  switch (mode) {
    case ModeName.Normal:
      return VSCodeVimCursorType.Block;
    case ModeName.Insert:
      return VSCodeVimCursorType.Native;
    case ModeName.Visual:
      return VSCodeVimCursorType.TextDecoration;
    case ModeName.VisualBlock:
      return VSCodeVimCursorType.TextDecoration;
    case ModeName.VisualLine:
      return VSCodeVimCursorType.Block;
    case ModeName.SearchInProgressMode:
      return VSCodeVimCursorType.Block;
    case ModeName.CommandlineInProgress:
      return VSCodeVimCursorType.Block;
    case ModeName.Replace:
      return VSCodeVimCursorType.Underline;
    case ModeName.EasyMotionMode:
      return VSCodeVimCursorType.Block;
    case ModeName.EasyMotionInputMode:
      return VSCodeVimCursorType.Block;
    case ModeName.SurroundInputMode:
      return VSCodeVimCursorType.Block;
    case ModeName.Disabled:
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
