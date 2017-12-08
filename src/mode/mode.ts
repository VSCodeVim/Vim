import * as vscode from 'vscode';

export enum ModeName {
  Normal,
  Insert,
  Visual,
  VisualBlock,
  VisualLine,
  SearchInProgressMode,
  Replace,
  EasyMotionMode,
  EasyMotionInputMode,
  SurroundInputMode,
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
  private _isActive: boolean;
  private _name: ModeName;
  private static readonly _cursorMap = new Map([
    [VSCodeVimCursorType.Block, vscode.TextEditorCursorStyle.Block],
    [VSCodeVimCursorType.Line, vscode.TextEditorCursorStyle.Line],
    [VSCodeVimCursorType.LineThin, vscode.TextEditorCursorStyle.LineThin],
    [VSCodeVimCursorType.Underline, vscode.TextEditorCursorStyle.Underline],
    [VSCodeVimCursorType.TextDecoration, vscode.TextEditorCursorStyle.LineThin],
    [VSCodeVimCursorType.Native, vscode.TextEditorCursorStyle.Block],
  ]);

  public text: string;
  public cursorType: VSCodeVimCursorType;

  public isVisualMode = false;

  constructor(name: ModeName) {
    this._name = name;
    this._isActive = false;
  }

  get name(): ModeName {
    return this._name;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  set isActive(val: boolean) {
    this._isActive = val;
  }

  public static translateCursor(cursorType: VSCodeVimCursorType) {
    return this._cursorMap.get(cursorType) as vscode.TextEditorCursorStyle;
  }
}
