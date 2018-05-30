import * as node from '../commands/file';
import { Scanner } from '../scanner';

export function parseEditFileCommandArgs(args: string): node.FileCommand {
  if (!args) {
    return new node.FileCommand({ name: '', createFileIfNotExists: true });
  }

  let scanner = new Scanner(args);
  let bang;
  const c = scanner.next();
  bang = c === '!';
  if (scanner.isAtEof) {
    return new node.FileCommand({ name: '', bang: bang, createFileIfNotExists: true });
  }

  let name = scanner.nextWord();

  return new node.FileCommand({
    name: name.trim(),
    bang: bang,
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
    let scanner = new Scanner(args);
    name = scanner.nextWord();
  }

  return new node.FileCommand({
    name: name,
    position: node.FilePosition.NewWindowVerticalSplit,
  });
}

export function parseEditFileInNewHorizontalWindowCommandArgs(args: string): node.FileCommand {
  let name = '';

  if (args) {
    let scanner = new Scanner(args);
    name = scanner.nextWord();
  }

  return new node.FileCommand({
    name: name,
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
