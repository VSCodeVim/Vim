import { alt, any, Parser, regexp, string, seq, noneOf } from "parsimmon";

const specialCharacters = regexp(/<(?:Esc|C-\w|A-\w|C-A-\w)>/)

// TODO: Move to a more general location
// TODO: Add more special characters
const escapedParser = string('\\')
  .then(any.fallback(undefined))
  .map((escaped) => {
    if (escaped === undefined) {
      return '\\\\';
    } else if (escaped === 'n') {
      return '\n';
    }
    return '\\' + escaped;
  })

export const keystrokesExpressionParser: Parser<string[]> = alt(
  escapedParser,
  specialCharacters,
  noneOf('"'),
).many();
