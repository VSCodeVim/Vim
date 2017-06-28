
import { ModeName, Mode } from './mode';
import { ModeHandler } from './modeHandler';
import { VSCodeVimCursorType } from './mode';

export class NormalMode extends Mode {
  private _modeHandler: ModeHandler;

  public text = 'Normal Mode';
  public cursorType = VSCodeVimCursorType.Block;

  constructor(modeHandler: ModeHandler) {
    super(ModeName.Normal);

    this._modeHandler = modeHandler;
  }
}
