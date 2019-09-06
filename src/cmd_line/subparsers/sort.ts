import * as node from '../commands/sort';
import { Scanner } from '../scanner';

export function parseSortCommandArgs(args: string): node.SortCommand {
  if (!args) {
    return new node.SortCommand({ reverse: false, ignoreCase: false });
  }

  let scannedArgs: node.ISortCommandArguments = { reverse: false, ignoreCase: false };
  let scanner = new Scanner(args);
  const c = scanner.next();
  scannedArgs.reverse = c === '!';

  scannedArgs.ignoreCase = scanner.nextWord() === 'i';

  return new node.SortCommand(scannedArgs);
}
