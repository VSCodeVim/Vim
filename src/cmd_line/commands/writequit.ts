import { VimState } from '../../state/vimState';
import * as node from '../node';
import * as quit from './quit';
import * as write from './write';

//
// Implements :writequit
// http://vimdoc.sourceforge.net/htmldoc/editing.html#write-quit
//
export interface IWriteQuitCommandArguments extends node.ICommandArgs {
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
  range?: node.LineRange;
}

export class WriteQuitCommand extends node.CommandBase {
  protected _arguments: IWriteQuitCommandArguments;

  constructor(args: IWriteQuitCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IWriteQuitCommandArguments {
    return this._arguments;
  }

  // Writing command. Taken as a basis from the "write.ts" file.
  async execute(vimState: VimState): Promise<void> {
    let writeArgs: write.IWriteCommandArguments = {
      opt: this.arguments.opt,
      optValue: this.arguments.optValue,
      bang: this.arguments.bang,
      file: this.arguments.file,
      range: this.arguments.range,
    };

    let writeCmd = new write.WriteCommand(writeArgs);
    await writeCmd.execute(vimState);
    let quitArgs: quit.IQuitCommandArguments = {
      // wq! fails when no file name is provided
      bang: false,
      range: this.arguments.range,
    };

    let quitCmd = new quit.QuitCommand(quitArgs);
    await quitCmd.execute(vimState);
  }
}
