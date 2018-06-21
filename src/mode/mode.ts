import * as vscode from 'vscode';
import { VimState } from '../state/vimState';

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

export abstract class Mode {
  public readonly name: ModeName;
  public readonly cursorType: VSCodeVimCursorType;
  public readonly isVisualMode: boolean;
  private readonly _statusBarText: string;
  private static readonly _cursorMap = new Map([
    [VSCodeVimCursorType.Block, vscode.TextEditorCursorStyle.Block],
    [VSCodeVimCursorType.Line, vscode.TextEditorCursorStyle.Line],
    [VSCodeVimCursorType.LineThin, vscode.TextEditorCursorStyle.LineThin],
    [VSCodeVimCursorType.Underline, vscode.TextEditorCursorStyle.Underline],
    [VSCodeVimCursorType.TextDecoration, vscode.TextEditorCursorStyle.LineThin],
    [VSCodeVimCursorType.Native, vscode.TextEditorCursorStyle.Block],
  ]);
  private _isActive: boolean;

  constructor(
    name: ModeName,
    statusBarText: string,
    cursorType: VSCodeVimCursorType,
    isVisualMode: boolean = false
  ) {
    this.name = name;
    this.cursorType = cursorType;
    this.isVisualMode = isVisualMode;
    this._statusBarText = statusBarText;
    this._isActive = false;
  }

  get friendlyName(): string {
    return ModeName[this.name];
  }

  get isActive(): boolean {
    return this._isActive;
  }

  set isActive(val: boolean) {
    this._isActive = val;
  }

  getStatusBarText(vimState: VimState): string {
    return this._statusBarText.toLocaleUpperCase();
  }

  getStatusBarCommandText(vimState: VimState): string {
    return vimState.recordedState.commandString;
  }

  public static translateCursor(cursorType: VSCodeVimCursorType) {
    return this._cursorMap.get(cursorType) as vscode.TextEditorCursorStyle;
  }
}
