import * as vscode from 'vscode';

import { Position } from 'vscode';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { RegisterAction } from '../base';
import { BaseOperator } from '../operator';

@RegisterAction
class CommentOperator extends BaseOperator {
  public keys = ['g', 'c'];
  public modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    vimState.editor.selection = new vscode.Selection(start.getLineBegin(), end.getLineEnd());
    await vscode.commands.executeCommand('editor.action.commentLine');

    vimState.cursorStopPosition = new Position(start.line, 0);
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommentBlockOperator extends BaseOperator {
  public keys = ['g', 'C'];
  public modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    if (vimState.currentMode === Mode.Normal) {
      // If we're in normal mode, we need to construct a selection for the
      // command to operate on. If we're not, we've already got it.
      const endPosition = end.getRight();
      vimState.editor.selection = new vscode.Selection(start, endPosition);
    }
    await vscode.commands.executeCommand('editor.action.blockComment');

    vimState.cursorStopPosition = start;
    await vimState.setCurrentMode(Mode.Normal);
  }
}
