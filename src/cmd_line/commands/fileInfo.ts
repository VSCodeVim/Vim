import { all, optWhitespace, Parser, seq } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { reportFileInfo } from '../../util/statusBarTextUtils';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser } from '../../vimscript/parserUtils';

export class FileInfoCommand extends ExCommand {
  public static readonly argParser: Parser<FileInfoCommand> = seq(
    bangParser,
    optWhitespace.then(all),
  ).map(([bang, fileName]) => new FileInfoCommand({ bang, fileName }));

  private args: {
    bang: boolean;
    fileName?: string;
  };
  private constructor(args: { bang: boolean; fileName?: string }) {
    super();
    this.args = args;
  }

  async execute(vimState: VimState): Promise<void> {
    // TODO: Use `this.args`
    reportFileInfo(vimState.cursors[0].start, vimState);
  }
}
