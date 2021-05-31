import { RegisterAction } from '../../base';
import { VimState } from '../../../state/vimState';
import { BaseMovement } from '../../baseMotion';
import { Position, TextDocument } from 'vscode';

interface LineInfo {
  line: number;
  indentation: number;
  text: string;
}

interface StructureElement {
  type: 'function' | 'class';
  start: Position;
  end: Position;
}

/*
 * Utility class used to parse the lines in the document and
 * determine class and function boundaries
 *
 * The class keeps track of two positions: the ORIGINAL and the CURRENT
 * using their relative locations to make decisions.
 */
export class PythonDocument {
  _document: TextDocument;
  structure: StructureElement[];

  static readonly reOnlyWhitespace = /\S/;
  static readonly reLastNonWhiteSpaceCharacter = /(?<=\S)\s*$/;
  static readonly reDefOrClass = /^\s*(def|class) /;
  static readonly reDef = /def/;

  constructor(document: TextDocument) {
    this._document = document;
    const parsed = PythonDocument._parseLines(document);
    this.structure = PythonDocument._parseStructure(parsed);
  }

  /*
   * Generator of the lines of text in the document
   */
  static *lines(document: TextDocument): Generator<string> {
    for (let index = 0; index < document.lineCount; index++) {
      yield document.lineAt(index).text;
    }
  }

  /*
   * Calculate the indentation of a line of text.
   * Lines consisting entirely of whitespace of "starting" with a comment are defined
   * to have an indentation of "null".
   */
  static _indentation(line: string): number | null {
    const index: number = line.search(PythonDocument.reOnlyWhitespace);

    // Return null if line is empty, just whitespace, or starts with a comment
    if (index === -1 || line[index] === '#') {
      return null;
    }

    return index;
  }

  /*
   * Parse a line of text to extract LineInfo
   * Return null if the line is empty or starts with a comment
   */
  static _parseLine(index: number, text: string): LineInfo | null {
    const indentation = this._indentation(text);

    // Since indentation === 0 is a valid result we need to check for null explicitly
    return indentation !== null ? { line: index, indentation, text } : null;
  }

  static _parseLines(document: TextDocument): LineInfo[] {
    const lines = [...this.lines(document)]; // convert generator to Array
    const infos = lines.map((text, index) => this._parseLine(index, text));

    return infos.filter((x) => x) as LineInfo[]; // filter out empty/comment lines (null info)
  }

  static _parseStructure(lines: LineInfo[]): StructureElement[] {
    const last = lines.length;
    const structure: StructureElement[] = [];

    for (let index = 0; index < last; index++) {
      const info = lines[index];
      const text = info.text;

      if (text.match(PythonDocument.reDefOrClass)) {
        const type = text.match(PythonDocument.reDef) ? 'function' : 'class';

        // Find the end of the current function/class
        let idx = index + 1;

        for (; idx < last; idx++) {
          if (lines[idx].indentation <= info.indentation) {
            break;
          }
        }

        // Since we stop when we find the first line with a less indentation
        // we pull back one line to get to the end of the function/class
        idx--;

        const endLine = lines[idx];

        structure.push({
          type,
          start: new Position(info.line, info.indentation),
          // Calculate position of last non-white character)
          end: new Position(
            endLine.line,
            endLine.text.search(PythonDocument.reLastNonWhiteSpaceCharacter) - 1
          ),
        });
      }
    }

    return structure;
  }

  /*
   * Find the position of the specified:
   *    type: function or class
   *    direction: next or prev
   *    edge: start or end
   *
   * With this information one can determine all of the required motions
   */
  find(type: Type, direction: Direction, edge: Edge, position: Position): Position | undefined {
    // Choose the ordering method name based on direction
    const isDirection = direction === 'next' ? 'isAfter' : 'isBefore';

    // Filter function for all elements whose "edge" is in the correct "direction"
    // relative to the cursor's position
    const dir = (element: StructureElement) => element[edge][isDirection](position);

    // Filter out elements from structure based on type and direction
    const elements = this.structure.filter((elem) => elem.type === type).filter(dir);

    if (edge === 'end') {
      // When moving to an 'end' the elements should be started by the end position
      elements.sort((a, b) => a.end.line - b.end.line);
    }

    // Return the first match if any exist
    if (elements.length) {
      // If direction === 'next' return the first element
      // otherwise return the last element
      const index = direction === 'next' ? 0 : elements.length - 1;
      const element = elements[index];
      const pos = element[edge];

      // execAction MUST return a fully realized Position object created using new
      return new Position(pos.line, pos.character);
    }

    return undefined;
  }

  // Use PythonDocument instance to move to specified class boundary
  static moveClassBoundary(
    document: TextDocument,
    position: Position,
    forward: boolean,
    start: boolean
  ): Position {
    const direction = forward ? 'next' : 'prev';
    const edge = start ? 'start' : 'end';

    return new PythonDocument(document).find('class', direction, edge, position) || position;
  }
}

type Type = 'function' | 'class';
type Edge = 'start' | 'end';
type Direction = 'next' | 'prev';

// Uses the specified findFunction to execute the motion coupled to the shortcut (keys)
abstract class BasePythonMovement extends BaseMovement {
  abstract type: Type;
  abstract direction: Direction;
  abstract edge: Edge;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const document = vimState.document;
    switch (document.languageId) {
      case 'python':
        return (
          new PythonDocument(document).find(this.type, this.direction, this.edge, position) ||
          position
        );

      default:
        return position;
    }
  }
}

@RegisterAction
class MovePythonNextFunctionStart extends BasePythonMovement {
  keys = [']', 'm'];
  type: Type = 'function';
  direction = 'next' as Direction;
  edge = 'start' as Edge;
}

@RegisterAction
class MovePythonPrevFunctionStart extends BasePythonMovement {
  keys = ['[', 'm'];
  type: Type = 'function';
  direction = 'prev' as Direction;
  edge = 'start' as Edge;
}

@RegisterAction
class MovePythonNextFunctionEnd extends BasePythonMovement {
  keys = [']', 'M'];
  type: Type = 'function';
  direction = 'next' as Direction;
  edge = 'end' as Edge;
}

@RegisterAction
class MovePythonPrevFunctionEnd extends BasePythonMovement {
  keys = ['[', 'M'];
  type: Type = 'function';
  direction = 'prev' as Direction;
  edge = 'end' as Edge;
}
