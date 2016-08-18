"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';

export class ReplaceMode extends Mode {
  public text = "Replace";
  public cursorType = VSCodeVimCursorType.TextDecoration;

  constructor() {
    super(ModeName.Replace);
  }
}
