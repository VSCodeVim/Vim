import * as vscode from 'vscode';
import { VimState } from '../state/vimState';
import { globalState } from '../state/globalState';
import { SearchDirection } from '../state/searchState';
import { Position } from 'vscode';
import { Logger } from '../util/logger';

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
  OperatorPendingMode, // Pseudo-Mode, used only when remapping. DON'T SET TO THIS MODE
  Disabled,
}

export enum VSCodeVimCursorType {
  Block,
  Line,
  LineThin,
  Underline,
  TextDecoration,
  Native,
  UnderlineThin,
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
        const logger = Logger.get('StatusBar');
        logger.warn(`globalState.searchState is undefined in SearchInProgressMode.`);
        return '';
      }
      const leadingChar =
        globalState.searchState.searchDirection === SearchDirection.Forward ? '/' : '?';

      let searchWithCursor = globalState.searchState.searchString.split('');
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

export function statusBarCommandText(vimState: VimState): string {
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
      return message + vimState.easyMotion.searchAction.searchString;
    case Mode.Visual: {
      // TODO: holy shit, this is SO much more complicated than it should be because
      // our representation of a visual selection is so weird and inconsistent
      let [start, end] = [vimState.cursorStartPosition, vimState.cursorStopPosition];
      let wentOverEOL = false;
      if (start.isAfter(end)) {
        start = start.getRightThroughLineBreaks();
        [start, end] = [end, start];
      } else if (end.isAfter(start) && end.character === 0) {
        end = end.getLeftThroughLineBreaks(true);
        wentOverEOL = true;
      }
      const lines = end.line - start.line + 1;
      if (lines > 1) {
        return `${lines} ${vimState.recordedState.pendingCommandString}`;
      } else {
        const chars = Math.max(end.character - start.character, 1) + (wentOverEOL ? 1 : 0);
        return `${chars} ${vimState.recordedState.pendingCommandString}`;
      }
    }
    case Mode.VisualLine:
      return `${
        Math.abs(vimState.cursorStopPosition.line - vimState.cursorStartPosition.line) + 1
      } ${vimState.recordedState.pendingCommandString}`;
    case Mode.VisualBlock: {
      const lines =
        Math.abs(vimState.cursorStopPosition.line - vimState.cursorStartPosition.line) + 1;
      const chars =
        Math.abs(vimState.cursorStopPosition.character - vimState.cursorStartPosition.character) +
        1;
      return `${lines}x${chars} ${vimState.recordedState.pendingCommandString}`;
    }
    case Mode.Insert:
    case Mode.Replace:
      return vimState.recordedState.pendingCommandString;
    case Mode.Normal:
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
    case VSCodeVimCursorType.UnderlineThin:
      return vscode.TextEditorCursorStyle.UnderlineThin;
    case VSCodeVimCursorType.TextDecoration:
      return vscode.TextEditorCursorStyle.LineThin;
    case VSCodeVimCursorType.Native:
    default:
      return vscode.TextEditorCursorStyle.Block;
  }
}

export function visualBlockGetTopLeftPosition(start: Position, stop: Position): Position {
  return new Position(Math.min(start.line, stop.line), Math.min(start.character, stop.character));
}

export function visualBlockGetBottomRightPosition(start: Position, stop: Position): Position {
  return new Position(Math.max(start.line, stop.line), Math.max(start.character, stop.character));
}
