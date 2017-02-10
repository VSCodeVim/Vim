"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';

export class SurroundInputMode extends Mode {
  public text = "Surround Input Mode";
  public cursorType = VSCodeVimCursorType.Native;

   constructor() {
    super(ModeName.SurroundInputMode);
  }
}
