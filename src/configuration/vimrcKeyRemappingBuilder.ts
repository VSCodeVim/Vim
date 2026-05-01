import { IVimrcKeyRemapping } from './iconfiguration';

class VimrcKeyRemappingBuilderImpl {
  /**
   * Regex for mapping lines
   *
   * * `^(` -> start of mapping type capture
   *   * `map!?`\
   *   _matches:_
   *    * :map
   *    * :map!
   *
   *   * `|smap`\
   *   _matches:_
   *    * :smap
   *
   *   * `|[nvxoilc]m(?:a(?:p)?)?`\
   *   _matches:_
   *    * :nm[ap]
   *    * :vm[ap]
   *    * :xm[ap]
   *    * :om[ap]
   *    * :im[ap]
   *    * :lm[ap]
   *    * :cm[ap]
   *
   *   * `|(?:`
   *     * `[nvxl]no?r?|`\
   *     _matches:_
   *      * :nn[or]
   *      * :vn[or]
   *      * :xn[or]
   *      * :ln[or]
   *
   *     * `[oic]nor?|`\
   *     _matches:_
   *      * :ono[r]
   *      * :ino[r]
   *      * :cno[r]
   *
   *     * `snor`\
   *     _matches:_
   *      * :snor
   *   * `)(?:e(?:m(?:a(?:p)?)?)?)?`\
   *     _matches the remaining optional [emap]_
   *
   *   * `|no(?:r(?:e(?:m(?:a(?:p)?)?)?)?)?!?`\
   *   _matches:_
   *    * :no[remap]
   *    * :no[remap]!
   * * `)` -> end of mapping type capture
   *
   * * `(?!.*(?:<expr>|<script>))` -> don't allow mappings with <expr> or <script> arguments
   * * `(?:(?:<buffer>|<silent>|<nowait>|<special>)\s?)*` -> allow any of these arguments without capture
   * * `([\S]+)\s+` -> match the {lhs} (we call it 'before')
   * * `(?!.*<Plug>|.*<SID>)` -> don't allow mappings with <Plug> or <SID>
   * * `([\S ]+)$` -> match the {rhs} (we call it 'after') allowing spaces for commands like `:edit {file}<CR>`
   */
  private static readonly KEY_REMAPPING_REG_EX =
    /^(map!?|smap|[nvxoilc]m(?:a(?:p)?)?|(?:[nvxl]no?r?|[oic]nor?|snor)(?:e(?:m(?:a(?:p)?)?)?)?|no(?:r(?:e(?:m(?:a(?:p)?)?)?)?)?!?)\s+(?!.*(?:<expr>|<script>))(?:(?:<buffer>|<silent>|<nowait>|<special>)\s?)*([\S]+)\s+(?!.*<Plug>|.*<SID>)([\S ]+)$/i;

  /**
   * Regex for unmapping lines
   *
   * * `^(` -> start of mapping type capture
   *   * `unm(?:a(?:p)?)?!?`\
   *   _matches:_
   *    * :unm[ap]
   *    * :unm[ap]!
   *
   *   * `|[nvxoilc]u(?:n(?:m(?:a(?:p)?)?)?)?`\
   *   _matches:_
   *    * :nu[nmap]
   *    * :vu[nmap]
   *    * :xu[nmap]
   *    * :ou[nmap]
   *    * :iu[nmap]
   *    * :lu[nmap]
   *    * :cu[nmap]
   *
   *   * `|sunm(?:a(?:p)?)?`\
   *   _matches:_
   *    * :sunm[ap]
   * * `)` -> end of mapping type capture
   *
   * * `(?:(?:<buffer>|<silent>|<nowait>|<special>)\s?)*` -> allow any of these arguments without capture
   * * `([\S]+)$` -> match the {lhs} (we call it 'before')
   */
  private static readonly KEY_UNREMAPPING_REG_EX =
    /^(unm(?:a(?:p)?)?!?|[nvxoilc]u(?:n(?:m(?:a(?:p)?)?)?)?|sunm(?:a(?:p)?)?)\s+(?:(?:<buffer>|<silent>|<nowait>|<special>)\s?)*([\S]+)$/i;

  /**
   * Regex for clear mapping lines
   *
   * * `^(` -> start of mapping clear type capture
   *   * `mapc(?:l(?:e(?:a(?:r)?)?)?)?!?`\
   *   _matches:_
   *    * :mapc[lear]
   *    * :mapc[lear]!
   *
   *   * `[nvxsoilc]mapc(?:l(?:e(?:a(?:r)?)?)?)?`\
   *   _matches:_
   *    * :nmapc[lear]
   *    * :vmapc[lear]
   *    * :xmapc[lear]
   *    * :smapc[lear]
   *    * :omapc[lear]
   *    * :imapc[lear]
   *    * :lmapc[lear]
   *    * :cmapc[lear]
   * * `)` -> end of mapping clear type capture
   *
   * * `([\S]+)$` -> match the {lhs} (we call it 'before')
   */
  private static readonly KEY_CLEAR_REMAPPING_REG_EX =
    /^(mapc(?:l(?:e(?:a(?:r)?)?)?)?!?|[nvxsoilc]mapc(?:l(?:e(?:a(?:r)?)?)?)?)$/i;

  /**
   * Regex for each key of {lhs} and {rhs}
   *
   * `(`\
   * `<[^>]+>` -> match any special key of type <key>\
   * `|` -> or\
   * `.` -> any key\
   * `)`
   */
  private static readonly KEY_LIST_REG_EX = /(<[^<>]+>|.)/g;

  /**
   * Regex to match a Vim command like `:edit {file}<CR>`
   *
   * `^(:.+)` -> match ':' character plus 1 or more character for the command\
   * `<[Cc][Rr]>$` -> match <CR> at the end of the command
   */
  private static readonly VIM_COMMAND_REG_EX = /^(:.+)<[Cc][Rr]>$/;

  /**
   * @returns A remapping if the given `line` parses to one, and `undefined` otherwise.
   */
  public async build(
    line: string,
    vscodeCommands: string[],
  ): Promise<IVimrcKeyRemapping | undefined> {
    const matches = VimrcKeyRemappingBuilderImpl.KEY_REMAPPING_REG_EX.exec(line);
    if (!matches || matches.length < 4) {
      return undefined;
    }

    const type = matches[1];
    const before = matches[2];
    const after = matches[3];

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

  /**
   * @returns A remapping if the given `line` parses to one, and `undefined` otherwise.
   */
  public async buildUnmapping(line: string): Promise<IVimrcKeyRemapping | undefined> {
    const matches = VimrcKeyRemappingBuilderImpl.KEY_UNREMAPPING_REG_EX.exec(line);
    if (!matches || matches.length < 3) {
      return undefined;
    }

    const type = matches[1];
    const before = matches[2];

    return {
      keyRemapping: {
        before: VimrcKeyRemappingBuilderImpl.buildKeyList(before),
        source: 'vimrc',
      },
      keyRemappingType: type,
    };
  }

  /**
   * @returns An empty remapping with its type if the given `line` parses to one, and `undefined` otherwise.
   */
  public async buildClearMapping(line: string): Promise<IVimrcKeyRemapping | undefined> {
    const matches = VimrcKeyRemappingBuilderImpl.KEY_CLEAR_REMAPPING_REG_EX.exec(line);
    if (!matches || matches.length < 2) {
      return undefined;
    }

    const type = matches[1];

    return {
      keyRemapping: {
        before: ['<Nop>'],
        source: 'vimrc',
      },
      keyRemappingType: type,
    };
  }

  private static buildKeyList(keyString: string): string[] {
    const keyList: string[] = [];
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
