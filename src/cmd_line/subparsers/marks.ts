import { MarksCommand } from '../commands/marks';

export function parseMarksCommandArgs(args: string): MarksCommand {
  if (!args || !args.trim()) {
    return new MarksCommand();
  }
  return new MarksCommand(args.split(''));
}
