import { Configuration } from '../../configuration/configuration';
import * as util from '../../util';
import * as node from '../node';

export enum SetOptionOperator {
  /*
   * Set string or number option to {value}.
   * White space between {option} and '=' is allowed and will be ignored.  White space between '=' and {value} is not allowed.
   */
  Equal,
  /*
   * Toggle option: set, switch it on.
   * Number option: show value.
   * String option: show value.
   */
  Set,
  /*
   * Toggle option: Reset, switch it off.
   */
  Reset,
  /**
   * Toggle option: Insert value.
   */
  Invert,
  /*
   * Add the {value} to a number option, or append the {value} to a string option.
   * When the option is a comma separated list, a comma is added, unless the value was empty.
   */
  Append,
  /*
   * Subtract the {value} from a number option, or remove the {value} from a string option, if it is there.
   */
  Subtract,
  /**
   * Multiply the {value} to a number option, or prepend the {value} to a string option.
   */
  Multiply,
  /**
   * Show value of {option}.
   */
  Info,
}

export interface IOptionArgs extends node.ICommandArgs {
  name?: string;
  operator?: SetOptionOperator;
  value?: string | number | boolean;
}

export class SetOptionsCommand extends node.CommandBase {
  protected _arguments: IOptionArgs;

  constructor(args: IOptionArgs) {
    super();
    this._name = 'setoptions';
    this._arguments = args;
  }

  get arguments(): IOptionArgs {
    return this._arguments;
  }

  async execute(): Promise<void> {
    if (!this._arguments.name) {
      throw new Error('Unknown option');
    }

    switch (this._arguments.operator) {
      case SetOptionOperator.Set:
        Configuration[this._arguments.name] = true;
        break;
      case SetOptionOperator.Reset:
        Configuration[this._arguments.name] = false;
        break;
      case SetOptionOperator.Equal:
        Configuration[this._arguments.name] = this._arguments.value!;
        break;
      case SetOptionOperator.Invert:
        Configuration[this._arguments.name] = !Configuration[this._arguments.name];
        break;
      case SetOptionOperator.Append:
        Configuration[this._arguments.name] += this._arguments.value!;
        break;
      case SetOptionOperator.Subtract:
        if (typeof this._arguments.value! === 'number') {
          Configuration[this._arguments.name] -= this._arguments.value! as number;
        } else {
          let initialValue = Configuration[this._arguments.name];
          Configuration[this._arguments.name] = initialValue
            .split(this._arguments.value! as string)
            .join('');
        }
        break;
      case SetOptionOperator.Info:
        let value = Configuration[this._arguments.name];
        if (value === undefined) {
          await util.showError(`E518 Unknown option: ${this._arguments.name}`);
        } else {
          await util.showInfo(`${this._arguments.name}=${value}`);
        }
        break;
      default:
        break;
    }
  }
}
