import { MarksCommand } from '../commands/marks';

export function parseMarksCommandArgs(args: string): MarksCommand {
  return new MarksCommand();
}
