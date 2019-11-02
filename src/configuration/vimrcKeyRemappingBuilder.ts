import { IKeyRemapping, IVimrcKeyRemapping } from './iconfiguration';

class VimrcKeyRemappingBuilderImpl {
  private static readonly KEY_REMAPPING_REG_EX = /(^.*map)\s([\S]+)\s+([\S]+)$/;
  private static readonly KEY_LIST_REG_EX = /(<[^>]+>|.)/g;
  private static readonly COMMAND_REG_EX = /(:\w+)/;

  /**
   * @returns A remapping if the given `line` parses to one, and `undefined` otherwise.
   */
  public build(line: string): IVimrcKeyRemapping | undefined {
    const matches = VimrcKeyRemappingBuilderImpl.KEY_REMAPPING_REG_EX.exec(line);
    if (!matches || matches.length < 4) {
      return undefined;
    }

    const type = matches[1];
    const before = matches[2];
    const after = matches[3];

    let mapping: IKeyRemapping;
    if (VimrcKeyRemappingBuilderImpl.isCommand(after)) {
      mapping = {
        before: VimrcKeyRemappingBuilderImpl.buildKeyList(before),
        commands: [after],
      };
    } else {
      mapping = {
        before: VimrcKeyRemappingBuilderImpl.buildKeyList(before),
        after: VimrcKeyRemappingBuilderImpl.buildKeyList(after),
      };
    }

    return {
      keyRemapping: mapping,
      keyRemappingType: type,
    };
  }

  /**
   * @returns `true` if this remaps a key sequence to a `:` command
   */
  private static isCommand(commandString: string): boolean {
    const matches = VimrcKeyRemappingBuilderImpl.COMMAND_REG_EX.exec(commandString);
    if (matches) {
      return true;
    }
    return false;
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
