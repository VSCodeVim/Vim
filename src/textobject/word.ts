import * as _ from 'lodash';
import { Position, TextDocument } from 'vscode';
import { configuration } from '../configuration/configuration';
import { getAllEndPositions, getAllPositions } from './util';

export enum WordType {
  Normal,
  Big,
  CamelCase,
  FileName,
  TagName,
}

const nonBigWordCharRegex = makeWordRegex('');
const nonFileNameRegex = makeWordRegex('"\'`;<>{}[]()');
const nonTagNameRegex = makeWordRegex('</>');

function regexForWordType(wordType: WordType): RegExp {
  switch (wordType) {
    case WordType.Normal:
      return makeUnicodeWordRegex(configuration.iskeyword);
    case WordType.Big:
      return nonBigWordCharRegex;
    case WordType.CamelCase:
      return makeCamelCaseWordRegex(configuration.iskeyword);
    case WordType.FileName:
      return nonFileNameRegex;
    case WordType.TagName:
      return nonTagNameRegex;
  }
}

/**
 * Get the position of the word counting from the position specified.
 * @param text The string to search from.
 * @param pos The position of text to search from.
 * @returns The character position of the word to the left relative to the text and the pos.
 *          undefined if there is no word to the left of the postion.
 */
export function getWordLeftInText(
  text: string,
  pos: number,
  wordType: WordType,
): number | undefined {
  return getWordLeftOnLine(text, pos, wordType);
}

export function getWordRightInText(
  text: string,
  pos: number,
  wordType: WordType,
): number | undefined {
  return getAllPositions(text, regexForWordType(wordType)).find((index) => index > pos);
}

export function prevWordStart(
  document: TextDocument,
  pos: Position,
  wordType: WordType,
  inclusive: boolean = false,
): Position {
  for (let currentLine = pos.line; currentLine >= 0; currentLine--) {
    const newCharacter = getWordLeftOnLine(
      document.lineAt(currentLine).text,
      pos.character,
      wordType,
      currentLine !== pos.line,
      inclusive,
    );

    if (newCharacter !== undefined) {
      return new Position(currentLine, newCharacter);
    }
  }

  return new Position(0, 0);
}

function getWordLeftOnLine(
  text: string,
  pos: number,
  wordType: WordType,
  forceFirst: boolean = false,
  inclusive: boolean = false,
): number | undefined {
  return getAllPositions(text, regexForWordType(wordType))
    .reverse()
    .find((index) => (index < pos && !inclusive) || (index <= pos && inclusive) || forceFirst);
}

export function nextWordStart(
  document: TextDocument,
  pos: Position,
  wordType: WordType,
  inclusive: boolean = false,
): Position {
  for (let currentLine = pos.line; currentLine < document.lineCount; currentLine++) {
    const positions = getAllPositions(
      document.lineAt(currentLine).text,
      regexForWordType(wordType),
    );
    const newCharacter = positions.find(
      (index) =>
        (index > pos.character && !inclusive) ||
        (index >= pos.character && inclusive) ||
        currentLine !== pos.line,
    );

    if (newCharacter !== undefined) {
      return new Position(currentLine, newCharacter);
    }
  }

  return new Position(document.lineCount - 1, 0).getLineEnd();
}

export function nextWordEnd(
  document: TextDocument,
  pos: Position,
  wordType: WordType,
  inclusive: boolean = false,
): Position {
  for (let currentLine = pos.line; currentLine < document.lineCount; currentLine++) {
    const positions = getAllEndPositions(
      document.lineAt(currentLine).text,
      regexForWordType(wordType),
    );
    const newCharacter = positions.find(
      (index) =>
        (index > pos.character && !inclusive) ||
        (index >= pos.character && inclusive) ||
        currentLine !== pos.line,
    );

    if (newCharacter !== undefined) {
      return new Position(currentLine, newCharacter);
    }
  }

  return new Position(document.lineCount - 1, 0).getLineEnd();
}

export function prevWordEnd(document: TextDocument, pos: Position, wordType: WordType): Position {
  for (let currentLine = pos.line; currentLine > -1; currentLine--) {
    let positions = getAllEndPositions(
      document.lineAt(currentLine).text,
      regexForWordType(wordType),
    );
    // if one line is empty, use the 0 position as the default value
    if (positions.length === 0) {
      positions.push(0);
    }
    // reverse the list to find the biggest element smaller than pos.character
    positions = positions.reverse();
    const index = positions.findIndex((i) => i < pos.character || currentLine !== pos.line);
    let newCharacter = 0;
    if (index === -1) {
      if (currentLine > -1) {
        continue;
      }
      newCharacter = positions.at(-1)!;
    } else {
      newCharacter = positions[index];
    }

    if (newCharacter !== undefined) {
      return new Position(currentLine, newCharacter);
    }
  }

  return new Position(0, 0);
}

