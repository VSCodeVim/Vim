import { Mode, ModeName } from './mode';
import { VSCodeVimCursorType } from './mode';

export class ReplaceMode extends Mode {
  public text = 'Replace';
  public cursorType = VSCodeVimCursorType.Underline;

  constructor() {
    super(ModeName.Replace);
  }
}
