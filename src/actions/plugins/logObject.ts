import * as vscode from 'vscode';

import { configuration } from '../../configuration/configuration';
import { BaseOperator } from '../operator';
import { Mode } from '../../mode/mode';
import { Position } from 'vscode';
import { RegisterAction } from '../base';
import { TextEditor } from './../../textEditor';
import { VimState } from '../../state/vimState';
import { sorted } from './../../common/motion/position';

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAll(str: string, find: string, replace: string) {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
@RegisterAction
class LogObjectOperator extends BaseOperator {
  public keys = ['<leader>', 'l'];
  public modes = [Mode.Normal, Mode.Visual];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.logObject && super.doesActionApply(vimState, keysPressed);
  }

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.logObject && super.doesActionApply(vimState, keysPressed);
  }

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    [start, end] = sorted(start, end);
    const extendedEnd = new Position(end.line, end.character + 1);
    const range = new vscode.Range(start, extendedEnd);
    const text = vimState.document.getText(range);

    await vimState.setCurrentMode(Mode.Normal);
    await vscode.commands.executeCommand('editor.action.insertLineAfter');

    vimState.cursorStopPosition = TextEditor.getFirstNonWhitespaceCharOnLine(
      vimState.document,
      start.line + 1
    );

    const logMessage = replaceAll(configuration.logObjectTemplate, '{object}', text);

    if (vscode.window.activeTextEditor) {
      await vscode.window.activeTextEditor.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(start.line + 1, 0), logMessage);
      });
    }
  }
}
