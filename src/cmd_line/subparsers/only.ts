import * as node from '../commands/only';

export function parseOnlyCommandArgs(args: string): node.OnlyCommand {
  return new node.OnlyCommand({});
}
