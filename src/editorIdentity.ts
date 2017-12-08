import * as vscode from 'vscode';

export default class EditorIdentity {
  private _fileName: string;
  private _viewColumn: vscode.ViewColumn;

  constructor(textEditor?: vscode.TextEditor) {
    this._fileName = (textEditor && textEditor.document.fileName) || '';
    this._viewColumn = (textEditor && textEditor.viewColumn) || vscode.ViewColumn.One;
  }

  get fileName() {
    return this._fileName;
  }

  get viewColumn() {
    return this._viewColumn;
  }

  public hasSameBuffer(identity: EditorIdentity): boolean {
    return this.fileName === identity.fileName;
  }

  public isEqual(identity: EditorIdentity): boolean {
    return this.fileName === identity.fileName && this.viewColumn === identity.viewColumn;
  }

  public toString() {
    return this.fileName + this.viewColumn;
  }
}
