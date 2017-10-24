'use strict';

import * as vscode from 'vscode';
import { Position, PositionDiff } from './position';

export class Range {
  private _start: Position;
  private _stop: Position;

  public get start(): Position {
    return this._start;
  }

  public get stop(): Position {
    return this._stop;
  }

  constructor(start: Position, stop: Position) {
    this._start = start;
    this._stop = stop;
  }

  /**
   * Create a range from a VSCode selection.
   */
  public static FromVSCodeSelection(e: vscode.Selection): Range {
    return new Range(Position.FromVSCodePosition(e.start), Position.FromVSCodePosition(e.end));
  }

  public static *IterateRanges(
    list: Range[]
  ): Iterable<{ start: Position; stop: Position; range: Range; i: number }> {
    for (let i = 0; i < list.length; i++) {
      yield {
        i,
        range: list[i],
        start: list[i]._start,
        stop: list[i]._stop,
      };
    }
  }

  public getRight(count = 1): Range {
    return new Range(this._start.getRight(count), this._stop.getRight(count));
  }

  public getDown(count = 1): Range {
    return new Range(this._start.getDownByCount(count), this._stop.getDownByCount(count));
  }

  public equals(other: Range): boolean {
    return this._start.isEqual(other._start) && this._stop.isEqual(other._stop);
  }

  /**
   * Returns a new Range which is the same as this Range, but with the provided
   * stop value.
   */
  public withNewStop(stop: Position): Range {
    return new Range(this._start, stop);
  }

  /**
   * Returns a new Range which is the same as this Range, but with the provided
   * start value.
   */
  public withNewStart(start: Position): Range {
    return new Range(start, this._stop);
  }

  public toString(): string {
    return `[ ${this.start.toString()} | ${this.stop.toString()}]`;
  }

  public overlaps(other: Range): boolean {
    return this.start.isBefore(other.stop) && other.start.isBefore(this.stop);
  }

  public add(diff: PositionDiff): Range {
    return new Range(this.start.add(diff), this.stop.add(diff));
  }
}
