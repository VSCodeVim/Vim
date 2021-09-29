import { VimState } from '../../state/vimState';
import { reportFileInfo } from '../../util/statusBarTextUtils';
import { ExCommand } from '../../vimscript/exCommand';

export class FileInfoCommand extends ExCommand {
  async execute(vimState: VimState): Promise<void> {
    reportFileInfo(vimState.cursors[0].start, vimState);
  }
}
