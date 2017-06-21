"use strict";

import * as node from "../commands/writequitall";
import { Scanner} from '../scanner';
import { VimError, ErrorCode } from '../../error';

export function parseWriteQuitAllCommandArgs(args : string) : node.WriteQuitAllCommand {
  if (!args) {
    return new node.WriteQuitAllCommand({});
  }
  var scannedArgs : node.IWriteQuitAllCommandArguments = {};
  var scanner = new Scanner(args);
  const c = scanner.next();
  if (c === '!') {
    scannedArgs.bang = true;
    scanner.ignore();
  } else if (c !== ' ') {
    throw VimError.fromCode(ErrorCode.E488);
  }
  scanner.skipWhiteSpace();
  if (!scanner.isAtEof) {
    throw VimError.fromCode(ErrorCode.E488);
  }
  return new node.WriteQuitAllCommand(scannedArgs);
}
