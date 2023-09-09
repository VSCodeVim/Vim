import { Parser, seq, whitespace } from 'parsimmon';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser, FileOpt, fileOptParser } from '../../vimscript/parserUtils';
import * as wall from '../commands/wall';
import * as quit from './quit';

//
// Implements :writequitall
// http://vimdoc.sourceforge.net/htmldoc/editing.html#:wqall
//
export interface IWriteQuitAllCommandArguments {
  bang: boolean;
  fileOpt: FileOpt;
}

export class WriteQuitAllCommand extends ExCommand {
  public static readonly argParser: Parser<WriteQuitAllCommand> = seq(
    bangParser,
    whitespace.then(fileOptParser).fallback([]),
  ).map(([bang, fileOpt]) => new WriteQuitAllCommand({ bang, fileOpt }));

  public override isRepeatableWithDot = false;

  private readonly arguments: IWriteQuitAllCommandArguments;
  constructor(args: IWriteQuitAllCommandArguments) {
    super();
    this.arguments = args;
  }

  // Writing command. Taken as a basis from the "write.ts" file.
  async execute(vimState: VimState): Promise<void> {
    const quitArgs: quit.IQuitCommandArguments = {
      // wq! fails when no file name is provided
      bang: false,
    };

    const wallCmd = new wall.WallCommand(this.arguments.bang);
    await wallCmd.execute(vimState);

    // TODO: fileOpt is not used

    quitArgs.quitAll = true;
    const quitCmd = new quit.QuitCommand(quitArgs);
    await quitCmd.execute(vimState);
  }
}
