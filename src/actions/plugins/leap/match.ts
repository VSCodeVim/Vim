import { Position } from 'vscode';
import { LeapSearchDirection } from './leap';
import * as vscode from 'vscode';
import { configuration } from '../../../configuration/configuration';

export interface Match {
  position: Position;
  searchString: string;
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

const MATCH_COUNT_LIMIT = 400;
export function getMatches(
  searchRegex: RegExp,
  direction: LeapSearchDirection,
  position: Position,
  document: vscode.TextDocument,
  visibleRange: vscode.Range
) {
  const matches: Match[] = [];
  const lineStart = position.line;
  const lineEnd =
    direction === LeapSearchDirection.Backward ? visibleRange.end.line : visibleRange.start.line;

  function checkPosition(lineCount: number, index: number) {
    return (
      (lineCount === lineStart &&
        (direction === LeapSearchDirection.Forward
          ? index < position.character - 1
          : index > position.character)) ||
      lineCount !== lineStart
    );
  }

  function calcCurrentLineMatches(lineCount: number) {
    const lineText = document.lineAt(lineCount).text;
    let result = searchRegex.exec(lineText);
    const lineMatches: Match[] = [];

    while (result) {
      if (checkPosition(lineCount, result.index)) {
        const pos = new Position(lineCount, result.index);
        const rawText = result[0].length === 1 ? result[0] + ' ' : result[0];
        const searchString = configuration.leapCaseSensitive ? rawText : rawText.toLowerCase();
        lineMatches.push({ position: pos, searchString });
        if (searchString[0] === searchString[1]) {
          searchRegex.lastIndex--;
        }
      }
      result = searchRegex.exec(lineText);
    }

    return lineMatches;
  }

  const s = direction === LeapSearchDirection.Backward ? lineStart : lineEnd;
  const e = direction === LeapSearchDirection.Backward ? lineEnd : lineStart;

  for (let i = s; i <= e; i++) {
    matches.push(...calcCurrentLineMatches(i));
  }

  if (direction === LeapSearchDirection.Forward) matches.reverse();

  if (matches.length > MATCH_COUNT_LIMIT) matches.length = MATCH_COUNT_LIMIT;

  return matches;
}

export function getAllMatches(
  searchRegex: RegExp,
  document: vscode.TextDocument,
  visibleRange: vscode.Range
) {
  function calcCurrentLineMatches(lineCount: number) {
    const lineText = document.lineAt(lineCount).text;
    let result = searchRegex.exec(lineText);
    const lineMatches: Match[] = [];

    while (result) {
      const pos = new Position(lineCount, result.index);
      const rawText = result[0].length === 1 ? result[0] + ' ' : result[0];
      const searchString = configuration.leapCaseSensitive ? rawText : rawText.toLowerCase();
      lineMatches.push({ position: pos, searchString });
      if (searchString[0] === searchString[1]) {
        searchRegex.lastIndex--;
      }
      result = searchRegex.exec(lineText);
    }

    return lineMatches;
  }

  const matches: Match[] = [];

  const startLine = visibleRange.start.line;
  const endLine = visibleRange.end.line;

  for (let i = startLine; i < endLine; i++) {
    const lineMatches = calcCurrentLineMatches(i);
    matches.push(...lineMatches);
  }

  return matches;
}
