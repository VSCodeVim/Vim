import { CommandBase } from '../node';
import { VimState } from '../../state/vimState';
import { ReportFileInfo } from '../../util/statusBarTextUtils';

export class FileInfoCommand extends CommandBase {
  async execute(vimState: VimState): Promise<void> {
    ReportFileInfo(vimState.cursors[0].start, vimState);
  }
}
