import { VimState } from '../../state/vimState';
import { PositionDiff } from '../../common/motion/position';
import { externalCommand } from '../../util/externalCommand';
import { LineRange } from '../../vimscript/lineRange';
import { ExCommand } from '../../vimscript/exCommand';
import { all, Parser } from 'parsimmon';

export interface IBangCommandArguments {
  command: string;
}

export class BangCommand extends ExCommand {
  public static readonly argParser: Parser<BangCommand> = all.map(
    (command) =>
      new BangCommand({
        command,
      }),
  );

  protected _arguments: IBangCommandArguments;
  constructor(args: IBangCommandArguments) {
    super();
    this._arguments = args;
  }

  public override neovimCapable(): boolean {
    return true;
  }

  private getReplaceDiff(text: string): PositionDiff {
    const lines = text.split('\n');
    const numNewlines = lines.length - 1;
    const check = lines[0].match(/^\s*/);
    const numWhitespace = check ? check[0].length : 0;

    return PositionDiff.exactCharacter({
      lineOffset: -numNewlines,
      character: numWhitespace,
    });
  }

  async execute(vimState: VimState): Promise<void> {
    await externalCommand.run(this._arguments.command);
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    const resolvedRange = range.resolveToRange(vimState);

    // pipe in stdin from lines in range
    const input = vimState.document.getText(resolvedRange);
    const output = await externalCommand.run(this._arguments.command, input);

    // place cursor at the start of the replaced text and first non-whitespace character
    const diff = this.getReplaceDiff(output);

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      text: output,
      range: resolvedRange,
      diff,
    });
  }
}
