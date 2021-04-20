import { IWriteCommandArguments, WriteCommand } from '../commands/write';
import { Scanner } from '../scanner';

export function parseWriteCommandArgs(args: string): WriteCommand {
  if (!args) {
    return new WriteCommand({ bgWrite: true });
  }
  const scannedArgs: IWriteCommandArguments = { bgWrite: true };
  const scanner = new Scanner(args);
  while (true) {
    scanner.skipWhiteSpace();
    if (scanner.isAtEof) {
      break;
    }
    let c = scanner.next();
    switch (c) {
      case '!':
        if (scanner.start > 0) {
          // :write !cmd
          scanner.ignore();
          while (!scanner.isAtEof) {
            scanner.next();
          }
          // vim ignores silently if no command after :w !
          scannedArgs.cmd = scanner.emit().trim() || undefined;
          continue;
        }
        // :write!
        scannedArgs.bang = true;
        scanner.ignore();
        continue;
      case '+':
        // :write ++opt=value
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
        throw new Error('Not implemented.');
    }
  }
  // TODO: actually parse arguments.
  // ++bin ++nobin ++ff ++enc =VALUE
  return new WriteCommand(scannedArgs);
}
