import * as vscode from 'vscode';

/**
 * We consider two editors to be the same if their EditorIdentities are the same
 */
export class EditorIdentity {
  private _fileName: string;

  public static fromEditor(textEditor: vscode.TextEditor | undefined) {
    return new EditorIdentity(textEditor?.document?.fileName ?? '');
  }

  /**
   * For use in tests
   */
  public static createRandomEditorIdentity(): EditorIdentity {
    return new EditorIdentity(
      Math.random()
        .toString(36)
        .substring(7)
    );
  }

  private constructor(fileName: string) {
    this._fileName = fileName;
  }

  get fileName() {
    return this._fileName;
  }

  public isEqual(other: EditorIdentity): boolean {
    return this.fileName === other.fileName;
  }

  public toString() {
    return this.fileName;
  }
}
