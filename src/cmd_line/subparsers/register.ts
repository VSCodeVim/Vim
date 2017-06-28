('use strict');

import * as node from '../commands/register';
import { Scanner } from '../scanner';

export function parseRegisterCommandArgs(args: string): node.RegisterCommand {
  if (!args) {
    return new node.RegisterCommand({});
  }

  let scanner = new Scanner(args);
  let name = scanner.nextWord();

  return new node.RegisterCommand({
    arg: name,
  });
}
