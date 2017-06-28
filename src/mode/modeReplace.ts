('use strict');

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';

export class ReplaceMode extends Mode {
  public text = 'Replace';
  public cursorType = VSCodeVimCursorType.Underline;

  constructor() {
    super(ModeName.Replace);
  }
}
