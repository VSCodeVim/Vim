import { VimState } from '../../state/vimState';
import {
  CommandShowSearchHistory,
  CommandShowCommandHistory,
} from '../../actions/commands/actions';
import { ExCommand } from '../../vimscript/exCommand';
import { SearchDirection } from '../../vimscript/pattern';
import { alt, optWhitespace, Parser, string } from 'parsimmon';
import { nameAbbrevParser } from '../../vimscript/parserUtils';

export enum HistoryCommandType {
  Cmd,
  Search,
  Expr,
  Input,
  Debug,
  All,
}

const historyTypeParser: Parser<HistoryCommandType> = alt(
  alt(nameAbbrevParser('c', 'md'), string(':')).result(HistoryCommandType.Cmd),
  alt(nameAbbrevParser('s', 'earch'), string('/')).result(HistoryCommandType.Search),
  alt(nameAbbrevParser('e', 'xpr'), string('=')).result(HistoryCommandType.Expr),
  alt(nameAbbrevParser('i', 'nput'), string('@')).result(HistoryCommandType.Input),
  alt(nameAbbrevParser('d', 'ebug'), string('>')).result(HistoryCommandType.Debug),
  nameAbbrevParser('a', 'll').result(HistoryCommandType.All),
);

export interface IHistoryCommandArguments {
  type: HistoryCommandType;
  // TODO: :history can also accept a range
}

// http://vimdoc.sourceforge.net/htmldoc/cmdline.html#:history
export class HistoryCommand extends ExCommand {
  public static readonly argParser: Parser<HistoryCommand> = optWhitespace
    .then(historyTypeParser.fallback(HistoryCommandType.Cmd))
    .map((type) => new HistoryCommand({ type }));

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
          vimState,
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
