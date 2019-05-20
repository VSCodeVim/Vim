import { FileInfoCommand } from '../commands/fileInfo';

export function parseFileInfoCommandArgs(args: string): FileInfoCommand {
  // TODO: implement bang, file name parameters. http://vimdoc.sourceforge.net/htmldoc/editing.html#CTRL-G
  return new FileInfoCommand();
}
