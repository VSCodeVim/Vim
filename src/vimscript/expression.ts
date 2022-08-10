import { alt, any, Parser, regexp, string, seq, noneOf } from "parsimmon";

const specialCharacters = regexp(/<(?:Esc|C-\w|A-\w|C-A-\w)>/)

export const keystrokesExpressionParser: Parser<string[]> = alt(
  string("\\").then(any).map(s => `\\${s}`),
  specialCharacters,
  noneOf('"'),
).many();
