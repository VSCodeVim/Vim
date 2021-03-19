import * as node from '../commands/sort';
import { Scanner } from '../scanner';

export function parseSortCommandArgs(args: string): node.SortCommand {
  if (!args || !args.trim()) {
    return new node.SortCommand({ reverse: false, ignoreCase: false, unique: false });
  }

  const scannedArgs: node.ISortCommandArguments = {
    reverse: false,
    ignoreCase: false,
    unique: false,
  };
  const scanner = new Scanner(args);
  const c = scanner.next();
  scannedArgs.reverse = c === '!';

  const nextWord = scanner.nextWord();
  // NOTE: vim supports `:sort ui` to do both insensitive and unique
  // at the same time. We felt this would be very uncommon usage so
  // chose to keep it simple and leave that functionality out.
  // See https://github.com/VSCodeVim/Vim/pull/4148
  scannedArgs.ignoreCase = nextWord === 'i';
  scannedArgs.unique = nextWord === 'u';

  return new node.SortCommand(scannedArgs);
}
