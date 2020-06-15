import * as vscode from 'vscode';

import { Position, earlierOf } from '../../common/motion/position';
import { VimState } from '../../state/vimState';
import { Register, RegisterMode } from '../../register/register';
import { TextEditor } from '../../textEditor';
import * as node from '../node';

export interface IDeleteRangeCommandArguments extends node.ICommandArgs {
  register?: string;
}

export class DeleteRangeCommand extends node.CommandBase {
  protected _arguments: IDeleteRangeCommandArguments;

  constructor(args: IDeleteRangeCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IDeleteRangeCommandArguments {
    return this._arguments;
  }

  public neovimCapable(): boolean {
    return true;
  }

  async deleteRange(startLine: number, endLine: number, vimState: VimState): Promise<string> {
    let start = new Position(startLine, 0);
    let end = new Position(endLine, 0).getLineEndIncludingEOL();

    const isOnLastLine = end.line === TextEditor.getLineCount() - 1;

    if (end.character === TextEditor.getLineAt(end).text.length + 1) {
      end = end.getDownWithDesiredColumn(0);
    }

    if (isOnLastLine && start.line !== 0) {
      start = start.getPreviousLineBegin().getLineEnd();
    }

    let text = vimState.editor.document.getText(new vscode.Range(start, end));
    text = text.endsWith('\r\n') ? text.slice(0, -2) : text.slice(0, -1);
    await TextEditor.delete(new vscode.Range(start, end));

    let resultPosition = earlierOf(start, end);
    if (start.character > TextEditor.getLineAt(start).text.length) {
      resultPosition = start.getLeft();
    } else {
      resultPosition = start;
    }

    resultPosition = resultPosition.getLineBegin();
    vimState.editor.selection = new vscode.Selection(resultPosition, resultPosition);
    return text;
  }

  async execute(vimState: VimState): Promise<void> {
    if (!vimState.editor) {
      return;
    }

    let cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.active);
    let text = await this.deleteRange(cursorPosition.line, cursorPosition.line, vimState);
    Register.putByKey(text, this._arguments.register, RegisterMode.LineWise);
  }

  async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    const [start, end] = range.resolve(vimState);

    let text = await this.deleteRange(start, end, vimState);
    Register.putByKey(text, this._arguments.register, RegisterMode.LineWise);
  }
}
