import { Mode, ModeName } from './mode';
import { VSCodeVimCursorType } from './mode';

export class SurroundInputMode extends Mode {
  public text = 'Surround Input Mode';
  public cursorType = VSCodeVimCursorType.Block;

  constructor() {
    super(ModeName.SurroundInputMode);
  }
}
