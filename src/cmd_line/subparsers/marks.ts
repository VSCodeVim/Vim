import { MarksCommand, DeleteMarksCommand } from '../commands/marks';

export function parseMarksCommandArgs(args: string): MarksCommand {
  if (!args || !args.trim()) {
    return new MarksCommand();
  }
  return new MarksCommand(args.split(''));
}

export function parseMarksRemoveCommandArgs(args: string): DeleteMarksCommand {
  if (!args) {
    return new DeleteMarksCommand();
  }
  return new DeleteMarksCommand(args.trimStart());
}
