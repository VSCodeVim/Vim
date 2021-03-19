import { ErrorCode, VimError } from '../../error';
import * as node from '../commands/quit';
import { Scanner } from '../scanner';

export function parseQuitCommandArgs(args: string): node.QuitCommand {
  if (!args) {
    return new node.QuitCommand({});
  }
  const scannedArgs: node.IQuitCommandArguments = {};
  const scanner = new Scanner(args);
  const c = scanner.next();
  if (c === '!') {
    scannedArgs.bang = true;
    scanner.ignore();
  } else if (c !== ' ') {
    throw VimError.fromCode(ErrorCode.TrailingCharacters);
  }
  scanner.skipWhiteSpace();
  if (!scanner.isAtEof) {
    throw VimError.fromCode(ErrorCode.TrailingCharacters);
  }
  return new node.QuitCommand(scannedArgs);
}

export function parseQuitAllCommandArgs(args: string): node.QuitCommand {
  const command = parseQuitCommandArgs(args);
  command.arguments.quitAll = true;
  return command;
}
