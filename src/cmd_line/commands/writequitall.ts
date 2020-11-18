import { VimState } from '../../state/vimState';
import * as wall from '../commands/wall';
import * as node from '../node';
import * as quit from './quit';

//
// Implements :writequitall
// http://vimdoc.sourceforge.net/htmldoc/editing.html#:wqall
//
export interface IWriteQuitAllCommandArguments extends node.ICommandArgs {
  // arguments
  // [++opt]
  opt?: string;
  optValue?: string;
  // wqa! [++opt]
  bang?: boolean;
}

export class WriteQuitAllCommand extends node.CommandBase {
  protected _arguments: IWriteQuitAllCommandArguments;

  constructor(args: IWriteQuitAllCommandArguments) {
    super();
    this._arguments = args;
  }

  get arguments(): IWriteQuitAllCommandArguments {
    return this._arguments;
  }

  // Writing command. Taken as a basis from the "write.ts" file.
  async execute(vimState: VimState): Promise<void> {
    let writeArgs: wall.IWallCommandArguments = {
      bang: this.arguments.bang,
    };

    let quitArgs: quit.IQuitCommandArguments = {
      // wq! fails when no file name is provided
      bang: false,
    };

    const wallCmd = new wall.WallCommand(writeArgs);
    await wallCmd.execute(vimState);

    quitArgs.quitAll = true;
    const quitCmd = new quit.QuitCommand(quitArgs);
    await quitCmd.execute(vimState);
  }
}
