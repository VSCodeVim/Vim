
import * as node from '../commands/sort';

export function parseSortCommandArgs(args: string): node.SortCommand {
  const reverse = args !== null && args.indexOf('!') >= 0;

  return new node.SortCommand({ reverse });
}
