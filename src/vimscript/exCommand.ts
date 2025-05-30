import { VimError } from '../error';
import { VimState } from '../state/vimState';
import { LineRange } from './lineRange';
import { Script } from './script';

export abstract class ExCommand {
  /**
   * If this returns true and Neovim integration is enabled, we'll send this command to Neovim.
   */
  public neovimCapable(): boolean {
    return false;
  }

  public readonly isRepeatableWithDot: boolean = false;

  abstract execute(vimState: VimState): Promise<void>;

  async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    // By default, throw E481 ("No range allowed")
    throw VimError.NoRangeAllowed();
  }

  protected script: Script | undefined;

  public setScript(script: Script) {
    this.script = script;
  }
}
