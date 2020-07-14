import * as vscode from 'vscode';
import * as token from '../token';
import { TextEditor } from '../../textEditor';

import * as node from '../node';
import { VimState } from '../../state/vimState';
import { Position } from '../../common/motion/position';
import { externalCommand } from '../../util/externalCommand';

export interface IBangCommandArguments extends node.ICommandArgs {
  command: string;
}

export class BangCommand extends node.CommandBase {
  protected _arguments: IBangCommandArguments;

  constructor(args: IBangCommandArguments) {
    super();
    this._arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    await externalCommand.run(this._arguments.command);
  }

  async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    let vsStart: vscode.Position;
    let vsEnd: vscode.Position;

    if (range.left[0].type === token.TokenType.Percent) {
      vsStart = new vscode.Position(0, 0);
      vsEnd = new vscode.Position(TextEditor.getLineCount() - 1, 0);
    } else {
      vsStart = range.lineRefToPosition(vimState.editor, range.left, vimState);
      if (range.right.length === 0) {
        vsEnd = vsStart;
      } else {
        vsEnd = range.lineRefToPosition(vimState.editor, range.right, vimState);
      }
    }

    const start = Position.FromVSCodePosition(vsStart).getLineBegin();
    const end = Position.FromVSCodePosition(vsEnd).getLineEnd();
    const vsRange = new vscode.Range(start, end);

    // pipe in stdin from lines in range
    const input = TextEditor.getText(vsRange);
    const output = await externalCommand.run(this._arguments.command, input);
    vimState.recordedState.transformations.push({
      type: 'replaceText',
      text: output,
      start: start,
      end: end,
    });
  }
}
