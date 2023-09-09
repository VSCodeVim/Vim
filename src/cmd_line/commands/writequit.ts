import { optWhitespace, Parser, regexp, seq } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser, fileNameParser, FileOpt, fileOptParser } from '../../vimscript/parserUtils';
import { QuitCommand } from './quit';
import { WriteCommand } from './write';

//
// Implements :writequit
// http://vimdoc.sourceforge.net/htmldoc/editing.html#write-quit
//
export interface IWriteQuitCommandArguments {
  bang: boolean;
  opt: FileOpt;
  file?: string;
}

export class WriteQuitCommand extends ExCommand {
  public static readonly argParser: Parser<WriteQuitCommand> = seq(
    bangParser.skip(optWhitespace),
    fileOptParser.skip(optWhitespace),
    fileNameParser.fallback(undefined),
  ).map(([bang, opt, file]) => new WriteQuitCommand(file ? { bang, opt, file } : { bang, opt }));

  public override isRepeatableWithDot = false;

  private readonly args: IWriteQuitCommandArguments;
  constructor(args: IWriteQuitCommandArguments) {
    super();
    this.args = args;
  }

  // Writing command. Taken as a basis from the "write.ts" file.
  async execute(vimState: VimState): Promise<void> {
    await new WriteCommand({ bgWrite: false, ...this.args }).execute(vimState);

    await new QuitCommand({
      // wq! fails when no file name is provided
      bang: false,
    }).execute(vimState);
  }
}
