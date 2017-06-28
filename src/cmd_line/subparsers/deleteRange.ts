import * as node from '../commands/deleteRange';
import { Scanner } from '../scanner';

export function parseDeleteRangeLinesCommandArgs(args: string): node.DeleteRangeCommand {
  if (!args) {
    return new node.DeleteRangeCommand({});
  }

  let scanner = new Scanner(args);
  let register = scanner.nextWord();

  return new node.DeleteRangeCommand({
    register: register,
  });
}
