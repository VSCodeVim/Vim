"use strict";

import * as node from "../commands/file";
import {Scanner} from '../scanner';

export function parseEditFileCommandArgs(args: string): node.FileCommand {
  if (!args) {
    return new node.FileCommand({});
  }

  let scanner = new Scanner(args);
  let name = scanner.nextWord();

  return new node.FileCommand({
    name: name,
    position: node.FilePosition.CurrentWindow
  });
}

export function parseEditNewFileInNewWindowCommandArgs(args: string): node.FileCommand {
  return new node.FileCommand({
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
