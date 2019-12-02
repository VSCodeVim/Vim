import { CommandBase } from '../node';
import { VimState } from '../../state/vimState';
import { reportFileInfo } from '../../util/statusBarTextUtils';

export class FileInfoCommand extends CommandBase {
  async execute(vimState: VimState): Promise<void> {
    reportFileInfo(vimState.cursors[0].start, vimState);
  }
}
