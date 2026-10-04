import * as vscode from 'vscode';

export class CompositionState {
  isInComposition: boolean = false;
  insertedText: boolean = false;
  composingText: string = '';
  composingStart: vscode.Position | undefined = undefined;

  reset() {
    this.isInComposition = false;
    this.insertedText = false;
    this.composingText = '';
    this.composingStart = undefined;
  }
}
