import { BufferDeleteCommand, IBufferDeleteCommandArguments } from '../commands/bufferDelete';
import { Scanner } from '../scanner';

export function parseBufferDeleteCommandArgs(args: string): BufferDeleteCommand {
  if (!args) {
    return new BufferDeleteCommand({});
  }
  const scannedArgs: IBufferDeleteCommandArguments = {};
  const scanner = new Scanner(args);
  const c = scanner.next();
  if (c === '!') {
    scannedArgs.bang = true;
    scanner.ignore();
  }
  const tabPosition = scanner.remaining();
  scannedArgs.tabPosition = tabPosition.trim();
  return new BufferDeleteCommand(scannedArgs);
}
