import * as vscode from 'vscode';
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
  // DON'T SET TO THESE MODES!!!
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

export enum NormalCommandState {
  Waiting,
  Executing,
  Finished,
}

export enum DotCommandStatus {
  Waiting,
  Executing,
  Finished,
}

export enum ReplayMode {
  Insert,
  Replace,
}

/**
 * Is the given mode visual, visual line, visual block, select, select line or select block?
 */
export function isVisualMode(
  mode: Mode,
): mode is
  | Mode.Visual
  | Mode.VisualLine
  | Mode.VisualBlock
  | Mode.Select
  | Mode.SelectLine
  | Mode.SelectBlock {
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
export function isSelectMode(mode: Mode): mode is Mode.Select | Mode.SelectLine | Mode.SelectBlock {
  return [Mode.Select, Mode.SelectLine, Mode.SelectBlock].includes(mode);
}

/**
 * Is the given mode one where the cursor is on the status bar?
 * This means SearchInProgess and CommandlineInProgress modes.
 */
export function isStatusBarMode(
  mode: Mode,
): mode is Mode.CommandlineInProgress | Mode.SearchInProgressMode {
  return [Mode.SearchInProgressMode, Mode.CommandlineInProgress].includes(mode);
}

/**
 * Is the given mode a pseudo mode? Pseudo-modes are never set as the real
 * `currentMode`; they are synthesized via `currentModeIncludingPseudoModes`
 * for use by the remapper and statusBar (e.g. `-- (insert) VISUAL --`).
 */
export function isPseudoMode(mode: Mode): boolean {
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
