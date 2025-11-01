import { commands } from 'vscode';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

export class ExploreCommand extends ExCommand {
  public override isRepeatableWithDot = false;

  async execute(vimState: VimState): Promise<void> {
    await commands.executeCommand('workbench.view.explorer');
  }
}
