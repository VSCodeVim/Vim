"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';

export class SurroundMode extends Mode {
  public text = "Surround Mode";
  public cursorType = VSCodeVimCursorType.Native;

   constructor() {
    super(ModeName.SurroundMode);
  }
}

export enum SurroundType {
  /**
   * Triggered with c
   */
  ChangeSurround,

  /**
   * Triggered with d
   */
  DeleteSurround,

  /**
   * Triggered with y
   */
  YouSurround,
}
