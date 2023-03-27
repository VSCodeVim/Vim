import { Parser, optWhitespace, seqObj, string, alt } from 'parsimmon';
import { ErrorCode, VimError } from '../error';
import { integerParser } from '../vimscript/parserUtils';

interface Expression {
  parser: Parser<string>;
}

function range(start: number, stop: number, step: number): number[] {
  return Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
}

const RangeExpression: Expression = {
  parser: seqObj<{ start: number; end: number; step: number }>(
    string('range'),
    string('('),
    optWhitespace,
    ['start', integerParser],
    optWhitespace,
    string(','),
    optWhitespace,
    ['end', integerParser],
    optWhitespace,
    ['step', string(',').then(optWhitespace).then(integerParser).fallback(1)],
    optWhitespace,
    string(')')
  ).map(({ start, end, step }): string => {
    const numbers = range(start, end, step);
    if (numbers.length === 0) {
      throw VimError.fromCode(ErrorCode.StartPastEnd);
    } else {
      return numbers.join('\n');
    }
  }),
};

const EXPRESSION_REGISTER = string('=');

const altExpressions: Parser<string> = alt(RangeExpression.parser);

export const expressionParser = seqObj<{ register: string; fromExpression: string }>(
  optWhitespace,
  ['register', EXPRESSION_REGISTER],
  optWhitespace,
  ['fromExpression', altExpressions]
);
