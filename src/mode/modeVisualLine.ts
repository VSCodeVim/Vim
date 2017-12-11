import { Mode, ModeName } from './mode';
import { VSCodeVimCursorType } from './mode';

export class VisualLineMode extends Mode {
  public text = 'Visual Line Mode';
  public cursorType = VSCodeVimCursorType.Block;
  public isVisualMode = true;

  constructor() {
    super(ModeName.VisualLine);
  }
}
