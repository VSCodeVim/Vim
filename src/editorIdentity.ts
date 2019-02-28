import * as vscode from 'vscode';

export class EditorIdentity {
  private _fileName: string;
  private _viewColumn: number;

  constructor(textEditor?: vscode.TextEditor) {
    this._fileName = (textEditor && textEditor.document && textEditor.document.fileName) || '';
    this._viewColumn = (textEditor && textEditor.viewColumn) || vscode.ViewColumn.One;
  }

  get fileName() {
    return this._fileName;
  }

  get viewColumn() {
    return this._viewColumn;
  }

  get identifier() {
    return this.fileName + this.viewColumn;
  }

  public isEqual(other: EditorIdentity): boolean {
    return this.identifier === other.identifier;
  }

  public toString() {
    return this.identifier;
  }
}
