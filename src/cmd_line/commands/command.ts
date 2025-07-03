// eslint-disable-next-line id-denylist
import { all, optWhitespace, Parser, regexp, seqMap, string, whitespace } from 'parsimmon';

import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';
import { bangParser } from '../../vimscript/parserUtils';
import { varNameParser } from '../../vimscript/expression/parser';
import { VimError } from '../../error';
import { globalState } from '../../state/globalState';

type CommandAttribute =
  | {
      type: 'nargs';
      value: '0' | '1' | '*' | '?' | '+';
    }
  | {
      type: 'complete';
      value: string;
    }
  | {
      type: 'range';
      value: '%' | number | undefined;
    }
  | {
      type: 'count';
      value: number | undefined;
    }
  | {
      type: 'addr';
      value: string;
    }
  | {
      type: 'bang';
    }
  | {
      type: 'bar';
    }
  | {
      type: 'register';
    }
  | {
      type: 'buffer';
    }
  | {
      type: 'keepscript';
    };

type CommandArgs = {
  attributes: CommandAttribute[];
  bang: boolean;
  name: string;
  replacement: string;
};

function isValidComplete(complete: string): boolean {
  if (complete.startsWith('custom,') || complete.startsWith('customlist,')) {
    return true;
  }
  // TODO: This list was taken from nvim, which differs from vim - what to do?
  return [
    'arglist',
    'augroup',
    'breakpoint',
    'buffer',
    'color',
    'command',
    'compiler',
    'diff_buffer',
    'dir',
    'dir_in_path',
    'environment',
    'event',
    'expression',
    'file',
    'file_in_path',
    'filetype',
    'function',
    'help',
    'highlight',
    'history',
    'keymap',
    'locale',
    'lua',
    'mapclear',
    'mapping',
    'menu',
    'messages',
    'option',
    'packadd',
    'runtime',
    'scriptnames',
    'shellcmd',
    'shellcmdline',
    'sign',
    'syntax',
    'syntime',
    'tag',
    'tag_listfiles',
    'user',
    'var',
  ].includes(complete);
}
function isValidAddressType(addrType: string): boolean {
  return [
    'lines',
    'arguments',
    'buffers',
    'loaded_buffers',
    'windows',
    'tabs',
    'quickfix',
    'other',
  ].includes(addrType);
}

const attributeParser: Parser<CommandAttribute> = string('-')
  .then(regexp(/\S*/))
  .map((attr) => {
    if (attr.length === 0) {
      throw VimError.NoAttributeSpecified();
    }
    const components = attr.split('=');
    if (components.length <= 2) {
      const type = components[0];
      const value = components.at(1);
      switch (type) {
        case 'nargs':
          if (value === '0' || value === '1' || value === '*' || value === '?' || value === '+') {
            return { type, value };
          }
          throw VimError.InvalidNumberOfArguments();
        case 'complete':
          if (value !== undefined) {
            if (!isValidComplete(value)) {
              throw VimError.InvalidAttributeValue('complete', value);
            }
            return { type, value };
          }
          throw VimError.ArgumentRequiredForAttribute('complete');
        case 'range':
          if (value === undefined) {
            return { type, value: undefined };
          } else if (value === '%') {
            return { type, value: '%' };
          } else if (/^\d+$/.test(value)) {
            return { type, value: parseInt(value, 10) };
          }
          throw VimError.InvalidDefaultValueForCount();
        case 'count':
          if (value === undefined) {
            return { type, value: undefined };
          } else if (/^\d+$/.test(value)) {
            return { type, value: parseInt(value, 10) };
          }
          throw VimError.InvalidDefaultValueForCount();
        case 'addr':
          if (value !== undefined) {
            if (!isValidAddressType(value)) {
              throw VimError.InvalidAttributeValue('address type', value);
            }
            return { type, value };
          }
          throw VimError.ArgumentRequiredForAttribute('addr');
        case 'bang':
        case 'bar':
        case 'register':
        case 'buffer':
        case 'keepscript':
          if (value === undefined) {
            return { type } as CommandAttribute;
          }
          break;
      }
    }
    throw VimError.InvalidAttribute(`-${attr}`);
  });

export class CommandCommand extends ExCommand {
  public static readonly argParser: Parser<CommandCommand> = seqMap(
    bangParser.skip(optWhitespace),
    attributeParser.sepBy(whitespace).skip(optWhitespace),
    varNameParser.skip(optWhitespace),
    all,
    (bang, attributes, name, replacement) => {
      return new CommandCommand({
        attributes,
        bang,
        name,
        replacement,
      });
    },
  );

  public readonly args: CommandArgs;
  constructor(args: CommandArgs) {
    super();
    this.args = args;
    if (!/^[A-Z]/.test(this.args.name)) {
      throw VimError.UserDefinedCommandsMustStartWithAnUppercaseLetter();
    }
    const counts = this.args.attributes.filter(
      (attr) => attr.type === 'count' || (attr.type === 'range' && typeof attr.value === 'number'),
    );
    if (counts.length > 1) {
      throw VimError.CountCannotBeSpecifiedTwice();
    }
  }

  override async execute(vimState: VimState): Promise<void> {
    if (!this.args.bang && globalState.userFunctions.get(this.args.name) !== undefined) {
      throw VimError.CommandAlreadyExists(); // TODO: extraValue
    }
    globalState.userFunctions.set(this.args.name, {
      replacement: this.args.replacement,
    });
  }
}

export class UserCommand extends ExCommand {
  override async execute(vimState: VimState): Promise<void> {
    // TODO
  }
}
