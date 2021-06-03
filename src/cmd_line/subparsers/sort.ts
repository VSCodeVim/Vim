import * as node from '../commands/sort';
import { Scanner } from '../scanner';

export function parseSortCommandArgs(args: string): node.SortCommand {
  if (!args || !args.trim()) {
    return new node.SortCommand({ reverse: false, ignoreCase: false, unique: false });
  }

  const scanner = new Scanner(args);
  const reverse = scanner.next() === '!';

  const flags = scanner.nextWord();
  const ignoreCase = flags.includes('i');
  const unique = flags.includes('u');

  return new node.SortCommand({
    reverse,
    ignoreCase,
    unique,
  });
}
