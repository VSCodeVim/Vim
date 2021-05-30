import { Position, Selection, TextEditor } from 'vscode';

export class Cursor {
  public readonly start: Position;
  public readonly stop: Position;

  constructor(start: Position, stop: Position) {
    this.start = start;
    this.stop = stop;
  }

  public isValid(textEditor: TextEditor) {
    return this.start.isValid(textEditor) && this.stop.isValid(textEditor);
  }

  /**
   * Create a Cursor from a VSCode selection.
   */
  public static FromVSCodeSelection(sel: Selection): Cursor {
    return new Cursor(sel.start, sel.end);
  }

  public equals(other: Cursor): boolean {
    return this.start.isEqual(other.start) && this.stop.isEqual(other.stop);
  }

  /**
   * Returns a new Cursor which is the same as this Cursor, but with the provided stop value.
   */
  public withNewStop(stop: Position): Cursor {
    return new Cursor(this.start, stop);
  }

  /**
   * Returns a new Cursor which is the same as this Cursor, but with the provided start value.
   */
  public withNewStart(start: Position): Cursor {
    return new Cursor(start, this.stop);
  }

  public toString(): string {
    return `[ ${this.start.toString()} | ${this.stop.toString()}]`;
  }
}
