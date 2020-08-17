import { BangCommand } from '../commands/bang';

export function parseBangCommand(args: string): BangCommand {
  return new BangCommand({
    command: args,
  });
}
