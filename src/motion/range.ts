"use strict";

import * as vscode from "vscode";
import { Position } from "./position";
import { IMovement } from './../actions/actions';

export class Range {
  public start: Position;
  public stop: Position;

  constructor(start: Position, stop: Position) {
    this.start = start;
    this.stop  = stop;
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

  public static *IterateRanges(list: Range[]): Iterable<{ start: Position; stop: Position; range: Range, i: number }> {
    for (let i = 0; i < list.length; i++) {
      yield {
        i,
        range: list[i],
        start: list[i].start,
        stop: list[i].stop,
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
      this.start.getRight(count),
      this.stop.getRight(count)
    );
  }

  public getDown(count = 1): Range {
    return new Range(
      this.start.getDownByCount(count),
      this.stop.getDownByCount(count),
    );
  }

  public equals(other: Range): boolean {
    return this.start.isEqual(other.start) &&
           this.stop.isEqual(other.stop);
  }
}