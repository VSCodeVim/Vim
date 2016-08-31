"use strict";

import * as vscode from "vscode";
import { Position } from "./position";
import { IMovement } from './../actions/actions';

export class Range {
  constructor(public start: Position, public stop: Position) {

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

  public getRight(count: number = 1): Range {
    return new Range(
      this.start.getRight(count),
      this.stop.getRight(count)
    );
  }
}