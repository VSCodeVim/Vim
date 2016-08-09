"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';

export class InsertVisualBlockMode extends Mode {
  public text = "Visual Block Insert Mode";
  public cursorType = VSCodeVimCursorType.Native;
  public isVisualMode = true;

  constructor() {
    super(ModeName.VisualBlockInsertMode);
  }
}
