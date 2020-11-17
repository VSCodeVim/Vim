import * as vscode from 'vscode';
import { Position } from 'vscode';

export class Range {
  public readonly start: Position;
  public readonly stop: Position;

  constructor(start: Position, stop: Position) {
    this.start = start;
    this.stop = stop;
  }

  public isValid(textEditor: vscode.TextEditor) {
    return this.start.isValid(textEditor) && this.stop.isValid(textEditor);
  }

  /**
   * Create a range from a VSCode selection.
   */
  public static FromVSCodeSelection(sel: vscode.Selection): Range {
    return new Range(sel.start, sel.end);
  }

  public equals(other: Range): boolean {
    return this.start.isEqual(other.start) && this.stop.isEqual(other.stop);
  }

  /**
   * Returns a new Range which is the same as this Range, but with the provided stop value.
   */
  public withNewStop(stop: Position): Range {
    return new Range(this.start, stop);
  }

  /**
   * Returns a new Range which is the same as this Range, but with the provided start value.
   */
  public withNewStart(start: Position): Range {
    return new Range(start, this.stop);
  }

  public toString(): string {
    return `[ ${this.start.toString()} | ${this.stop.toString()}]`;
  }

  public overlaps(other: Range): boolean {
    return this.start.isBefore(other.stop) && other.start.isBefore(this.stop);
  }
}
