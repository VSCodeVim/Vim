import { JumpsCommand } from '../commands/jumps';
import { QuickPickItem } from 'vscode';

export function parseJumpsCommandArgs(args: string): JumpsCommand {
  return new JumpsCommand();
}
