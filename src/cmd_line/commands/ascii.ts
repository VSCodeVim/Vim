import { CommandUnicodeName } from '../../actions/commands/actions';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

export class AsciiCommand extends ExCommand {
  async execute(vimState: VimState): Promise<void> {
    await new CommandUnicodeName().exec(vimState.cursorStopPosition, vimState);
  }
}
