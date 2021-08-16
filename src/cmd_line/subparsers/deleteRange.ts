import * as node from '../commands/deleteRange';
import { Scanner } from '../scanner';

export function parseDeleteRangeLinesCommandArgs(args: string): node.DeleteRangeCommand {
  if (!args || !args.trim()) {
    return new node.DeleteRangeCommand({});
  }

  /**
   * Note that to specify a register, a [cnt] for :d[elete][cnt]
   * must be specified.
   * Ex: :d4 i -> specifies register i
   *     :d  i -> does not specify a register
   */
  const scanner = new Scanner(args);
  return new node.DeleteRangeCommand({
    linesToRemove: +scanner.nextWord() ?? 1,
    register: scanner.isAtEof ? undefined : scanner.nextWord(),
  });
}
