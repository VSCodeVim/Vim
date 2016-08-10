"use strict";

import { ModeName, Mode } from './mode';
import { ModeHandler } from './modeHandler';
import { VSCodeVimCursorType } from './mode';

export class MultiCursorVisualMode extends Mode {
  public text = "Multi Cursor Visual Mode";
  public cursorType = VSCodeVimCursorType.Native;

  constructor() {
    super(ModeName.MultiCursorVisual);
  }
}
