import { Mode, ModeName } from './mode';
import { VSCodeVimCursorType } from './mode';

export class EasyMotionMode extends Mode {
  public text = 'EasyMotion Mode';
  public cursorType = VSCodeVimCursorType.Block;

  constructor() {
    super(ModeName.EasyMotionMode);
  }
}

export class EasyMotionInputMode extends Mode {
  public text = 'EasyMotion Input';
  public cursorType = VSCodeVimCursorType.Block;

  constructor() {
    super(ModeName.EasyMotionInputMode);
  }
}
