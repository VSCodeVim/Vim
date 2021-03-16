import * as node from '../commands/deleteRange';
import { Scanner } from '../scanner';

export function parseDeleteRangeLinesCommandArgs(args: string): node.DeleteRangeCommand {
  if (!args || !args.trim()) {
    return new node.DeleteRangeCommand({});
  }

  return new node.DeleteRangeCommand({
    register: new Scanner(args).nextWord(),
  });
}
