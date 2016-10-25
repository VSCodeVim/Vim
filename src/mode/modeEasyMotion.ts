"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';

export class EasyMotionMode extends Mode {
  public text = "EasyMotion Mode";
  public cursorType = VSCodeVimCursorType.Native;

   constructor() {
    super(ModeName.EasyMotionMode);
  }
}
