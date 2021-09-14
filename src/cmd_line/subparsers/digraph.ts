import { DigraphsCommand } from '../commands/digraph';
import { Scanner } from '../scanner';

export function parseDigraphCommandArgs(args: string): DigraphsCommand {
  if (!args || !args.trim()) {
    return new DigraphsCommand({});
  }

  return new DigraphsCommand({
    arg: new Scanner(args).nextWord(),
  });
}
