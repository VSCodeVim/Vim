"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';
import { Position } from './../common/motion/position';

export class VisualBlockMode extends Mode {
  public text = "Visual Block Mode";
  public cursorType = VSCodeVimCursorType.TextDecoration;
  public isVisualMode = true;

  constructor() {
    super(ModeName.VisualBlock);
  }

  public static getTopLeftPosition(start: Position, stop: Position): Position {
    return new Position(
      Math.min(start.line, stop.line),
      Math.min(start.character, stop.character)
    );
  }

  public static getBottomRightPosition(start: Position, stop: Position): Position {
    return new Position(
      Math.max(start.line, stop.line),
      Math.max(start.character, stop.character)
    );
  }
}

export enum VisualBlockInsertionType {
  /**
   * Triggered with I
   */
  Insert,

  /**
   * Triggered with A
   */
  Append,
}