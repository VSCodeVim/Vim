/* tslint:disable:no-bitwise */
"use strict";

import * as node from "../commands/substitute";
import {Scanner} from '../scanner';

function isValidDelimiter(char: string): boolean {
  return !! (/^[^\w\s\\|"]{1}$/g.exec(char));
}

function parsePattern(pattern: string, scanner: Scanner, delimiter: string): [string, boolean] {
  if (scanner.isAtEof) {
    return [pattern, false];
  } else {
    let currentChar = scanner.next();

    if (currentChar === delimiter) {
      // TODO skip delimiter
      return [pattern, true];
    } else if (currentChar === "\\") {
      if (!scanner.isAtEof) {
        currentChar = scanner.next();

        if (currentChar !== delimiter) {
          pattern += "\\";
        }

        pattern += currentChar;
      }

      return parsePattern(pattern, scanner, delimiter);
    } else {
      pattern += currentChar;
      return parsePattern(pattern, scanner, delimiter);
    }
  }
}

function parseSubstituteFlags(scanner: Scanner): number {
  let flags: number = 0;
  let index = 0;
  while (true) {
    if (scanner.isAtEof) {
      break;
    }

    let c = scanner.next();
    switch (c) {
      case "&":
        if (index === 0) {
          flags = flags | node.SubstituteFlags.KeepPreviousFlags;
        } else {
          // Raise Error
          return node.SubstituteFlags.None;
        }
        break;
      case "c":
        flags = flags | node.SubstituteFlags.ConfirmEach;
        break;
      case "e":
        flags = flags | node.SubstituteFlags.SuppressError;
        break;
      case "g":
        flags = flags | node.SubstituteFlags.ReplaceAll;
        break;
      case "i":
        flags = flags | node.SubstituteFlags.IgnoreCase;
        break;
      case "I":
        flags = flags | node.SubstituteFlags.NoIgnoreCase;
        break;
      case "n":
        flags = flags | node.SubstituteFlags.PrintCount;
        break;
      case "p":
        flags = flags | node.SubstituteFlags.PrintLastMatchedLine;
        break;
      case "#":
        flags = flags | node.SubstituteFlags.PrintLastMatchedLineWithNumber;
        break;
      case "l":
        flags = flags | node.SubstituteFlags.PrintLastMatchedLineWithList;
        break;
      case "r":
        flags = flags | node.SubstituteFlags.UsePreviousPattern;
        break;
      default:
        return node.SubstituteFlags.None;
    }

    index++;
  }

  return flags;
}

function parseCount(scanner: Scanner): number {
  let countStr = "";

  while (true) {
    if (scanner.isAtEof) {
      break;
    }
    countStr += scanner.next();
  }

  let count = Number.parseInt(countStr);

  // TODO: If count is not valid number, raise error
  return Number.isInteger(count) ? count : -1;
}
/**
 * Substitute
 * :[range]s[ubstitute]/{pattern}/{string}/[flags] [count]
 * For each line in [range] replace a match of {pattern} with {string}.
 * {string} can be a literal string, or something special; see |sub-replace-special|.
 */
export function parseSubstituteCommandArgs(args : string) : node.SubstituteCommand {
  let delimiter = args[0];

  if (isValidDelimiter(delimiter)) {
    let scanner = new Scanner(args.substr(1, args.length - 1));
    let [searchPattern, searchDelimiter] = parsePattern("", scanner, delimiter);

    if (searchDelimiter) {
      let replaceString = parsePattern("", scanner, delimiter)[0];
      scanner.skipWhiteSpace();
      let flags = parseSubstituteFlags(scanner);
      scanner.skipWhiteSpace();
      let count = parseCount(scanner);
      return new node.SubstituteCommand({
        pattern: searchPattern,
        replace: replaceString,
        flags: flags,
        count: count
      });

    } else {
      return new node.SubstituteCommand({
        pattern: searchPattern,
        replace: "",
        flags: node.SubstituteFlags.None,
        count: 0
      });
    }
  }

  // TODO(rebornix): Can this ever happen?
  return new node.SubstituteCommand({
    pattern: "",
    replace: "",
    flags: node.SubstituteFlags.None
  });
}
