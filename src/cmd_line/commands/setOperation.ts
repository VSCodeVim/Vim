// eslint-disable-next-line id-denylist
import { alt, oneOf, Parser, regexp, seq, string, whitespace } from 'parsimmon';
import { IConfiguration } from '../../configuration/iconfiguration';
import { optionAliases } from '../../configuration/optionAliases';
import { VimError } from '../../error';

export type SetOperation =
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

export const setOperationParser: Parser<SetOperation> = whitespace
  .then(
    alt<SetOperation>(
      string('no')
        .then(optionParser)
        .map((option) => ({ type: 'unset', option })),
      string('inv')
        .then(optionParser)
        .map((option) => ({ type: 'invert', option })),
      optionParser.skip(string('!')).map((option) => ({ type: 'invert', option })),
      optionParser.skip(string('?')).map((option) => ({ type: 'show', option })),
      seq(optionParser.skip(string('&')), alt(string('vim'), string('vi'), string(''))).map(
        ([option, source]) => ({ type: 'default', option, source }),
      ),
      seq(optionParser.skip(oneOf('=:')), valueParser).map(([option, value]) => ({
        type: 'equal',
        option,
        value,
      })),
      seq(optionParser.skip(string('+=')), valueParser).map(([option, value]) => ({
        type: 'add',
        option,
        value,
      })),
      seq(optionParser.skip(string('^=')), valueParser).map(([option, value]) => ({
        type: 'multiply',
        option,
        value,
      })),
      seq(optionParser.skip(string('-=')), valueParser).map(([option, value]) => ({
        type: 'subtract',
        option,
        value,
      })),
      optionParser.map((option) => ({ type: 'show_or_set', option })),
    ),
  )
  .fallback({ type: 'show_or_set', option: undefined });

export const setCommandListeners: { [key: string]: Array<() => void> } = {};

/**
 * Apply a parsed `:set` operation directly to the given configuration
 * instance, without requiring a `VimState`. Used by both the interactive
 * `:set` command and the vimrc loader.
 *
 * `show` and `show_or_set` on a non-boolean option are read-only and thus
 * no-ops here; the interactive path handles those before delegating.
 */
export function applyOperationToConfig(config: IConfiguration, operation: SetOperation): void {
  if (operation.option === undefined) {
    return;
  }

  const option = optionAliases.get(operation.option) ?? operation.option;
  const currentValue = config[option] as string | number | boolean | undefined;
  if (currentValue === undefined) {
    throw VimError.UnknownOption(option);
  }
  const type =
    typeof currentValue === 'boolean'
      ? 'boolean'
      : typeof currentValue === 'string'
        ? 'string'
        : 'number';

  switch (operation.type) {
    case 'show_or_set': {
      if (operation.option === 'all') {
        // TODO: Show all options
      } else if (type === 'boolean') {
        config[option] = true;
      }
      // Non-boolean show_or_set is a read, handled by the interactive caller.
      break;
    }
    case 'show': {
      // Read-only; handled by the interactive caller.
      break;
    }
    case 'unset': {
      if (type === 'boolean') {
        config[option] = false;
      } else {
        throw VimError.InvalidArgument474(`no${option}`);
      }
      break;
    }
    case 'invert': {
      if (type === 'boolean') {
        config[option] = !currentValue;
      } else {
        // TODO: Could also be {option}!
        throw VimError.InvalidArgument474(`inv${option}`);
      }
      break;
    }
    case 'default': {
      if (operation.option === 'all') {
        // TODO: Set all options to default
      } else {
        // TODO: Set the option to default
      }
      break;
    }
    case 'equal': {
      if (type === 'boolean') {
        // TODO: Could also be {option}:{value}
        throw VimError.InvalidArgument474(`${option}=${operation.value}`);
      } else if (type === 'string') {
        config[option] = operation.value;
      } else {
        const value = Number.parseInt(operation.value, 10);
        if (isNaN(value)) {
          // TODO: Could also be {option}:{value}
          throw VimError.NumberRequiredAfterEqual(`${option}=${operation.value}`);
        }
        config[option] = value;
      }
      break;
    }
    case 'add': {
      if (type === 'boolean') {
        throw VimError.InvalidArgument474(`${option}+=${operation.value}`);
      } else if (type === 'string') {
        config[option] = currentValue + operation.value;
      } else {
        const value = Number.parseInt(operation.value, 10);
        if (isNaN(value)) {
          throw VimError.NumberRequiredAfterEqual(`${option}+=${operation.value}`);
        }
        config[option] = (currentValue as number) + value;
      }
      break;
    }
    case 'multiply': {
      if (type === 'boolean') {
        throw VimError.InvalidArgument474(`${option}^=${operation.value}`);
      } else if (type === 'string') {
        config[option] = operation.value + currentValue;
      } else {
        const value = Number.parseInt(operation.value, 10);
        if (isNaN(value)) {
          throw VimError.NumberRequiredAfterEqual(`${option}^=${operation.value}`);
        }
        config[option] = (currentValue as number) * value;
      }
      break;
    }
    case 'subtract': {
      if (type === 'boolean') {
        throw VimError.InvalidArgument474(`${option}-=${operation.value}`);
      } else if (type === 'string') {
        config[option] = (currentValue as string).split(operation.value).join('');
      } else {
        const value = Number.parseInt(operation.value, 10);
        if (isNaN(value)) {
          throw VimError.NumberRequiredAfterEqual(`${option}-=${operation.value}`);
        }
        config[option] = (currentValue as number) - value;
      }
      break;
    }
    default: {
      const guard: never = operation;
      throw new Error('Got unexpected SetOperation.type');
    }
  }

  const listeners = setCommandListeners[option];
  if (listeners) {
    for (const listener of listeners) {
      listener();
    }
  }
}
