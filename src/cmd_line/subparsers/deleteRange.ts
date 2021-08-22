import * as node from '../commands/deleteRange';
import { Scanner } from '../scanner';

export function parseDeleteRangeLinesCommandArgs(args: string): node.DeleteRangeCommand {
  if (!args || !args.trim()) {
    return new node.DeleteRangeCommand({});
  }

  /**
   * :d[elete] [register] [cnt]
   * :d[elete] [cnt] (if the first argument is a number)
   */
  const scanner = new Scanner(args);
  const arg1 = scanner.nextWord(); // [cnt] or [register]
  const arg2 = scanner.nextWord(); // [cnt] or EOF

  let register;
  let linesToRemove;

  if (isNaN(+arg1)) {
    register = arg1;
    linesToRemove = isNaN(+arg2) ? undefined : +arg2;
  } else {
    linesToRemove = +arg1;
  }

  return new node.DeleteRangeCommand({
    register,
    linesToRemove,
  });
}
