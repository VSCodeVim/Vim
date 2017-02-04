import { Position, PositionDiff } from './../motion/position';
import * as vscode from 'vscode';

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
    "<" : { match: ">",  nextMatchIsForward: true  },
    ">" : { match: "<",  nextMatchIsForward: false },
    // These are useful for deleting closing and opening quotes, but don't seem to negatively
    // affect how text objects such as `ci"` work, which was my worry.
    '"' : { match: '"',  nextMatchIsForward: true  },
    "'" : { match: "'",  nextMatchIsForward: true  },
    "`" : { match: "`",  nextMatchIsForward: true  },
  };

  static nextPairedChar(position: Position, charToMatch: string, closed: boolean = true): Position | undefined {
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

    if (toFind === undefined) {
      return undefined;
    }

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
    return undefined;
  }

  /**
   * Given a current position, find an immediate following bracket and return the range. If
   * no matching bracket is found immediately following the opening bracket, return undefined.
   */
  static immediateMatchingBracket(currentPosition: Position): vscode.Range | undefined {
    // Don't delete bracket unless autoClosingBrackets is set
    if (!vscode.workspace.getConfiguration().get("editor.autoClosingBrackets")) { return undefined; }

    let deleteRange = new vscode.Range(currentPosition, currentPosition.getLeftThroughLineBreaks());
    let deleteText = vscode.window.activeTextEditor.document.getText(deleteRange);
    let matchRange: vscode.Range | undefined;
    let isNextMatch = false;

    if ("{[(\"'`".indexOf(deleteText) > -1) {
      let matchPosition = currentPosition.add(new PositionDiff(0, 1));
      if (matchPosition) {
        matchRange = new vscode.Range(matchPosition, matchPosition.getLeftThroughLineBreaks());
        isNextMatch = vscode.window.activeTextEditor.document.getText(matchRange) === PairMatcher.pairings[deleteText].match;
      }
    }

    if (isNextMatch && matchRange) {
      return matchRange;
    }

    return undefined;
  }
}