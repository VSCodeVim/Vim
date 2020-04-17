import { MarksCommand, MarksRemoveCommand } from '../commands/marks';

export function parseMarksCommandArgs(args: string): MarksCommand {
  if (!args) {
    return new MarksCommand();
  }
  return new MarksCommand(args.split(''));
}

export function parseMarksRemoveCommandArgs(args: string): MarksRemoveCommand {
  if (!args) {
    return new MarksRemoveCommand();
  }
  return new MarksRemoveCommand(args.trimStart());
}
