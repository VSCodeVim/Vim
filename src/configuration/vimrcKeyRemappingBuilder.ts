import * as vscode from 'vscode';
import { IKeyRemapping, IVimrcKeyRemapping } from './iconfiguration';

class VimrcKeyRemappingBuilderImpl {
  private static readonly KEY_REMAPPING_REG_EX = /(^.*map)\s([\S]+)\s+(?!<Plug>)([\S]+)$/;
  private static readonly KEY_LIST_REG_EX = /(<[^>]+>|.)/g;
  private static readonly VIM_COMMAND_REG_EX = /^(:\w+)<[Cc][Rr]>$/;

  /**
   * @returns A remapping if the given `line` parses to one, and `undefined` otherwise.
   */
  public async build(line: string): Promise<IVimrcKeyRemapping | undefined> {
    if (line.trimLeft().startsWith('"')) {
      return;
    }

    const matches = VimrcKeyRemappingBuilderImpl.KEY_REMAPPING_REG_EX.exec(line);
    if (!matches || matches.length < 4) {
      return undefined;
    }

    const type = matches[1];
    const before = matches[2];
    const after = matches[3];

    const vscodeCommands = await vscode.commands.getCommands();
    const vimCommand = after.match(VimrcKeyRemappingBuilderImpl.VIM_COMMAND_REG_EX);

    let command: {
      after?: string[];
      commands?: string[];
    };
    if (vscodeCommands.includes(after)) {
      command = { commands: [after] };
    } else if (vimCommand) {
      command = { commands: [vimCommand[1]] };
    } else {
      command = { after: VimrcKeyRemappingBuilderImpl.buildKeyList(after) };
    }

    return {
      keyRemapping: {
        before: VimrcKeyRemappingBuilderImpl.buildKeyList(before),
        source: 'vimrc',
        ...command,
      },
      keyRemappingType: type,
    };
  }

  private static buildKeyList(keyString: string): string[] {
    let keyList: string[] = [];
    let matches: RegExpMatchArray | null = null;
    do {
      matches = VimrcKeyRemappingBuilderImpl.KEY_LIST_REG_EX.exec(keyString);
      if (matches) {
        keyList.push(matches[0]);
      }
    } while (matches);

    return keyList;
  }
}

export const vimrcKeyRemappingBuilder = new VimrcKeyRemappingBuilderImpl();
