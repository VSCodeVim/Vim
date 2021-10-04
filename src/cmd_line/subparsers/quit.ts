import { ErrorCode, VimError } from '../../error';
import { IQuitCommandArguments, QuitCommand } from '../commands/quit';
import { Scanner } from '../scanner';

export function parseQuitCommandArgs(args: string): QuitCommand {
  if (!args) {
    return new QuitCommand({});
  }
  const scannedArgs: IQuitCommandArguments = {};
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
  return new QuitCommand(scannedArgs);
}

export function parseQuitAllCommandArgs(args: string): QuitCommand {
  const command = parseQuitCommandArgs(args);
  command.arguments.quitAll = true;
  return command;
}
