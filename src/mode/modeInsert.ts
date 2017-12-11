import { Mode, ModeName } from './mode';
import { VSCodeVimCursorType } from './mode';

export class InsertMode extends Mode {
  public text = 'Insert Mode';
  public cursorType = VSCodeVimCursorType.Native;

  constructor() {
    super(ModeName.Insert);
  }
}
