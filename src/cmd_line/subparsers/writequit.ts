import { IWriteQuitCommandArguments, WriteQuitCommand } from '../commands/writequit';
import { Scanner } from '../scanner';

export function parseWriteQuitCommandArgs(args: string): WriteQuitCommand {
  if (!args) {
    return new WriteQuitCommand({});
  }
  const scannedArgs: IWriteQuitCommandArguments = {};
  const scanner = new Scanner(args);
  while (true) {
    scanner.skipWhiteSpace();
    if (scanner.isAtEof) {
      break;
    }
    let c = scanner.next();
    switch (c) {
      case '!':
        // :writequit!
        scannedArgs.bang = true;
        scanner.ignore();
        continue;
      case '+':
        // :writequit ++opt=value
        scanner.expect('+');
        scanner.ignore();
        scanner.expectOneOf(['bin', 'nobin', 'ff', 'enc']);
        scannedArgs.opt = scanner.emit();
        scanner.expect('=');
        scanner.ignore();
        while (!scanner.isAtEof) {
          c = scanner.next();
          if (c !== ' ' && c !== '\t') {
            continue;
          }
          scanner.backup();
          continue;
        }
        const value = scanner.emit();
        if (!value) {
          throw new Error('Expected value for option.');
        }
        scannedArgs.optValue = value;
        continue;
      default:
        throw new Error('Not implemented');
    }
  }
  // TODO: parse the stuff (it's really not).
  // ++bin ++nobin ++ff ++enc =VALUE
  return new WriteQuitCommand(scannedArgs);
}
