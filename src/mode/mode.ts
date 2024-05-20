import * as vscode from 'vscode';
import { Position } from 'vscode';

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
 * Is the given mode visual, visual line, or visual block?
 */
export function isVisualMode(mode: Mode): mode is Mode.Visual | Mode.VisualLine | Mode.VisualBlock {
  return [Mode.Visual, Mode.VisualLine, Mode.VisualBlock].includes(mode);
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
