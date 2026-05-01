import { Position, TextDocument } from 'vscode';

export interface SearchFlags {
  direction?: '<' | '>';
  includeCursor?: boolean;
  throughLineBreaks?: boolean;
}

function searchForward(
  str: string,
  document: TextDocument,
  start: Position,
  flags: {
    throughLineBreaks?: boolean;
  } = {
    throughLineBreaks: false,
  },
): Position | undefined {
  let position = start;
  for (
    let line = position.line;
    line < document.lineCount && (flags.throughLineBreaks || line === start.line);
    line++
  ) {
    position = document.validatePosition(position.with({ line }));
    const text = document.lineAt(position).text;
    const index = text.indexOf(str, position.character);
    if (index >= 0) {
      return position.with({ character: index });
    }
    position = position.with({ character: 0 }); // set at line begin for next iteration
  }
  return undefined;
}

function searchBackward(
  str: string,
  document: TextDocument,
  start: Position,
  flags: {
    throughLineBreaks?: boolean;
  } = {
    throughLineBreaks: false,
  },
): Position | undefined {
  let position = start;
  for (
    let line = position.line;
    line >= 0 && (flags.throughLineBreaks || line === start.line);
    line--
  ) {
    position = document.validatePosition(position.with({ line }));
    const text = document.lineAt(position).text;
    const index = text.lastIndexOf(str, position.character);
    if (index >= 0) {
      return position.with({ character: index });
    }
    position = position.with({ character: +Infinity }); // set at line end for next iteration
  }
  return undefined;
}

export function maybeGetLeft(
  position: Position,
  {
    count = 1,
    throughLineBreaks,
    dontMove,
  }: { count?: number; throughLineBreaks?: boolean; dontMove?: boolean },
) {
  return dontMove
    ? position
    : throughLineBreaks
      ? position.getOffsetThroughLineBreaks(-count)
      : position.getLeft(count);
}
export function maybeGetRight(
  position: Position,
  {
    count = 1,
    throughLineBreaks,
    dontMove,
  }: { count?: number; throughLineBreaks?: boolean; dontMove?: boolean },
) {
  return dontMove
    ? position
    : throughLineBreaks
      ? position.getOffsetThroughLineBreaks(count)
      : position.getRight(count);
}

export function searchPosition(
  str: string,
  document: TextDocument,
  start: Position,
  flags: SearchFlags = {
    direction: '>',
    includeCursor: true,
    throughLineBreaks: false,
  },
): Position | undefined {
  if (flags.direction === '<') {
    start = maybeGetLeft(start, {
      dontMove: flags.includeCursor,
      throughLineBreaks: flags.throughLineBreaks,
    });
    return searchBackward(str, document, start, flags);
  } else {
    start = maybeGetRight(start, {
      dontMove: flags.includeCursor,
      throughLineBreaks: flags.throughLineBreaks,
    });
    return searchForward(str, document, start, flags);
  }
}
