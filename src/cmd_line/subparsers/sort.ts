import { SortCommand } from '../commands/sort';
import { Scanner } from '../scanner';

export function parseSortCommandArgs(args: string): SortCommand {
  if (!args || !args.trim()) {
    return new SortCommand({ reverse: false, ignoreCase: false, unique: false });
  }

  const scanner = new Scanner(args);
  const reverse = scanner.next() === '!';
  if (!reverse) {
    scanner.backup();
  }

  const flags = scanner.nextWord();
  const ignoreCase = flags.includes('i');
  const unique = flags.includes('u');

  return new SortCommand({
    reverse,
    ignoreCase,
    unique,
  });
}
