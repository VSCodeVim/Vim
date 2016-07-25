"use strict";

import * as node from "../commands/setoptions";
import {Scanner} from '../scanner';

export function parseOption(args: string) : node.IOptionArgs {
  let scanner = new Scanner(args);
  scanner.skipWhiteSpace();

  if (scanner.isAtEof) {
    return {};
  }

  let option = scanner.nextWord();

  if (option.startsWith("no")) {
    // :se[t] no{option}  Toggle option: Reset, switch it off.
    return {
      name: option.substring(2, option.length),
      operator: node.SetOptionOperator.Reset
    };
  }

  if (option.includes('=')) {
    // :se[t] {option}={value} Set string or number option to {value}.
    let equalSign = option.indexOf('=');
    return {
      name: option.substring(0, equalSign),
      value: option.substring(equalSign + 1, option.length),
      operator: node.SetOptionOperator.Equal
    };
  }

  if (option.includes(':')) {
    // :se[t] {option}:{value} Set string or number option to {value}.
    let equalSign = option.indexOf(':');
    return {
      name: option.substring(0, equalSign),
      value: option.substring(equalSign + 1, option.length),
      operator: node.SetOptionOperator.Equal
    };
  }

  // :se[t] {option}
  return {
    name: option,
    operator: node.SetOptionOperator.Set
  };
}

export function parseOptionsCommandArgs(args : string) : node.SetOptionsCommand {
  let option = parseOption(args);
  return new node.SetOptionsCommand(option);
}