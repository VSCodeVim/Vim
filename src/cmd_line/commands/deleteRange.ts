import * as vscode from 'vscode';

import { VimState } from '../../state/vimState';
import { Register, RegisterMode } from '../../register/register';
import * as node from '../node';
import { Position } from 'vscode';

export interface IDeleteRangeCommandArguments extends node.ICommandArgs {
  linesToRemove?: number;
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
    const linesToRemove = this.arguments.linesToRemove ?? 1;
    // :d[elete][cnt] removes [cnt] lines
    const startLine = vimState.cursorStartPosition.line;
    const endLine = startLine + (linesToRemove - 1);
    this.deleteRange(startLine, endLine, vimState);
  }

  override async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    /**
     * If a [cnt] and [range] is specified (e.g. :.+2d3), :delete [cnt] is called from
     * the end of the [range].
     * Ex. if two lines are VisualLine highlighted, :<,>d3 will :d3
     * from the end of the selected lines.
     */
    const [start, end] = range.resolve(vimState);
    if (this.arguments.linesToRemove) {
      vimState.cursorStartPosition = new Position(end, 0);
      await this.execute(vimState);
      return;
    }
    this.deleteRange(start, end, vimState);
  }
}
