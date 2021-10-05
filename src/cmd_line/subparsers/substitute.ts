import { SubstituteCommand, SubstituteFlags } from '../commands/substitute';
import {
  alt,
  any,
  noneOf,
  oneOf,
  optWhitespace,
  Parser,
  regexp,
  seq,
  string,
  whitespace,
} from 'parsimmon';
import { Pattern, SearchDirection } from '../../vimscript/pattern';
import { numberParser } from '../../vimscript/parserUtils';

// TODO: `:help sub-replace-special`
// TODO: `:help sub-replace-expression`
const replaceStringParser = (delimiter: string): Parser<string> =>
  alt(
    string('\\').then(
      any.fallback(undefined).map((escaped) => {
        if (escaped === undefined || escaped === '\\') {
          return '\\';
        } else if (escaped === '/') {
          return '/';
        } else if (escaped === 'b') {
          return '\b';
        } else if (escaped === 'r') {
          return '\r';
        } else if (escaped === 'n') {
          return '\n';
        } else if (escaped === 't') {
          return '\t';
        } else if (/[&0-9]/.test(escaped)) {
          return `$${escaped}`;
        } else {
          return `\\${escaped}`;
        }
      })
    ),
    noneOf(delimiter)
  )
    .many()
    .map((chars) => chars.join(''));

const substituteFlagsParser: Parser<SubstituteFlags> = seq(
  string('&').fallback(undefined),
  oneOf('cegiInp#lr').many()
).map(([amp, flagChars]) => {
  const flags: SubstituteFlags = {};
  if (amp === '&') {
    flags.keepPreviousFlags = true;
  }
  for (const flag of flagChars) {
    switch (flag) {
      case 'c':
        flags.confirmEach = true;
        break;
      case 'e':
        flags.suppressError = true;
        break;
      case 'g':
        flags.replaceAll = true;
        break;
      case 'i':
        flags.ignoreCase = true;
        break;
      case 'I':
        flags.noIgnoreCase = true;
        break;
      case 'n':
        flags.printCount = true;
        break;
      case 'p':
        flags.printLastMatchedLine = true;
        break;
      case '#':
        flags.printLastMatchedLineWithNumber = true;
        break;
      case 'l':
        flags.printLastMatchedLineWithList = true;
        break;
      case 'r':
        flags.usePreviousPattern = true;
        break;
    }
  }
  return flags;
});

const countParser: Parser<number | undefined> = whitespace.then(numberParser).fallback(undefined);

export const substituteCommandArgs: Parser<SubstituteCommand> = optWhitespace.then(
  alt(
    // :s[ubstitute]/{pattern}/{string}/[flags] [count]
    regexp(/[^\w\s\\|"]{1}/).chain((delimiter) =>
      seq(
        Pattern.parser({ direction: SearchDirection.Forward, delimiter }),
        replaceStringParser(delimiter),
        string(delimiter).then(substituteFlagsParser).fallback({}),
        countParser
      ).map(
        ([pattern, replace, flags, count]) =>
          new SubstituteCommand({ pattern, replace, flags, count })
      )
    ),

    // :s[ubstitute] [flags] [count]
    seq(substituteFlagsParser, countParser).map(
      ([flags, count]) =>
        new SubstituteCommand({
          pattern: undefined,
          replace: '',
          flags,
          count,
        })
    )
  )
);
