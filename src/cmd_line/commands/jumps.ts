import { QuickPickItem, Range, window } from 'vscode';

import { Jump } from '../../jumps/jump';
import { globalState } from '../../state/globalState';
import { VimState } from '../../state/vimState';
import { ExCommand } from '../../vimscript/exCommand';

class JumpPickItem implements QuickPickItem {
  jump: Jump;

  label: string;
  description?: string;
  detail?: string;
  picked?: boolean;
  alwaysShow?: boolean;

  constructor(jump: Jump, idx: number) {
    this.jump = jump;
    this.label = jump.fileName;
    this.detail = `jump ${idx} line ${jump.position.line + 1} col ${jump.position.character}`;
    try {
      this.description = jump.document.lineAt(jump.position).text;
    } catch (e) {
      this.description = undefined;
    }
  }
}

export class JumpsCommand extends ExCommand {
  async execute(vimState: VimState): Promise<void> {
    const jumpTracker = globalState.jumpTracker;
    if (jumpTracker.hasJumps) {
      const quickPickItems = jumpTracker.jumps.map((jump, idx) => new JumpPickItem(jump, idx));
      const item = await window.showQuickPick(quickPickItems, {
        canPickMany: false,
      });
      if (item && item.jump.document !== undefined) {
        void window.showTextDocument(item.jump.document, {
          selection: new Range(item.jump.position, item.jump.position),
        });
      }
    } else {
      void window.showInformationMessage('No jumps available');
    }
  }
}

export class ClearJumpsCommand extends ExCommand {
  async execute(vimState: VimState): Promise<void> {
    const jumpTracker = globalState.jumpTracker;
    jumpTracker.clearJumps();
  }
}
