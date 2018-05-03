import { VimState } from '../../state/vimState';
import * as node from '../node';

export class NohlCommand extends node.CommandBase {
  protected _arguments: {};

  constructor(args: {}) {
    super();

    this._name = 'nohl';
    this._arguments = args;
  }

  get arguments(): {} {
    return this._arguments;
  }

  async execute(vimState: VimState): Promise<void> {
    vimState.globalState.hl = false;
  }
}
