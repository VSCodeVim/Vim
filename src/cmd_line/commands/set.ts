// eslint-disable-next-line id-denylist
import { alt, oneOf, Parser, regexp, seq, string, whitespace } from 'parsimmon';
import { configuration, optionAliases } from '../../configuration/configuration';
import { ErrorCode, VimError } from '../../error';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { ExCommand } from '../../vimscript/exCommand';

type SetOperation =
  | {
      // :se[t]
      // :se[t] {option}
      type: 'show_or_set';
      option: string | undefined;
    }
  | {
      // :se[t] {option}?
      type: 'show';
      option: string;
    }
  | {
      // :se[t] no{option}
      type: 'unset';
      option: string;
    }
  | {
      // :se[t] {option}!
      // :se[t] inv{option}
      type: 'invert';
      option: string;
    }
  | {
      // :se[t] {option}&
      // :se[t] {option}&vi
      // :se[t] {option}&vim
      type: 'default';
      option: string;
      source: 'vi' | 'vim' | '';
    }
  | {
      // :se[t] {option}={value}
      // :se[t] {option}:{value}
      type: 'equal';
      option: string;
      value: string;
    }
  | {
      // :se[t] {option}+={value}
      type: 'add';
      option: string;
      value: string;
    }
  | {
      // :se[t] {option}^={value}
      type: 'multiply';
      option: string;
      value: string;
    }
  | {
      // :se[t] {option}-={value}
      type: 'subtract';
      option: string;
      value: string;
    };

const optionParser = regexp(/[a-z]+/);
const valueParser = regexp(/\S*/);
const setOperationParser: Parser<SetOperation> = whitespace
  .then(
    alt<SetOperation>(
      string('no')
        .then(optionParser)
        .map((option) => {
          return {
            type: 'unset',
            option,
          };
        }),
      string('inv')
        .then(optionParser)
        .map((option) => {
          return {
            type: 'invert',
            option,
          };
        }),
      optionParser.skip(string('!')).map((option) => {
        return {
          type: 'invert',
          option,
        };
      }),
      optionParser.skip(string('?')).map((option) => {
        return {
          type: 'show',
          option,
        };
      }),
      seq(optionParser.skip(string('&')), alt(string('vim'), string('vi'), string(''))).map(
        ([option, source]) => {
          return {
            type: 'default',
            option,
            source,
          };
        },
      ),
      seq(optionParser.skip(oneOf('=:')), valueParser).map(([option, value]) => {
        return {
          type: 'equal',
          option,
          value,
        };
      }),
      seq(optionParser.skip(string('+=')), valueParser).map(([option, value]) => {
        return {
          type: 'add',
          option,
          value,
        };
      }),
      seq(optionParser.skip(string('^=')), valueParser).map(([option, value]) => {
        return {
          type: 'multiply',
          option,
          value,
        };
      }),
      seq(optionParser.skip(string('-=')), valueParser).map(([option, value]) => {
        return {
          type: 'subtract',
          option,
          value,
        };
      }),
      optionParser.map((option) => {
        return {
          type: 'show_or_set',
          option,
        };
      }),
    ),
  )
  .fallback({ type: 'show_or_set', option: undefined });

export class SetCommand extends ExCommand {
  public static readonly argParser: Parser<SetCommand> = setOperationParser.map(
    (operation) => new SetCommand(operation),
  );

  private readonly operation: SetOperation;
  constructor(operation: SetOperation) {
    super();
    this.operation = operation;
  }

  // Listeners for options that need to be updated when they change
  private static listeners: { [key: string]: Array<() => void> } = {};
  static addListener(option: string, listener: () => void) {
    if (!(option in SetCommand.listeners)) SetCommand.listeners[option] = [];
    SetCommand.listeners[option].push(listener);
  }

