/* tslint:disable:no-bitwise */

import * as node from '../commands/substitute';
import { Scanner } from '../scanner';
import * as error from '../../error';

function isValidDelimiter(char: string): boolean {
  return !!/^[^\w\s\\|"]{1}$/g.exec(char);
}

function parsePattern(scanner: Scanner, delimiter: string): [string, boolean] {
  let pattern = '';
  while (!scanner.isAtEof) {
    let currentChar = scanner.next();

    if (currentChar === delimiter) {
      return [pattern, true]; // found second delimiter
    } else if (currentChar === '\\') {
      if (!scanner.isAtEof) {
        currentChar = scanner.next();
        pattern += '\\' + currentChar;
      } else {
        pattern += '\\\\'; // :s/\ is treated like :s/\\
      }
    } else {
      pattern += currentChar;
    }
  }
  return [pattern, false];
}

// See Vim's sub-replace-special documentation
// TODO: \u, \U, \l, \L, \e, \E
const replaceEscapes = {
  b: '\b',
  r: '\r',
  n: '\n',
  t: '\t',
  '&': '$&',
  '0': '$0',
  '1': '$1',
  '2': '$2',
  '3': '$3',
  '4': '$4',
  '5': '$5',
  '6': '$6',
  '7': '$7',
  '8': '$8',
  '9': '$9',
};

function parseReplace(scanner: Scanner, delimiter: string): string {
  let replace = '';
  while (!scanner.isAtEof) {
    let currentChar = scanner.next();

    if (currentChar === delimiter) {
      return replace; // found second delimiter
    } else if (currentChar === '\\') {
      if (!scanner.isAtEof) {
        currentChar = scanner.next();
        if (replaceEscapes.hasOwnProperty(currentChar)) {
          replace += replaceEscapes[currentChar];
        } else {
          replace += currentChar;
        }
      } else {
        replace += '\\'; // :s/.../\ is treated like :s/.../\\
      }
    } else {
      replace += currentChar;
    }
  }
  return replace;
}

function parseSubstituteFlags(scanner: Scanner): number {
  let flags: number = 0;
  let index = 0;
  while (true) {
    if (scanner.isAtEof) {
      break;
    }

    const c = scanner.next();
    switch (c) {
      case '&':
        if (index === 0) {
          flags |= node.SubstituteFlags.KeepPreviousFlags;
        } else {
          // Raise Error
          return node.SubstituteFlags.None;
        }
        break;
      case 'c':
        flags |= node.SubstituteFlags.ConfirmEach;
        break;
      case 'e':
        flags |= node.SubstituteFlags.SuppressError;
        break;
      case 'g':
        flags |= node.SubstituteFlags.ReplaceAll;
        break;
      case 'i':
        flags |= node.SubstituteFlags.IgnoreCase;
        break;
      case 'I':
        flags |= node.SubstituteFlags.NoIgnoreCase;
        break;
      case 'n':
        flags |= node.SubstituteFlags.PrintCount;
        break;
      case 'p':
        flags |= node.SubstituteFlags.PrintLastMatchedLine;
        break;
      case '#':
        flags |= node.SubstituteFlags.PrintLastMatchedLineWithNumber;
        break;
      case 'l':
        flags |= node.SubstituteFlags.PrintLastMatchedLineWithList;
        break;
      case 'r':
        flags |= node.SubstituteFlags.UsePreviousPattern;
        break;
      default:
        scanner.backup();
        return flags;
    }

    index++;
  }

  return flags;
}

function parseCount(scanner: Scanner): number {
  let countStr = '';

  while (true) {
    if (scanner.isAtEof) {
      break;
    }
    countStr += scanner.next();
  }

  const count = Number.parseInt(countStr, 10);

  // TODO: If count is not valid number, raise error
  return Number.isInteger(count) ? count : -1;
}
/**
 * Substitute
 * :[range]s[ubstitute]/{pattern}/{string}/[flags] [count]
 * For each line in [range] replace a match of {pattern} with {string}.
 * {string} can be a literal string, or something special; see |sub-replace-special|.
 */
export function parseSubstituteCommandArgs(args: string): node.SubstituteCommand {
  try {
    let searchPattern: string | undefined;
    let replaceString: string;
    let flags: number;
    let count: number;

    if (!args || !args.trim()) {
      // special case for :s
      return new node.SubstituteCommand({
        pattern: undefined,
        replace: '', // ignored in this context
        flags: node.SubstituteFlags.None,
      });
    }
    let scanner: Scanner;

    const delimiter = args[0];

    if (isValidDelimiter(delimiter)) {
      if (args.length === 1) {
        // special case for :s/ or other delimiters
        return new node.SubstituteCommand({
          pattern: '',
          replace: '',
          flags: node.SubstituteFlags.None,
        });
      }

      let secondDelimiterFound: boolean;

      scanner = new Scanner(args.substr(1, args.length - 1));
      [searchPattern, secondDelimiterFound] = parsePattern(scanner, delimiter);

      if (!secondDelimiterFound) {
        // special case for :s/search
        return new node.SubstituteCommand({
          pattern: searchPattern,
          replace: '',
          flags: node.SubstituteFlags.None,
        });
      }
      replaceString = parseReplace(scanner, delimiter);
    } else {
      // if it's not a valid delimiter, it must be flags, so start parsing from here
      searchPattern = undefined;
      replaceString = '';
      scanner = new Scanner(args);
    }

    scanner.skipWhiteSpace();
    flags = parseSubstituteFlags(scanner);
    scanner.skipWhiteSpace();
    count = parseCount(scanner);

    return new node.SubstituteCommand({
      pattern: searchPattern,
      replace: replaceString,
      flags,
      count,
    });
  } catch (e) {
    throw error.VimError.fromCode(error.ErrorCode.PatternNotFound);
  }
}
