import { PutExCommand, IPutCommandArguments } from '../commands/put';
import { ErrorCode, VimError } from '../../error';
import { Scanner } from '../scanner';

export function parsePutExCommandArgs(args: string): PutExCommand {
  if (!args) {
    return new PutExCommand({});
  }

  const scannedArgs: IPutCommandArguments = {};
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
    scannedArgs.register = scanner.nextWord();
  }
  return new PutExCommand(scannedArgs);
}
