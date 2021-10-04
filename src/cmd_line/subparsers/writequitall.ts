import { ErrorCode, VimError } from '../../error';
import { IWriteQuitAllCommandArguments, WriteQuitAllCommand } from '../commands/writequitall';
import { Scanner } from '../scanner';

export function parseWriteQuitAllCommandArgs(args: string): WriteQuitAllCommand {
  if (!args) {
    return new WriteQuitAllCommand({});
  }
  const scannedArgs: IWriteQuitAllCommandArguments = {};
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
  return new WriteQuitAllCommand(scannedArgs);
}
