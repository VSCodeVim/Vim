import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { LineRange } from '../../vimscript/lineRange';
import * as quit from './quit';
import * as write from './write';

//
// Implements :writequit
// http://vimdoc.sourceforge.net/htmldoc/editing.html#write-quit
//
export interface IWriteQuitCommandArguments {
  // arguments
  // [++opt]
  opt?: string;
  optValue?: string;
  // wq! [++opt]
  bang?: boolean;
  // wq [++opt] {file}
  file?: string;
  // wq! [++opt] {file}
  // [range]wq[!] [++opt] [file]
  range?: LineRange;
}

export class WriteQuitCommand extends ExCommand {
  private readonly arguments: IWriteQuitCommandArguments;

  constructor(args: IWriteQuitCommandArguments) {
    super();
    this.arguments = args;
  }

  // Writing command. Taken as a basis from the "write.ts" file.
  async execute(vimState: VimState): Promise<void> {
    const writeArgs: write.IWriteCommandArguments = {
      opt: this.arguments.opt,
      optValue: this.arguments.optValue,
      bang: this.arguments.bang,
      file: this.arguments.file,
      range: this.arguments.range,
    };

    const writeCmd = new write.WriteCommand(writeArgs);
    await writeCmd.execute(vimState);
    const quitArgs: quit.IQuitCommandArguments = {
      // wq! fails when no file name is provided
      bang: false,
      range: this.arguments.range,
    };

    const quitCmd = new quit.QuitCommand(quitArgs);
    await quitCmd.execute(vimState);
  }
}
