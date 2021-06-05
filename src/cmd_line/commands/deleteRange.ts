import * as vscode from 'vscode';

import { VimState } from '../../state/vimState';
import { Register, RegisterMode } from '../../register/register';
import * as node from '../node';
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

  public override neovimCapable(): boolean {
    return true;
  }

  /**
   * Deletes text between `startLine` and `endLine`, inclusive.
   * Puts the cursor at the start of the line where the deleted range was.
   */
  private deleteRange(startLine: number, endLine: number, vimState: VimState): void {
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

    vimState.recordedState.transformer.addTransformation({
      type: 'deleteRange',
      range: new vscode.Range(start, end),
      manuallySetCursorPositions: true,
    });
    vimState.cursorStopPosition = start.getLineBegin();

    if (this.arguments.register) {
      vimState.recordedState.registerName = this.arguments.register;
    }
    vimState.currentRegisterMode = RegisterMode.LineWise;
    Register.put(vimState, text, 0, true);
  }

  async execute(vimState: VimState): Promise<void> {
    const line = vimState.cursorStopPosition.line;
    this.deleteRange(line, line, vimState);
  }

  override async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    const [start, end] = range.resolve(vimState);
    this.deleteRange(start, end, vimState);
  }
}
