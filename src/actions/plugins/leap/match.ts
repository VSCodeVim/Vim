import { Position } from 'vscode';
import { isBackward, LeapSearchDirection } from './leap';
import * as vscode from 'vscode';
import { configuration } from '../../../configuration/configuration';
import { VimState } from '../../../state/vimState';

export interface Match {
  position: Position;
  searchString: string;
  direction: LeapSearchDirection;
}

const needEscapeStrings: string = '$()*+.[]?\\^{}|';
function escapeString(str: string) {
  return needEscapeStrings.includes(str) ? '\\' + str : str;
}

function getFlags() {
  const caseSensitiveFlag = configuration.leapCaseSensitive ? '' : 'i';
  return `g${caseSensitiveFlag}`;
}

export function generatePrepareRegex(rawSearchString: string) {
  const searchCharacter = escapeString(rawSearchString);
  const pattern = `${searchCharacter}[\\s\\S]|${searchCharacter}$`;
  return new RegExp(pattern, getFlags());
}

export function generateMarkerRegex(searchString: string) {
  function getPattern(rawSearchString: string) {
    const searchChars = rawSearchString.split('').map(escapeString);

    const firstChar = searchChars[0];
    const secondChar = searchChars[1];
    let pattern = '';
    if (secondChar === ' ') {
      pattern = firstChar + '\\s' + '|' + firstChar + '$';
    } else {
      pattern = firstChar + secondChar;
    }

    return pattern;
  }

  return new RegExp(getPattern(searchString), getFlags());
}

export function getMatches(
  searchRegex: RegExp,
  direction: LeapSearchDirection,
  position: Position,
  vimState: VimState
) {
  const document = vimState.document;
  const visibleRanges = vimState.editor.visibleRanges;

  function matchRange(range: vscode.Range) {
    const matches: Match[] = [];
    const lineStart = range.start.line;
    const lineEnd = range.end.line;

    function calcCurrentLineMatches(lineCount: number) {
      const lineText = document.lineAt(lineCount).text;
      let result = searchRegex.exec(lineText);
      const lineMatches: Match[] = [];

      while (result) {
        const pos = new Position(lineCount, result.index);
        const rawText = result[0].length === 1 ? result[0] + ' ' : result[0];
        const searchString = configuration.leapCaseSensitive ? rawText : rawText.toLowerCase();
        let dir = direction;
        if (direction === LeapSearchDirection.Bidirectional) {
          dir = isBackward(pos, position)
            ? LeapSearchDirection.Backward
            : LeapSearchDirection.Forward;
        }
        lineMatches.push({ position: pos, searchString, direction: dir });
        if (searchString[0] === searchString[1]) {
          searchRegex.lastIndex--;
        }
        result = searchRegex.exec(lineText);
      }

      return lineMatches;
    }

    for (let i = lineStart; i <= lineEnd; i++) {
      matches.push(...calcCurrentLineMatches(i));
    }

    return matches;
  }

  const matches = visibleRanges.reduce((result, range) => {
    result.push(...matchRange(range));
    return result;
  }, [] as Match[]);

  if (direction === LeapSearchDirection.Backward) {
    return matches.filter((match) => {
      if (match.position.line > position.line) {
        return true;
      } else if (
        match.position.line === position.line &&
        match.position.character > position.character
      ) {
        return true;
      }
      return false;
    });
  } else if (direction === LeapSearchDirection.Forward) {
    return matches
      .filter((match) => {
        if (match.position.line < position.line) {
          return true;
        } else if (
          match.position.line === position.line &&
          match.position.character < position.character - 1
        ) {
          return true;
        }

        return false;
      })
      .reverse();
  } else if (direction === LeapSearchDirection.Bidirectional) {
    const backwardMatches = matches.filter((m) => m.direction === LeapSearchDirection.Backward);
    const forwardMatches = matches
      .filter((m) => m.direction === LeapSearchDirection.Forward)
      .reverse();

    return [...backwardMatches, ...forwardMatches].filter((m) => {
      if (
        m.position.line === position.line &&
        (m.position.character === position.character ||
          m.position.character === position.character - 1)
      )
        return false;

      return true;
    });
  }

  return matches
}
