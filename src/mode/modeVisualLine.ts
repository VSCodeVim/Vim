"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';

export class VisualLineMode extends Mode {
  public text = "Visual Line Mode";
  public cursorType = VSCodeVimCursorType.TextDecoration;
  public isVisualMode = true;

  constructor() {
    super(ModeName.VisualLine);
  }
}
