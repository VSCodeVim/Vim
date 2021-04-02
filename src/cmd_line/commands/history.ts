import { CommandBase, ICommandArgs } from '../node';
import { VimState } from '../../state/vimState';
import {
  CommandShowSearchHistory,
  CommandShowCommandHistory,
} from '../../actions/commands/actions';
import { SearchDirection } from '../../state/searchState';

export enum HistoryCommandType {
  Cmd,
  Search,
  Expr,
  Input,
  Debug,
  All,
}

export interface IHistoryCommandArguments extends ICommandArgs {
  type: HistoryCommandType;
  // TODO: :history can accept multiple types
  // TODO: :history can also accept a range
}

// http://vimdoc.sourceforge.net/htmldoc/cmdline.html#:history
export class HistoryCommand extends CommandBase {
  private readonly arguments: IHistoryCommandArguments;

  constructor(args: IHistoryCommandArguments) {
    super();
    this.arguments = args;
  }

  async execute(vimState: VimState): Promise<void> {
    switch (this.arguments.type) {
      case HistoryCommandType.Cmd:
        await new CommandShowCommandHistory().exec(vimState.cursorStopPosition, vimState);
        break;
      case HistoryCommandType.Search:
        await new CommandShowSearchHistory(SearchDirection.Forward).exec(
          vimState.cursorStopPosition,
          vimState
        );
        break;
      // TODO: Implement these
      case HistoryCommandType.Expr:
        throw new Error('Not implemented');
      case HistoryCommandType.Input:
        throw new Error('Not implemented');
      case HistoryCommandType.Debug:
        throw new Error('Not implemented');
      case HistoryCommandType.All:
        throw new Error('Not implemented');
    }
  }
}
