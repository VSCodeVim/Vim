import * as vscode from 'vscode';

import * as node from '../node';
import { VimState } from '../../state/vimState';
import { PositionDiff, PositionDiffType } from '../../common/motion/position';
import { externalCommand } from '../../util/externalCommand';
import { Range } from '../../common/motion/range';
import { Position } from 'vscode';

export interface IBangCommandArguments extends node.ICommandArgs {
  command: string;
}

export class BangCommand extends node.CommandBase {
  protected _arguments: IBangCommandArguments;

  constructor(args: IBangCommandArguments) {
    super();
    this._arguments = args;
  }

  public neovimCapable(): boolean {
    return true;
  }

  private getReplaceDiff(text: string): PositionDiff {
    const lines = text.split('\n');
    const numNewlines = lines.length - 1;
    const check = lines[0].match(/^\s*/);
    const numWhitespace = check ? check[0].length : 0;

    return new PositionDiff({
      line: -numNewlines,
      character: numWhitespace,
      type: PositionDiffType.ExactCharacter,
    });
  }

  async execute(vimState: VimState): Promise<void> {
    await externalCommand.run(this._arguments.command);
  }

  async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    const [startLine, endLine] = range.resolve(vimState);
    const start = new Position(startLine, 0);
    const end = new Position(endLine, 0).getLineEnd();

    // pipe in stdin from lines in range
    const input = vimState.document.getText(new vscode.Range(start, end));
    const output = await externalCommand.run(this._arguments.command, input);

    // place cursor at the start of the replaced text and first non-whitespace character
    const diff = this.getReplaceDiff(output);

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      text: output,
      range: new Range(start, end),
      diff,
    });
  }
}
