import * as node from '../commands/file';
import { Scanner } from '../scanner';

export function parseEditFileCommandArgs(args: string): node.FileCommand {
  if (!args || !args.trim()) {
    return new node.FileCommand({ name: '', createFileIfNotExists: true });
  }

  const scanner = new Scanner(args);
  const bang = scanner.next() === '!';
  if (scanner.isAtEof) {
    return new node.FileCommand({ name: '', bang, createFileIfNotExists: true });
  }

  const name = scanner.remaining();
  return new node.FileCommand({
    name: name.trim(),
    bang,
    createFileIfNotExists: true,
  });
}

export function parseEditNewFileCommandArgs(): node.FileCommand {
  return new node.FileCommand({
    name: undefined,
    createFileIfNotExists: true,
  });
}

export function parseEditFileInNewVerticalWindowCommandArgs(args: string): node.FileCommand {
  let name = '';

  if (args) {
    const scanner = new Scanner(args);
    name = scanner.nextWord();
  }

  return new node.FileCommand({
    name,
    position: node.FilePosition.NewWindowVerticalSplit,
  });
}

export function parseEditFileInNewHorizontalWindowCommandArgs(args: string): node.FileCommand {
  let name = '';

  if (args) {
    const scanner = new Scanner(args);
    name = scanner.nextWord();
  }

  return new node.FileCommand({
    name,
    position: node.FilePosition.NewWindowHorizontalSplit,
  });
}

export function parseEditNewFileInNewVerticalWindowCommandArgs(): node.FileCommand {
  return new node.FileCommand({
    name: undefined,
    createFileIfNotExists: true,
    position: node.FilePosition.NewWindowVerticalSplit,
  });
}

export function parseEditNewFileInNewHorizontalWindowCommandArgs(): node.FileCommand {
  return new node.FileCommand({
    name: undefined,
    createFileIfNotExists: true,
    position: node.FilePosition.NewWindowHorizontalSplit,
  });
}
