import * as node from '../commands/bufferDelete';
import { Scanner } from '../scanner';

export function parseBufferDeleteCommandArgs(args: string): node.BufferDeleteCommand {
  if (!args) {
    return new node.BufferDeleteCommand({});
  }
  const scannedArgs: node.IBufferDeleteCommandArguments = {};
  const scanner = new Scanner(args);
  const c = scanner.next();
  if (c === '!') {
    scannedArgs.bang = true;
    scanner.ignore();
  }
  const tabPosition = scanner.remaining();
  scannedArgs.tabPosition = tabPosition.trim();
  return new node.BufferDeleteCommand(scannedArgs);
}
