import { IOptionArgs, SetOptionOperator, SetOptionsCommand } from '../commands/setoptions';
import { Scanner } from '../scanner';

export function parseOption(args?: string): IOptionArgs {
  const scanner = new Scanner(args ?? '');
  scanner.skipWhiteSpace();

  if (scanner.isAtEof) {
    return {};
  }

  const optionName = scanner.nextWord('?!&=:^+-'.split(''));

  if (optionName.startsWith('no')) {
    return {
      name: optionName.substring(2, optionName.length),
      operator: SetOptionOperator.Reset,
    };
  }

  if (optionName.startsWith('inv')) {
    return {
      name: optionName.substring(3, optionName.length),
      operator: SetOptionOperator.Invert,
    };
  }

  scanner.skipWhiteSpace();

  if (scanner.isAtEof) {
    return {
      name: optionName,
      operator: SetOptionOperator.Set,
    };
  }

  const operator = scanner.next();
  const optionArgs: IOptionArgs = {
    name: optionName,
    value: scanner.nextWord([]),
  };

  switch (operator) {
    case '=':
    case ':':
      optionArgs.operator = SetOptionOperator.Equal;
      break;
    case '!':
      optionArgs.operator = SetOptionOperator.Invert;
      break;
    case '^':
      optionArgs.operator = SetOptionOperator.Multiply;
      break;
    case '+':
      optionArgs.operator = SetOptionOperator.Append;
      break;
    case '-':
      optionArgs.operator = SetOptionOperator.Subtract;
      break;
    case '?':
      optionArgs.operator = SetOptionOperator.Info;
      break;
    case '&':
      optionArgs.operator = SetOptionOperator.Reset;
      break;
    default:
      throw new Error(`Unsupported operator (${operator}).`);
  }

  return optionArgs;
}

export function parseOptionsCommandArgs(args: string): SetOptionsCommand {
  return new SetOptionsCommand(parseOption(args));
}
