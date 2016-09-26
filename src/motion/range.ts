"use strict";

import * as vscode from "vscode";
import { Position } from "./position";
import { IMovement } from './../actions/actions';
import { EqualitySet } from './../misc/equalitySet';

export class Range {
  private _start: Position;
  private _stop: Position;

  constructor(start: Position, stop: Position) {
    this._start = start;
    this._stop  = stop;
  }

  /**
   * Create a range from a VSCode selection.
   */
  public static FromVSCodeSelection(e: vscode.Selection): Range {
    return new Range(
      Position.FromVSCodePosition(e.start),
      Position.FromVSCodePosition(e.end)
    );
  }

  public static *IterateRanges(set: EqualitySet<Range>): Iterable<{ start: Position; stop: Position; range: Range, i: number }> {
    let i = 0;

    for (const range of set) {
      yield {
        i: i++,
        range: range,
        start: range._start,
        stop: range._stop,
      };
    }
  }

  /**
   * Create a range from an IMovement.
   */
  public static FromIMovement(i: IMovement): Range {
    // TODO: This shows a very clear need for refactoring after multi-cursor is merged!

    return new Range(
      i.start,
      i.stop
    );
  }

  public getRight(count = 1): Range {
    return new Range(
      this._start.getRight(count),
      this._stop.getRight(count)
    );
  }

  public getDown(count = 1): Range {
    return new Range(
      this._start.getDownByCount(count),
      this._stop.getDownByCount(count),
    );
  }

  public getLeft(count = 1): Range {
    return new Range(
      this._start.getLeftByCount(count),
      this._stop.getLeftByCount(count)
    );
  }

  /**
   * Does this range contain the specified position?
   */
  public contains(position: Position): boolean {
    return this._start.isBeforeOrEqual(position) &&
           this._stop.isAfterOrEqual(position);
  }

  public getStart(): Position {
    return this._start;
  }

  public getStop(): Position {
    return this._stop;
  }

  /**
   * Returns a new range object based on this range object, but with the start
   * changed to the provided value.
   */
  public withNewStart(start: Position): Range {
    return new Range(start, this._stop);
  }

  /**
   * Returns a new range object based on this range object, but with the stop
   * changed to the provided value.
   */
  public withNewStop(stop: Position): Range {
    return new Range(this._start, stop);
  }

  public toString(): string {
    return `[ ${ this._start.toString() }, ${ this._stop.toString() } ]`;
  }
}