import * as node from '../commands/digraph';
import { Scanner } from '../scanner';

export function parseDigraphCommandArgs(args: string): node.DigraphsCommand {
  if (!args || !args.trim()) {
    return new node.DigraphsCommand({});
  }

  return new node.DigraphsCommand({
    arg: new Scanner(args).nextWord(),
  });
}
