import { ErrorCode, VimError } from '../../error';
import * as node from '../commands/wall';
import { Scanner } from '../scanner';

export function parseWallCommandArgs(args: string): node.WallCommand {
  if (!args) {
    return new node.WallCommand({});
  }
  var scannedArgs: node.IWallCommandArguments = {};
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
  return new node.WallCommand(scannedArgs);
}
