import { VimState } from '../../state/vimState';
import * as node from '../node';
import { window, QuickPickItem } from 'vscode';
import { TextEditor } from '../../textEditor';
import { IMark } from '../../history/historyTracker';


class MarkQuickPickItem implements QuickPickItem {
  mark: IMark;

  label: string;
  description: string;
  detail: string;
  picked = false;
  alwaysShow = false;

  constructor(mark: IMark) {
    this.mark = mark;
    this.label = mark.name;
    this.description = TextEditor.getLineAt(mark.position).text.trim();
    this.detail = `line ${mark.position.line} col ${ mark.position.character }`;
  }
}

export class MarksCommand extends node.CommandBase {
  async execute(vimState: VimState): Promise<void> {
    const quickPickItems: MarkQuickPickItem[] = vimState.historyTracker
      .getMarks()
      .map(mark => new MarkQuickPickItem(mark));

    if (quickPickItems.length > 0) {
      window.showQuickPick(quickPickItems, {
       canPickMany: false,
      }).then(async item => {
        if (item) {
          // TODO: move to item.mark.position
        }
      });
    } else {
      window.showInformationMessage('No marks set');
    }
  }
}
