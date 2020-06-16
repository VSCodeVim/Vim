import * as vscode from 'vscode';
import * as token from '../token';
import { TextEditor } from '../../textEditor';

import * as node from '../node';
import { VimState } from '../../state/vimState';
import { configuration } from '../../configuration/configuration';

import { PutCommand, IPutCommandOptions } from '../../actions/commands/actions';
import { Position } from '../../common/motion/position';

export interface IPutCommandArguments extends node.ICommandArgs {
  bang?: boolean;
  register?: string;
}

//
// Implements :put
// http://vimdoc.sourceforge.net/htmldoc/change.html#:put
//

export class PutExCommand extends node.CommandBase {
  protected _arguments: IPutCommandArguments;

  constructor(args: IPutCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IPutCommandArguments {
    return this._arguments;
  }

  async doPut(vimState: VimState, position: Position) {
    const registerName = this.arguments.register || (configuration.useSystemClipboard ? '*' : '"');
    vimState.recordedState.registerName = registerName;

    let options: IPutCommandOptions = {
      forceLinewise: true,
      forceCursorLastLine: true,
      after: this.arguments.bang,
    };

    await new PutCommand().exec(position, vimState, options);
  }

  async execute(vimState: VimState): Promise<void> {
    await this.doPut(vimState, vimState.cursorStopPosition);
  }

  async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    let start: vscode.Position;
    let end: vscode.Position;

    if (range.left[0].type === token.TokenType.Percent) {
      start = new vscode.Position(0, 0);
      end = new vscode.Position(TextEditor.getLineCount() - 1, 0);
    } else {
      start = range.lineRefToPosition(vimState.editor, range.left, vimState);
      if (range.right.length === 0) {
        end = start;
      } else {
        end = range.lineRefToPosition(vimState.editor, range.right, vimState);
      }
    }
    await this.doPut(vimState, Position.FromVSCodePosition(end));
  }
}
