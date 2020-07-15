import { JumpsCommand } from '../commands/jumps';

export function parseJumpsCommandArgs(args: string): JumpsCommand {
  return new JumpsCommand();
}
