import * as vscode from 'vscode';

import { Match, SearchOptions } from './types';
import { Position } from 'vscode';

export class SearchUtil {
  public static SPECIAL_CHARACTER_REGEX: RegExp = /[\-\[\]{}()*+?.,\\\^$|#\s]/g;

  /**
   * Sort matches closest to the position using their index in the list
   */
  public static sortMatchesRelativeToPos(matches: Match[], position: Position): Match[] {
    // Find first match that is right after the cursor
    let indexFirstMatchAfterPos: number = matches.length;

    for (let i = 0; i < matches.length && indexFirstMatchAfterPos === matches.length; i++) {
      if (matches[i].position.isAfter(position)) {
        indexFirstMatchAfterPos = i;
        break;
      }
    }

    // Sort matches with index closest to the position
    matches.sort((a: Match, b: Match): number => {
      function computeAboluteDiff(matchIndex: number) {
        const absDiff = Math.abs(indexFirstMatchAfterPos - matchIndex);
        // Prioritize the matches on the right side of the cursor index
        // in case of a tie
        return matchIndex < indexFirstMatchAfterPos ? absDiff - 0.5 : absDiff;
      }

      const absDiffA = computeAboluteDiff(a.index);
      const absDiffB = computeAboluteDiff(b.index);
      return absDiffA - absDiffB;
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
          pos.subtract(position);

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
            // Matches on the cursor position should be ignored
            if (pos.isEqual(position)) {
              result = regex.exec(line);
            } else {
              matches.push(new Match(pos, result[0], matches.length));
              result = regex.exec(line);
            }
          }
        }
      }
    }

    return matches;
  }
}
