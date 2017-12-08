import { ModeName, Mode } from './mode';
import { ModeHandler } from './modeHandler';
import { VSCodeVimCursorType } from './mode';

export class NormalMode extends Mode {
  public text = 'Normal Mode';
  public cursorType = VSCodeVimCursorType.Block;

  constructor() {
    super(ModeName.Normal);
  }
}
