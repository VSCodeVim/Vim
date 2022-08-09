import { Parser, optWhitespace, seqObj, string, alt } from 'parsimmon';
import { ErrorCode, VimError } from '../error';
import { integerParser } from '../vimscript/parserUtils';

interface Expression {
  parser: Parser<string>;
}

const RangeExpression: Expression = {
  parser: seqObj<{ start: number, end: number }>(
    string('range'),
    string('('),
    optWhitespace,
    ['start', integerParser],
    optWhitespace,
    string(','),
    optWhitespace,
    ['end', integerParser],
    optWhitespace,
    string(')')
  ).map(
    ({ start, end }): string => {
      if (start > end) {
        throw VimError.fromCode(ErrorCode.StartPastEnd);
      } else {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i).join('\n')
      }
    }
  )
};

const EXPRESSION_REGISTER = string('=');

const altExpressions: Parser<string> = alt(
  RangeExpression.parser,
)

export const expressionParser = seqObj<{ register: string, fromExpression: string }>(
  optWhitespace,
  ['register', EXPRESSION_REGISTER],
  optWhitespace,
  ['fromExpression', altExpressions]
)