function makeWordRegex(characterSet: string): RegExp {
  const escaped = characterSet && _.escapeRegExp(characterSet).replace(/-/g, '\\-');
  const segments = [`([^\\s${escaped}]+)`, `[${escaped}]+`, `$^`];

  return new RegExp(segments.join('|'), 'g');
}

function makeCamelCaseWordRegex(characterSet: string): RegExp {
  const escaped = characterSet && _.escapeRegExp(characterSet).replace(/-/g, '\\-');
  const segments: string[] = [];

  // Older browsers don't support lookbehind - in this case, use an inferior regex rather than crashing
  let supportsLookbehind = true;
  try {
    new RegExp('(?<=x)');
  } catch {
    supportsLookbehind = false;
  }

  // prettier-ignore
  const firstSegment =
      '(' +                                             // OPEN: group for matching camel case words
      `[^\\s${escaped}_]` +                             //   words can start with any non-keyword non-underscore character
      '(?:' +                                           //   OPEN: group for characters after initial char
      `(?:${supportsLookbehind ? '(?<=[A-Z_])' : ''}` + //     If first char was a capital
      `[A-Z](?=[\\sA-Z0-9${escaped}_]))+` +             //       the word can continue with all caps
      '|' +                                             //     OR
      `(?:${supportsLookbehind ? '(?<=[0-9_])' : ''}` + //     If first char was a digit
      `[0-9](?=[\\sA-Z0-9${escaped}_]))+` +             //       the word can continue with all digits
      '|' +                                             //     OR
      `(?:${supportsLookbehind ? '(?<=[_])' : ''}` +    //     If first char was an underscore
      `[_](?=[\\s${escaped}_]))+`  +                    //       the word can continue with all underscores
      '|' +                                             //     OR
      `[^\\sA-Z0-9${escaped}_]*` +                      //     Continue with regular characters
      ')' +                                             //   END: group for characters after initial char
      ')' +                                             // END: group for matching camel case words
      '';

  segments.push(firstSegment);
  segments.push(`[${escaped}]+`);
  segments.push(`$^`);

  // it can be difficult to grok the behavior of the above regex
  // feel free to check out https://regex101.com/r/mkVeiH/1 as a live example
  return new RegExp(segments.join('|'), 'g');
}

