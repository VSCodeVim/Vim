"use strict";

import * as node from "../commands/close";
import {Scanner} from '../scanner';
import {VimError, ErrorCode} from '../../error';

export function parseCloseCommandArgs(args : string) : node.CloseCommand {
  if (!args) {
    return new node.CloseCommand({});
  }
  var scannedArgs : node.ICloseCommandArguments = {};
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
  return new node.CloseCommand(scannedArgs);
}