import { window } from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

export class ShCommand extends ExCommand {
  public override isRepeatableWithDot = false;

  async execute(vimState: VimState): Promise<void> {
    window.createTerminal().show();
  }
}
