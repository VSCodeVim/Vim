import { PutExCommand, IPutCommandArguments } from '../commands/put';
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
  } else {
    scanner.backup();
  }
  scanner.skipWhiteSpace();

  if (!scanner.isAtEof) {
    scannedArgs.register = scanner.nextWord();
  }
  return new PutExCommand(scannedArgs);
}
