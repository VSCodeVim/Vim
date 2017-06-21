"use strict";

import * as node from "../commands/file";
import {Scanner} from '../scanner';

export function parseEditFileCommandArgs(args: string): node.FileCommand {
  if (!args) {
    return new node.FileCommand({name: ""});
  }

  let scanner = new Scanner(args);
  let bang;
  const c = scanner.next();
  bang = (c === '!');
  if (scanner.isAtEof) {
    return new node.FileCommand({name: "", bang: bang});
  }

  let name = scanner.nextWord();

  return new node.FileCommand({
    name: name.trim(),
    position: node.FilePosition.CurrentWindow,
    bang: bang
  });
}

// Note that this isn't really implemented.
export function parseEditNewFileInNewWindowCommandArgs(args: string): node.FileCommand {
  return new node.FileCommand({
    name: undefined,
    position: node.FilePosition.NewWindow
  });
}

export function parseEditFileInNewWindowCommandArgs(args: string): node.FileCommand {
  let name = "";

  if (args) {
    let scanner = new Scanner(args);
    name = scanner.nextWord();
  }

  return new node.FileCommand({
    name: name,
    position: node.FilePosition.NewWindow
  });
}
