import { ErrorCode, VimError } from '../../error';
import { IWallCommandArguments, WallCommand } from '../commands/wall';
import { Scanner } from '../scanner';

export function parseWallCommandArgs(args: string): WallCommand {
  if (!args) {
    return new WallCommand({});
  }
  const scannedArgs: IWallCommandArguments = {};
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
  return new WallCommand(scannedArgs);
}
