import * as vscode from 'vscode';
import { VimState } from '../state/vimState';
import { globalState } from '../state/globalState';
import { SearchDirection } from '../state/searchState';
import { Position } from 'vscode';

export enum Mode {
  Normal,
  Insert,
  Visual,
  VisualBlock,
  VisualLine,
  Select,
  SelectBlock,
  SelectLine,
  SearchInProgressMode,
  CommandlineInProgress,
  Replace,
  EasyMotionMode,
  EasyMotionInputMode,
  SurroundInputMode,
  Disabled,
  // The following modes are Pseudo-Modes, used only when remapping or for 'showmode'
  // to give feedback to user.
  // DON'T SET TO THIS MODES!!!
  OperatorPendingMode,
  InsertNormal,
  ReplaceNormal,
  InsertVisual,
  InsertVisualBlock,
  InsertVisualLine,
  ReplaceVisual,
  ReplaceVisualBlock,
  ReplaceVisualLine,
  InsertSelect,
  InsertSelectBlock,
  InsertSelectLine,
  ReplaceSelect,
  ReplaceSelectBlock,
  ReplaceSelectLine,
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
 * Is the given mode visual, visual line, visual block, select, select line or select block?
 */
export function isVisualMode(mode: Mode) {
  return [
    Mode.Visual,
    Mode.VisualLine,
    Mode.VisualBlock,
    Mode.Select,
    Mode.SelectLine,
    Mode.SelectBlock,
  ].includes(mode);
}

/**
 * Is the given mode select, select line or select block?
 */
export function isSelectMode(mode: Mode) {
  return [Mode.Select, Mode.SelectLine, Mode.SelectBlock].includes(mode);
}

/**
 * Is the given mode one where the cursor is on the status bar?
 * This means SearchInProgess and CommandlineInProgress modes.
 */
export function isStatusBarMode(mode: Mode): boolean {
  return [Mode.SearchInProgressMode, Mode.CommandlineInProgress].includes(mode);
}

/**
 * Is the given mode a pseudo mode?
 */
export function isPseudoMode(mode: Mode) {
  return [
    Mode.OperatorPendingMode,
    Mode.InsertNormal,
    Mode.ReplaceNormal,
    Mode.InsertVisual,
    Mode.InsertVisualLine,
    Mode.InsertVisualBlock,
    Mode.ReplaceVisual,
    Mode.ReplaceVisualLine,
    Mode.ReplaceVisualBlock,
    Mode.InsertSelect,
    Mode.InsertSelectLine,
    Mode.InsertSelectBlock,
    Mode.ReplaceSelect,
    Mode.ReplaceSelectLine,
    Mode.ReplaceSelectBlock,
  ].includes(mode);
}

export function statusBarText(vimState: VimState) {
  const cursorChar =
    vimState.recordedState.actionKeys[vimState.recordedState.actionKeys.length - 1] === '<C-r>'
      ? '"'
      : '|';
  switch (vimState.currentModeIncludingPseudoModes) {
    case Mode.Normal:
      return '-- NORMAL --';
    case Mode.OperatorPendingMode:
      if (vimState.modeToReturnToAfterNormalCommand) {
        switch (vimState.modeToReturnToAfterNormalCommand) {
          case Mode.Insert:
            return '-- (insert) --';
          case Mode.Replace:
            return '-- (replace) --';
          default:
            return '';
        }
      }
      return '-- NORMAL --';
    case Mode.Insert:
      return '-- INSERT --';
    case Mode.InsertNormal:
      return '-- (insert) --';
    case Mode.Replace:
      return '-- REPLACE --';
    case Mode.ReplaceNormal:
      return '-- (replace) --';
    case Mode.Visual:
      return '-- VISUAL --';
    case Mode.VisualBlock:
      return '-- VISUAL BLOCK --';
    case Mode.VisualLine:
      return '-- VISUAL LINE --';
    case Mode.InsertVisual:
      return '-- (insert) VISUAL --';
    case Mode.InsertVisualBlock:
      return '-- (insert) VISUAL BLOCK --';
    case Mode.InsertVisualLine:
      return '-- (insert) VISUAL LINE --';
    case Mode.ReplaceVisual:
      return '-- (replace) VISUAL --';
    case Mode.ReplaceVisualBlock:
      return '-- (replace) VISUAL BLOCK --';
    case Mode.ReplaceVisualLine:
      return '-- (replace) VISUAL LINE --';
    case Mode.Select:
      return '-- SELECT --';
    case Mode.SelectBlock:
      return '-- SELECT BLOCK --';
    case Mode.SelectLine:
      return '-- SELECT LINE --';
    case Mode.InsertSelect:
      return '-- (insert) SELECT --';
    case Mode.InsertSelectBlock:
      return '-- (insert) SELECT BLOCK --';
    case Mode.InsertSelectLine:
      return '-- (insert) SELECT LINE --';
    case Mode.ReplaceSelect:
      return '-- (replace) SELECT --';
    case Mode.ReplaceSelectBlock:
      return '-- (replace) SELECT BLOCK --';
    case Mode.ReplaceSelectLine:
      return '-- (replace) SELECT LINE --';
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
