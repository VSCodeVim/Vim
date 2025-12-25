import { Position, Selection, TextDocument } from 'vscode';

export class Cursor {
  public readonly start: Position;
  public readonly stop: Position;

  constructor(start: Position, stop: Position) {
    this.start = start;
    this.stop = stop;
  }

  public static atPosition(position: Position): Cursor {
    return new Cursor(position, position);
  }

  /**
   * Create a Cursor from a VSCode selection.
   */
  public static fromSelection(sel: Selection): Cursor {
    return new Cursor(sel.anchor, sel.active);
  }

  public isValid(document: TextDocument) {
    return this.start.isValid(document) && this.stop.isValid(document);
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
    return `[${this.start.toString()} | ${this.stop.toString()}]`;
  }

  public validate(document: TextDocument): Cursor {
    return new Cursor(document.validatePosition(this.start), document.validatePosition(this.stop));
  }
}
