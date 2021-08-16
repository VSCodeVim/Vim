import * as node from '../commands/deleteRange';
import { Scanner } from '../scanner';

export function parseDeleteRangeLinesCommandArgs(args: string): node.DeleteRangeCommand {
  if (!args || !args.trim()) {
    return new node.DeleteRangeCommand({});
  }

  /**
   * :d[elete] [register] [cnt]
   * Note: the first argument is a [register], unless it's a number, in which case
   * it's the [cnt]
   */
  const scanner = new Scanner(args);
  const arg1 = scanner.nextWord(); // [cnt] or [register]
  const arg2 = scanner.nextWord(); // [cnt] or EOF

  let register;
  let linesToRemove;

  if (isNaN(+arg1)) {
    register = arg1;
    linesToRemove = isNaN(+arg2) ? 1 : +arg2;
  } else {
    linesToRemove = +arg1;
  }

  return new node.DeleteRangeCommand({
    register,
    linesToRemove,
  });
}
