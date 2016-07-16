import { Position } from './../motion/position';

/**
 * PairMatcher finds the position matching the given character, respecting nested
 * instances of the pair.
 */
export class PairMatcher {
  static pairings: { [key: string]: { match: string, nextMatchIsForward: boolean, matchesWithPercentageMotion?: boolean }} = {
    "(" : { match: ")",  nextMatchIsForward: true,  matchesWithPercentageMotion: true },
    "{" : { match: "}",  nextMatchIsForward: true,  matchesWithPercentageMotion: true },
    "[" : { match: "]",  nextMatchIsForward: true,  matchesWithPercentageMotion: true },
    ")" : { match: "(",  nextMatchIsForward: false, matchesWithPercentageMotion: true },
    "}" : { match: "{",  nextMatchIsForward: false, matchesWithPercentageMotion: true },
    "]" : { match: "[",  nextMatchIsForward: false, matchesWithPercentageMotion: true },
    // These characters can't be used for "%"-based matching, but are still
    // useful for text objects.
    // "'" : { match: "'",  nextMatchIsForward: true },
    // "\"": { match: "\"", nextMatchIsForward: true },
    "<" : { match: ">",  nextMatchIsForward: true },
  };

  static nextPairedChar(position: Position, charToMatch: string, closed: boolean = true): Position {
    /**
     * We do a fairly basic implementation that only tracks the state of the type of
     * character you're over and its pair (e.g. "[" and "]"). This is similar to
     * what Vim does.
     *
     * It can't handle strings very well - something like "|( ')' )" where | is the
     * cursor will cause it to go to the ) in the quotes, even though it should skip over it.
     *
     * PRs welcomed! (TODO)
     * Though ideally VSC implements https://github.com/Microsoft/vscode/issues/7177
     */
    const toFind = this.pairings[charToMatch];

    let stackHeight = closed ? 0 : 1;
    let matchedPosition: Position | undefined = undefined;

    for (const { char, pos } of Position.IterateDocument(position, toFind.nextMatchIsForward)) {
      if (char === charToMatch) {
        stackHeight++;
      }

      if (char === toFind.match) {
        stackHeight--;
      }

      if (stackHeight === 0) {
        matchedPosition = pos;

        break;
      }
    }

    if (matchedPosition) {
      return matchedPosition;
    }

    // TODO(bell)
    return position;
  }
}