function makeUnicodeWordRegex(keywordChars: string): RegExp {
  // Distinct categories of characters
  enum CharKind {
    Punctuation,
    Superscript,
    Subscript,
    Braille,
    Ideograph,
    Hiragana,
    Katakana,
    Hangul,
  }

  // List of printable characters (code point intervals) and their character kinds.
  // Latin alphabets (e.g., ASCII alphabets and numbers,  Latin-1 Supplement, European Latin) are excluded.
  // Imported from utf_class_buf in src/mbyte.c of Vim.
  const symbolTable: Array<[[number, number], CharKind]> = [
    [[0x00a1, 0x00bf], CharKind.Punctuation], // Latin-1 punctuation
    [[0x037e, 0x037e], CharKind.Punctuation], // Greek question mark
    [[0x0387, 0x0387], CharKind.Punctuation], // Greek ano teleia
    [[0x055a, 0x055f], CharKind.Punctuation], // Armenian punctuation
    [[0x0589, 0x0589], CharKind.Punctuation], // Armenian full stop
    [[0x05be, 0x05be], CharKind.Punctuation],
    [[0x05c0, 0x05c0], CharKind.Punctuation],
    [[0x05c3, 0x05c3], CharKind.Punctuation],
    [[0x05f3, 0x05f4], CharKind.Punctuation],
    [[0x060c, 0x060c], CharKind.Punctuation],
    [[0x061b, 0x061b], CharKind.Punctuation],
    [[0x061f, 0x061f], CharKind.Punctuation],
    [[0x066a, 0x066d], CharKind.Punctuation],
    [[0x06d4, 0x06d4], CharKind.Punctuation],
    [[0x0700, 0x070d], CharKind.Punctuation], // Syriac punctuation
    [[0x0964, 0x0965], CharKind.Punctuation],
    [[0x0970, 0x0970], CharKind.Punctuation],
    [[0x0df4, 0x0df4], CharKind.Punctuation],
    [[0x0e4f, 0x0e4f], CharKind.Punctuation],
    [[0x0e5a, 0x0e5b], CharKind.Punctuation],
    [[0x0f04, 0x0f12], CharKind.Punctuation],
    [[0x0f3a, 0x0f3d], CharKind.Punctuation],
    [[0x0f85, 0x0f85], CharKind.Punctuation],
    [[0x104a, 0x104f], CharKind.Punctuation], // Myanmar punctuation
    [[0x10fb, 0x10fb], CharKind.Punctuation], // Georgian punctuation
    [[0x1361, 0x1368], CharKind.Punctuation], // Ethiopic punctuation
    [[0x166d, 0x166e], CharKind.Punctuation], // Canadian Syl. punctuation
    [[0x169b, 0x169c], CharKind.Punctuation],
    [[0x16eb, 0x16ed], CharKind.Punctuation],
    [[0x1735, 0x1736], CharKind.Punctuation],
    [[0x17d4, 0x17dc], CharKind.Punctuation], // Khmer punctuation
    [[0x1800, 0x180a], CharKind.Punctuation], // Mongolian punctuation
    [[0x200c, 0x2027], CharKind.Punctuation], // punctuation and symbols
    [[0x202a, 0x202e], CharKind.Punctuation], // punctuation and symbols
    [[0x2030, 0x205e], CharKind.Punctuation], // punctuation and symbols
    [[0x2060, 0x27ff], CharKind.Punctuation], // punctuation and symbols
    [[0x2070, 0x207f], CharKind.Superscript], // superscript
    [[0x2080, 0x2094], CharKind.Subscript], // subscript
    [[0x20a0, 0x27ff], CharKind.Punctuation], // all kinds of symbols
    [[0x2800, 0x28ff], CharKind.Braille], // braille
    [[0x2900, 0x2998], CharKind.Punctuation], // arrows, brackets, etc.
    [[0x29d8, 0x29db], CharKind.Punctuation],
    [[0x29fc, 0x29fd], CharKind.Punctuation],
    [[0x2e00, 0x2e7f], CharKind.Punctuation], // supplemental punctuation
    [[0x3001, 0x3020], CharKind.Punctuation], // ideographic punctuation
    [[0x3030, 0x3030], CharKind.Punctuation],
    [[0x303d, 0x303d], CharKind.Punctuation],
    [[0x3040, 0x309f], CharKind.Hiragana], // Hiragana
    [[0x30a0, 0x30ff], CharKind.Katakana], // Katakana
    [[0x3300, 0x9fff], CharKind.Ideograph], // CJK Ideographs
    [[0xac00, 0xd7a3], CharKind.Hangul], // Hangul Syllables
    [[0xf900, 0xfaff], CharKind.Ideograph], // CJK Ideographs
    [[0xfd3e, 0xfd3f], CharKind.Punctuation],
    [[0xfe30, 0xfe6b], CharKind.Punctuation], // punctuation forms
    [[0xff00, 0xff0f], CharKind.Punctuation], // half/fullwidth ASCII
    [[0xff1a, 0xff20], CharKind.Punctuation], // half/fullwidth ASCII
    [[0xff3b, 0xff40], CharKind.Punctuation], // half/fullwidth ASCII
    [[0xff5b, 0xff65], CharKind.Punctuation], // half/fullwidth ASCII
    [[0x20000, 0x2a6df], CharKind.Ideograph], // CJK Ideographs
    [[0x2a700, 0x2b73f], CharKind.Ideograph], // CJK Ideographs
    [[0x2b740, 0x2b81f], CharKind.Ideograph], // CJK Ideographs
    [[0x2f800, 0x2fa1f], CharKind.Ideograph], // CJK Ideographs
  ];

  const codePointRangePatterns: string[][] = [];
  for (const kind in CharKind) {
    if (!isNaN(Number(kind))) {
      codePointRangePatterns[kind] = [];
    }
  }

  for (const [[first, last], kind] of symbolTable) {
    if (first === last) {
      // '\u{hhhh}'
      codePointRangePatterns[kind].push(`\\u{${first.toString(16)}}`);
    } else {
      // '\u{hhhh}-\u{hhhh}'
      codePointRangePatterns[kind].push(`\\u{${first.toString(16)}}-\\u{${last.toString(16)}}`);
    }
  }

  // Symbols in vim.iskeyword or editor.wordSeparators
  // are treated as CharKind.Punctuation
  const escapedKeywordChars = _.escapeRegExp(keywordChars).replace(/-/g, '\\-');
  codePointRangePatterns[Number(CharKind.Punctuation)].push(escapedKeywordChars);

  const codePointRanges = codePointRangePatterns.map((patterns) => patterns.join(''));
  const symbolSegments = codePointRanges.map((range) => `([${range}]+)`);

  // wordSegment matches word characters.
  // A word character is a symbol which is neither
  // - space
  // - a symbol listed in the table
  // - a keyword (vim.iskeyword)
  const wordSegment = `([^\\s${codePointRanges.join('')}]+)`;

  // https://regex101.com/r/X1agK6/2
  const segments = symbolSegments.concat(wordSegment, '$^');
  return new RegExp(segments.join('|'), 'ug');
}
