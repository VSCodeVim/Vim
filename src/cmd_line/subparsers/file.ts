import { FileCommand, FilePosition } from '../commands/file';
import { Scanner } from '../scanner';

export function parseEditFileCommandArgs(args: string): FileCommand {
  if (!args || !args.trim()) {
    return new FileCommand({ name: '', createFileIfNotExists: true });
  }

  const scanner = new Scanner(args);
  const bang = scanner.next() === '!';
  if (scanner.isAtEof) {
    return new FileCommand({ name: '', bang, createFileIfNotExists: true });
  }

  const name = scanner.remaining();
  return new FileCommand({
    name: name.trim(),
    bang,
    createFileIfNotExists: true,
  });
}

export function parseEditNewFileCommandArgs(): FileCommand {
  return new FileCommand({
    name: undefined,
    createFileIfNotExists: true,
  });
}

export function parseEditFileInNewVerticalWindowCommandArgs(args: string): FileCommand {
  let name = '';

  if (args) {
    const scanner = new Scanner(args);
    name = scanner.nextWord();
  }

  return new FileCommand({
    name,
    position: FilePosition.NewWindowVerticalSplit,
  });
}

export function parseEditFileInNewHorizontalWindowCommandArgs(args: string): FileCommand {
  let name = '';

  if (args) {
    const scanner = new Scanner(args);
    name = scanner.nextWord();
  }

  return new FileCommand({
    name,
    position: FilePosition.NewWindowHorizontalSplit,
  });
}

export function parseEditNewFileInNewVerticalWindowCommandArgs(): FileCommand {
  return new FileCommand({
    name: undefined,
    createFileIfNotExists: true,
    position: FilePosition.NewWindowVerticalSplit,
  });
}

export function parseEditNewFileInNewHorizontalWindowCommandArgs(): FileCommand {
  return new FileCommand({
    name: undefined,
    createFileIfNotExists: true,
    position: FilePosition.NewWindowHorizontalSplit,
  });
}
