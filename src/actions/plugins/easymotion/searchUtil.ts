import * as vscode from 'vscode';

import { configuration } from './../../../configuration/configuration';
import { TextEditor } from './../../../textEditor';
import { IEasyMotion, EasyMotionSearchAction, Marker, Match, SearchOptions } from './types';
import { Mode } from '../../../mode/mode';
import { Position } from 'vscode';

export class SearchUtil {
  /**
   * TODO: For future motions
   */
  public static SPECIAL_CHARACTER_REGEX: RegExp = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;

  public static sortMatchesRelativeToPos(matches: Match[], position: Position): Match[] {
    // Sort by the index distance from the cursor index
    const posIndex = position.character;

    matches.sort((a: Match, b: Match): number => {
      const absDiffA = computeAboluteDiff(a.index);
      const absDiffB = computeAboluteDiff(b.index);
      return absDiffA - absDiffB;

      function computeAboluteDiff(matchIndex: number) {
        const absDiff = Math.abs(posIndex - matchIndex);
        // Prioritize the matches on the right side of the cursor index
        return matchIndex < posIndex ? absDiff - 0.5 : absDiff;
      }
    });

    return matches;
  }

  public static searchDocument(
    document: vscode.TextDocument,
    position: Position,
    search: string | RegExp = '',
    options: SearchOptions = {}
  ): Match[] {
    const regex =
      typeof search === 'string'
        ? new RegExp(search.replace(SearchUtil.SPECIAL_CHARACTER_REGEX, '\\$&'), 'g')
        : search;

    const matches: Match[] = [];

    // Cursor index refers to the index of the marker that is on or to the right of the cursor
    let cursorIndex = position.character;
    let prevMatch: Match | undefined;

    // Calculate the min/max bounds for the search
    const lineCount = document.lineCount;
    const lineMin = options.min ? Math.max(options.min.line, 0) : 0;
    const lineMax = options.max ? Math.min(options.max.line + 1, lineCount) : lineCount;

    outer: for (let lineIdx = lineMin; lineIdx < lineMax; lineIdx++) {
      const line = document.lineAt(lineIdx).text;
      let result = regex.exec(line);

      while (result) {
        if (matches.length >= 1000) {
          break outer;
        } else {
          const pos = new Position(lineIdx, result.index);

          // Check if match is within bounds
          if (
            (options.min && pos.isBefore(options.min)) ||
            (options.max && pos.isAfter(options.max)) ||
            Math.abs(pos.line - position.line) > 100
          ) {
            // Stop searching after 100 lines in both directions
            result = regex.exec(line);
          } else {
            // Update cursor index to the marker on the right side of the cursor
            if (!prevMatch || prevMatch.position.isBefore(position)) {
              cursorIndex = matches.length;
            }
            // Matches on the cursor position should be ignored
            if (pos.isEqual(position)) {
              result = regex.exec(line);
            } else {
              prevMatch = new Match(pos, result[0], matches.length);
              matches.push(prevMatch);
              result = regex.exec(line);
            }
          }
        }
      }
    }

    // Sort by the index distance from the cursor index
    matches.sort((a: Match, b: Match): number => {
      const absDiffA = computeAboluteDiff(a.index);
      const absDiffB = computeAboluteDiff(b.index);
      return absDiffA - absDiffB;

      function computeAboluteDiff(matchIndex: number) {
        const absDiff = Math.abs(cursorIndex - matchIndex);
        // Prioritize the matches on the right side of the cursor index
        return matchIndex < cursorIndex ? absDiff - 0.5 : absDiff;
      }
    });

    return matches;
  }
}
