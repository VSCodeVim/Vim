import * as vscode from 'vscode';

import { VimState } from '../../state/vimState';
import { Register, RegisterMode } from '../../register/register';
import { TextEditor } from '../../textEditor';
import * as node from '../node';
import { configuration } from '../../configuration/configuration';
import { Position } from 'vscode';

export interface IDeleteRangeCommandArguments extends node.ICommandArgs {
  register?: string;
}

export class DeleteRangeCommand extends node.CommandBase {
  private readonly arguments: IDeleteRangeCommandArguments;

  constructor(args: IDeleteRangeCommandArguments) {
    super();
    this.arguments = args;
  }

  public neovimCapable(): boolean {
    return true;
  }

  /**
   * Deletes text between `startLine` and `endLine`, inclusive.
   * Puts the cursor at the start of the line where the deleted range was.
   *
   * @returns The deleted text, excluding leading/trailing newline
   */
  async deleteRange(startLine: number, endLine: number, vimState: VimState): Promise<string> {
    let start = new Position(startLine, 0);
    let end = new Position(endLine, 0).getLineEndIncludingEOL();

    if (endLine < vimState.document.lineCount - 1) {
      end = end.getRightThroughLineBreaks();
    } else if (startLine > 0) {
      start = start.getLeftThroughLineBreaks();
    }

    const range = new vscode.Range(start, end);
    const text = vimState.document
      .getText(range)
      // Remove leading or trailing newline
      .replace(/^\r?\n/, '')
      .replace(/\r?\n$/, '');
    await TextEditor.delete(vimState.editor, range);

    vimState.cursorStopPosition = start.getLineBegin();
    return text;
  }

  async execute(vimState: VimState): Promise<void> {
    if (!vimState.editor) {
      return;
    }

    const line = vimState.cursorStopPosition.line;
    const text = await this.deleteRange(line, line, vimState);
    const register = this.arguments.register ?? (configuration.useSystemClipboard ? '*' : '"');
    Register.putByKey(text, register, RegisterMode.LineWise);
  }

  async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    const [start, end] = range.resolve(vimState);

    const text = await this.deleteRange(start, end, vimState);
    const register = this.arguments.register ?? (configuration.useSystemClipboard ? '*' : '"');
    Register.putByKey(text, register, RegisterMode.LineWise);
  }
}
