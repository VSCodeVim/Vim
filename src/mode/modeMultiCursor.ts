"use strict";

import { ModeName, Mode } from './mode';
import { ModeHandler } from './modeHandler';
import { VSCodeVimCursorType } from './mode';

export class MultiCursorMode extends Mode {
  public text = "Multi Cursor Mode";
  public cursorType = VSCodeVimCursorType.Native;

  constructor() {
    super(ModeName.MultiCursor);
  }
}
