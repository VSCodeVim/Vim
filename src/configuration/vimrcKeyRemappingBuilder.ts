import { IKeyRemapping, IVimrcKeyRemapping } from './iconfiguration';

class VimrcKeyRemappingBuilderImpl {
  private static readonly KEY_REMAPPING_REG_EX = /(^.*map)\s([\S]+)\s+([\S]+)$/;
  private static readonly KEY_LIST_REG_EX = /(<[^>]+>|.)/g;
  private static readonly COMMAND_REG_EX = /(:\w+)/;

  public build(line: string): IVimrcKeyRemapping | null {
    let matches = VimrcKeyRemappingBuilderImpl.KEY_REMAPPING_REG_EX.exec(line);
    if (!matches || matches.length < 4) {
      return null;
    }

    let type = matches[1];
    let before = matches[2];
    let after = matches[3];
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

  private static isCommand(commandString: string): boolean {
    let matches = VimrcKeyRemappingBuilderImpl.COMMAND_REG_EX.exec(commandString);
    if (matches) {
      return true;
    }
    return false;
  }

  private static buildKeyList(keyString: string): string[] {
    let keyList: string[] = [];
    let matches;

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
