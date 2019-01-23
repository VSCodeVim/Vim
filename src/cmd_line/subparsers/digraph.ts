import * as node from '../commands/digraph';
import { Scanner } from '../scanner';

export function parseDigraphCommandArgs(args: string): node.DigraphsCommand {
  if (!args) {
    return new node.DigraphsCommand({});
  }

  let scanner = new Scanner(args);
  let name = scanner.nextWord();

  return new node.DigraphsCommand({
    arg: name,
  });
}
