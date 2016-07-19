"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';
import { Position } from './../motion/position';

export class InsertVisualBlockMode extends Mode {
  public text = "Visual Block Insert Mode";
  public cursorType = VSCodeVimCursorType.TextDecoration;
  public isVisualMode = true;

  constructor() {
    super(ModeName.VisualBlockInsertMode);
  }
}
