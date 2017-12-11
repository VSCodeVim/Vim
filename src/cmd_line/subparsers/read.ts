import { IReadCommandArguments, ReadCommand } from '../commands/read';
import { Scanner } from '../scanner';

export function parseReadCommandArgs(args: string): ReadCommand {
  if (!args) {
    throw Error('Expected arguments.');
  }

  var scannedArgs: IReadCommandArguments = {};
  var scanner = new Scanner(args);

  scanner.skipWhiteSpace();
  let c = scanner.next();
  // read command has 2 forms - 'read <file-path>' and 'read! <shell-command>'
  if (c === '!') {
    scanner.ignore();
    scanner.skipWhiteSpace();
    scannedArgs.cmd = scanner.remaining();
    if (!scannedArgs.cmd || scannedArgs.cmd.length === 0) {
      throw Error('Expected shell command.');
    }
  } else {
    scannedArgs.file = scanner.remaining();
    if (!scannedArgs.file || scannedArgs.file.length === 0) {
      throw Error('Expected file path.');
    }
  }

  return new ReadCommand(scannedArgs);
}