  async execute(vimState: VimState): Promise<void> {
    if (this.operation.option === undefined) {
      // TODO: Show all options that differ from their default value
      return;
    }

    const option = optionAliases.get(this.operation.option) ?? this.operation.option;
    const currentValue = configuration[option] as string | number | boolean | undefined;
    if (currentValue === undefined) {
      throw VimError.fromCode(ErrorCode.UnknownOption, option);
    }
    const type =
      typeof currentValue === 'boolean'
        ? 'boolean'
        : typeof currentValue === 'string'
          ? 'string'
          : 'number';

    switch (this.operation.type) {
      case 'show_or_set': {
        if (this.operation.option === 'all') {
          // TODO: Show all options
        } else {
          if (type === 'boolean') {
            configuration[option] = true;
          } else {
            this.showOption(vimState, option, currentValue);
          }
        }
        break;
      }
      case 'show': {
        this.showOption(vimState, option, currentValue);
        break;
      }
      case 'unset': {
        if (type === 'boolean') {
          configuration[option] = false;
        } else {
          throw VimError.fromCode(ErrorCode.InvalidArgument474, `no${option}`);
        }
        break;
      }
      case 'invert': {
        if (type === 'boolean') {
          configuration[option] = !currentValue;
        } else {
          // TODO: Could also be {option}!
          throw VimError.fromCode(ErrorCode.InvalidArgument474, `inv${option}`);
        }
        break;
      }
      case 'default': {
        if (this.operation.option === 'all') {
          // TODO: Set all options to default
        } else {
          // TODO: Set the option to default
        }
        break;
      }
      case 'equal': {
        if (type === 'boolean') {
          // TODO: Could also be {option}:{value}
          throw VimError.fromCode(
            ErrorCode.InvalidArgument474,
            `${option}=${this.operation.value}`,
          );
        } else if (type === 'string') {
          configuration[option] = this.operation.value;
        } else {
          const value = Number.parseInt(this.operation.value, 10);
          if (isNaN(value)) {
            // TODO: Could also be {option}:{value}
            throw VimError.fromCode(
              ErrorCode.NumberRequiredAfterEqual,
              `${option}=${this.operation.value}`,
            );
          }
          configuration[option] = value;
        }
        break;
      }
      case 'add': {
        if (type === 'boolean') {
          throw VimError.fromCode(
            ErrorCode.InvalidArgument474,
            `${option}+=${this.operation.value}`,
          );
        } else if (type === 'string') {
          configuration[option] = currentValue + this.operation.value;
        } else {
          const value = Number.parseInt(this.operation.value, 10);
          if (isNaN(value)) {
            throw VimError.fromCode(
              ErrorCode.NumberRequiredAfterEqual,
              `${option}+=${this.operation.value}`,
            );
          }
          configuration[option] = (currentValue as number) + value;
        }
        break;
      }
      case 'multiply': {
        if (type === 'boolean') {
          throw VimError.fromCode(
            ErrorCode.InvalidArgument474,
            `${option}^=${this.operation.value}`,
          );
        } else if (type === 'string') {
          configuration[option] = this.operation.value + currentValue;
        } else {
          const value = Number.parseInt(this.operation.value, 10);
          if (isNaN(value)) {
            throw VimError.fromCode(
              ErrorCode.NumberRequiredAfterEqual,
              `${option}^=${this.operation.value}`,
            );
          }
          configuration[option] = (currentValue as number) * value;
        }
        break;
      }
      case 'subtract': {
        if (type === 'boolean') {
          throw VimError.fromCode(
            ErrorCode.InvalidArgument474,
            `${option}-=${this.operation.value}`,
          );
        } else if (type === 'string') {
          configuration[option] = (currentValue as string).split(this.operation.value).join('');
        } else {
          const value = Number.parseInt(this.operation.value, 10);
          if (isNaN(value)) {
            throw VimError.fromCode(
              ErrorCode.NumberRequiredAfterEqual,
              `${option}-=${this.operation.value}`,
            );
          }
          configuration[option] = (currentValue as number) - value;
        }
        break;
      }
      default:
        const guard: never = this.operation;
        throw new Error('Got unexpected SetOperation.type');
    }

    if (option in SetCommand.listeners) {
      for (const listener of SetCommand.listeners[option]) {
        listener();
      }
    }
  }

  private showOption(vimState: VimState, option: string, value: boolean | string | number) {
    if (typeof value === 'boolean') {
      StatusBar.setText(vimState, value ? option : `no${option}`);
    } else {
      StatusBar.setText(vimState, `${option}=${value}`);
    }
  }
}
