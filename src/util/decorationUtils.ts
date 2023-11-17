import { Range, DecorationOptions } from 'vscode';

/**
 * Alias for the types of arrays that can be passed to a TextEditor's setDecorations method
 */
export type EditorDecorationArray = Range[] | DecorationOptions[];

/**
 * Decorations associated with search/substitute operations
 */
export type SearchDecorations = {
  searchHighlight?: EditorDecorationArray;
  searchMatch?: EditorDecorationArray;
  substitutionAppend?: EditorDecorationArray;
  substitutionReplace?: EditorDecorationArray;
};

/**
 * @returns a DecorationOptions object representing the given range. If the
 * given range is empty, the range of the returned object will be extended one
 * character to the right. If the given range cannot be extended right, or
 * represents the end of a line (possibly containing EOL characters), the
 * returned object will specify an after element with the width of a single
 * character.
 */
export function ensureVisible(range: Range): DecorationOptions {
  return (range.isEmpty || range.end.isLineBeginning()) && range.start.isLineEnd()
    ? {
        // range is at EOL, possibly containing EOL char(s).
        range: range.with(undefined, range.start),
        renderOptions: {
          after: {
            color: 'transparent',
            contentText: '$', // non-whitespace character to set width.
          },
        },
      }
    : range.isEmpty
      ? { range: range.with(undefined, range.end.translate(0, 1)) } // extend range one character right
      : { range };
}

/**
 * @returns a version of the input string suitable for use as the contentText of a decoration's before or after element
 */
export function formatDecorationText(
  text: string,
  tabsize: number,
  newlineReplacement: string | ((substring: string, ...args: any[]) => string) = '\u23ce', // "⏎" RETURN SYMBOL
) {
  // surround with zero-width space to prevent trimming
  return `\u200b${text
    // vscode collapses whitespace in decorations; modify text to prevent this.
    .replace(/ /g, '\u00a0') // " " NO-BREAK SPACE
    .replace(/\t/g, '\u00a0'.repeat(tabsize))
    // Decorations can't change the apparent # of lines in the editor, so we must settle for a single-line version of our text
    .replace(/\r\n|[\r\n]/g, newlineReplacement as any)}\u200b`;
}

/**
 * @returns search decorations for the given ranges, taking into account the current match
 */
export function getDecorationsForSearchMatchRanges(
  ranges: Range[],
  currentMatchIndex?: number,
): SearchDecorations {
  const searchHighlight: DecorationOptions[] = [];
  const searchMatch: DecorationOptions[] = [];

  for (let i = 0; i < ranges.length; i++) {
    (i === currentMatchIndex ? searchMatch : searchHighlight).push(ensureVisible(ranges[i]));
  }

  return { searchHighlight, searchMatch };
}
