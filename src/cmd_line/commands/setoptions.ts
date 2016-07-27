"use strict";

import * as node from "../node";
import { Configuration } from '../../configuration/configuration';

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
  Info
}

export interface IOptionArgs extends node.ICommandArgs {
  name?: string;
  operator?: SetOptionOperator;
  value?: string | number | boolean;
}

export class SetOptionsCommand extends node.CommandBase {
  protected _arguments: IOptionArgs;

  constructor(args : IOptionArgs) {
    super();
    this._name = 'setoptions';
    this._shortName = 'option';
    this._arguments = args;
  }

  get arguments() : IOptionArgs {
    return this._arguments;
  }

  async execute(): Promise<void> {
    switch (this._arguments.operator) {
      case SetOptionOperator.Set:
        Configuration.getInstance()[this._arguments.name!] = true;
        break;
      case SetOptionOperator.Reset:
        Configuration.getInstance()[this._arguments.name!] = false;
        break;
      case SetOptionOperator.Equal:
        Configuration.getInstance()[this._arguments.name!] = this._arguments.value!;
        break;
      default:
        break;
    }
  }
}