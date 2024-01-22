// eslint-disable-next-line id-denylist
import { Parser, alt, any, noneOf, regexp, string } from 'parsimmon';
import { configuration } from '../configuration/configuration';

const leaderParser = regexp(/<leader>/).map(() => configuration.leader); // lazy evaluation of configuration.leader
const specialCharacters = regexp(/<(?:Esc|C-\w|A-\w|C-A-\w)>/);

const specialCharacterParser = alt(specialCharacters, leaderParser);

// TODO: Move to a more general location
// TODO: Add more special characters
const escapedParser = string('\\')
  // eslint-disable-next-line id-denylist
  .then(any.fallback(undefined))
  .map((escaped) => {
    if (escaped === undefined) {
      return '\\\\';
    } else if (escaped === 'n') {
      return '\n';
    }
    return '\\' + escaped;
  });

export const keystrokesExpressionParser: Parser<string[]> = alt(
  escapedParser,
  specialCharacterParser,
  noneOf('"'),
).many();
