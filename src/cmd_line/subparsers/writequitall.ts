import { ErrorCode, VimError } from '../../error';
import * as node from '../commands/writequitall';
import { Scanner } from '../scanner';

export function parseWriteQuitAllCommandArgs(args: string): node.WriteQuitAllCommand {
  if (!args) {
    return new node.WriteQuitAllCommand({});
  }
  const scannedArgs: node.IWriteQuitAllCommandArguments = {};
  const scanner = new Scanner(args);
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
