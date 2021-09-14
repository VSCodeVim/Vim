/* tslint:disable:no-bitwise */

import { Scanner } from '../scanner';
import * as error from '../../error';
import { SubstituteCommand, SubstituteFlags } from '../commands/substitute';

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
        if (currentChar === delimiter) {
          pattern += delimiter;
        } else {
          pattern += '\\' + currentChar;
        }
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
        if (currentChar === delimiter) {
          replace += delimiter;
        } else if (replaceEscapes.hasOwnProperty(currentChar)) {
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
          flags |= SubstituteFlags.KeepPreviousFlags;
        } else {
          // Raise Error
          return SubstituteFlags.None;
        }
        break;
      case 'c':
        flags |= SubstituteFlags.ConfirmEach;
        break;
      case 'e':
        flags |= SubstituteFlags.SuppressError;
        break;
      case 'g':
        flags |= SubstituteFlags.ReplaceAll;
        break;
      case 'i':
        flags |= SubstituteFlags.IgnoreCase;
        break;
      case 'I':
        flags |= SubstituteFlags.NoIgnoreCase;
        break;
      case 'n':
        flags |= SubstituteFlags.PrintCount;
        break;
      case 'p':
        flags |= SubstituteFlags.PrintLastMatchedLine;
        break;
      case '#':
        flags |= SubstituteFlags.PrintLastMatchedLineWithNumber;
        break;
      case 'l':
        flags |= SubstituteFlags.PrintLastMatchedLineWithList;
        break;
      case 'r':
        flags |= SubstituteFlags.UsePreviousPattern;
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
export function parseSubstituteCommandArgs(args: string): SubstituteCommand {
  try {
    let searchPattern: string | undefined;
    let replaceString: string;
    let flags: number;
    let count: number;

    if (!args || !args.trim()) {
      // special case for :s
      return new SubstituteCommand({
        pattern: undefined,
        replace: '', // ignored in this context
        flags: SubstituteFlags.None,
      });
    }
    let scanner: Scanner;

    const delimiter = args[0];

    if (isValidDelimiter(delimiter)) {
      if (args.length === 1) {
        // special case for :s/ or other delimiters
        return new SubstituteCommand({
          pattern: '',
          replace: '',
          flags: SubstituteFlags.None,
        });
      }

      let secondDelimiterFound: boolean;

      scanner = new Scanner(args.substr(1, args.length - 1));
      [searchPattern, secondDelimiterFound] = parsePattern(scanner, delimiter);

      if (!secondDelimiterFound) {
        // special case for :s/search
        return new SubstituteCommand({
          pattern: searchPattern,
          replace: '',
          flags: SubstituteFlags.None,
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

    return new SubstituteCommand({
      pattern: searchPattern,
      replace: replaceString,
      flags,
      count,
    });
  } catch (e) {
    throw error.VimError.fromCode(error.ErrorCode.PatternNotFound);
  }
}
