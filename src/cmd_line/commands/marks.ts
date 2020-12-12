import { window, QuickPickItem } from 'vscode';

import * as node from '../node';
import { VimState } from '../../state/vimState';
import { IMark } from '../../history/historyTracker';
import { Range } from '../../common/motion/range';

class MarkQuickPickItem implements QuickPickItem {
  mark: IMark;

  label: string;
  description: string;
  detail: string;
  picked = false;
  alwaysShow = false;

  constructor(vimState: VimState, mark: IMark) {
    this.mark = mark;
    this.label = mark.name;
    this.description = vimState.document.lineAt(mark.position).text.trim();
    this.detail = `line ${mark.position.line} col ${mark.position.character}`;
  }
}

export class MarksCommand extends node.CommandBase {
  private marksFilter?: string[];

  constructor(marksFilter?: string[]) {
    super();
    this.marksFilter = marksFilter;
  }

  async execute(vimState: VimState): Promise<void> {
    const quickPickItems: MarkQuickPickItem[] = vimState.historyTracker
      .getMarks()
      .filter((mark) => {
        return !this.marksFilter || this.marksFilter.includes(mark.name);
      })
      .map((mark) => new MarkQuickPickItem(vimState, mark));

    if (quickPickItems.length > 0) {
      const item = await window.showQuickPick(quickPickItems, {
        canPickMany: false,
      });
      if (item) {
        vimState.cursors = [new Range(item.mark.position, item.mark.position)];
      }
    } else {
      window.showInformationMessage('No marks set');
    }
  }
}
