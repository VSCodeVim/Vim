import { RegisterAction } from '../../base';
import { VimState } from '../../../state/vimState';
import { BaseMovement } from '../../baseMotion';
import { Position, TextDocument } from 'vscode';

interface LineInfo {
  line: number;
  indentation: number;
  text: string;
}

interface MinimalPosition {
  line: number;
  character: number;
}

interface StructureElement {
  type: 'function' | 'class';
  start: MinimalPosition;
  end: MinimalPosition;
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
    const index: number = line.search(/\S/);

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

      if (text.match(/^\s*(def|class) /)) {
        const type = text.match(/def/) ? 'function' : 'class';

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
          start: {
            line: info.line,
            character: info.indentation,
          },
          end: {
            line: endLine.line,
            character: endLine.text.search(/(?<=\S)\s*$/) - 1, // Calculate position of last non-white character
          },
        });
      }
    }

    return structure;
  }

  /*
   * Filter function that returns true if an element is strictly ahead (false if equal)
   * of the specified (first arg) position.
   */
  static isAhead(position: MinimalPosition, elementPosition: MinimalPosition) {
    return (
      elementPosition.line > position.line ||
      (elementPosition.line === position.line && elementPosition.character > position.character)
    );
  }

  /*
   * Filter function that returns true if an element is strictly behind (false if equal)
   * of the specified (first arg) position.
   */
  static isBehind(position: MinimalPosition, elementPosition: MinimalPosition) {
    return (
      elementPosition.line < position.line ||
      (elementPosition.line === position.line && elementPosition.character < position.character)
    );
  }

  /*
   * Find the position of the specified:
   *    type: function or class
   *    direction: next or prev
   *    edge: start or end
   *
   * With this information one can determine all of the required motions
   */
  find(type: Type, direction: Direction, edge: Edge, position: Position): Position | null {
    // Choose the filtering utility based on direction
    const isDirection = direction === 'next' ? PythonDocument.isAhead : PythonDocument.isBehind;

    // Filter function for all elements whose "edge" is in the correct "direction"
    // relative to the cursor's position
    const dir = (element: StructureElement) => isDirection(position, element[edge]);

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

    return null;
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
  type = 'function' as Type;
  direction = 'next' as Direction;
  edge = 'start' as Edge;
}

@RegisterAction
class MovePythonPrevFunctionStart extends BasePythonMovement {
  keys = ['[', 'm'];
  type = 'function' as Type;
  direction = 'prev' as Direction;
  edge = 'start' as Edge;
}

@RegisterAction
class MovePythonNextFunctionEnd extends BasePythonMovement {
  keys = [']', 'M'];
  type = 'function' as Type;
  direction = 'next' as Direction;
  edge = 'end' as Edge;
}

@RegisterAction
class MovePythonPrevFunctionEnd extends BasePythonMovement {
  keys = ['[', 'M'];
  type = 'function' as Type;
  direction = 'prev' as Direction;
  edge = 'end' as Edge;
}
