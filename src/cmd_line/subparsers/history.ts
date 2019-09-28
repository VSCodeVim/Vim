import { HistoryCommand, HistoryCommandType, IHistoryCommandArguments } from '../commands/history';
import { Scanner } from '../scanner';

export function parseHistoryCommandArgs(input?: string): HistoryCommand {
  const args: IHistoryCommandArguments = { type: HistoryCommandType.Cmd };

  if (input) {
    const scanner = new Scanner(input);
    scanner.skipWhiteSpace();
    const type = scanner.nextWord();

    if (type === '/' || (type.startsWith('s') && 'search'.startsWith(type))) {
      args.type = HistoryCommandType.Search;
    }
  }

  return new HistoryCommand(args);
}
