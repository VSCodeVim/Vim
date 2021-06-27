import { window, QuickPickItem } from 'vscode';

import * as node from '../node';
import { VimState } from '../../state/vimState';
import { globalState } from '../../state/globalState';
import { Jump } from '../../jumps/jump';
import { Cursor } from '../../common/motion/cursor';

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

export class JumpsCommand extends node.CommandBase {
  public override readonly acceptsRange = false;

  async execute(vimState: VimState): Promise<void> {
    const jumpTracker = globalState.jumpTracker;
    if (jumpTracker.hasJumps) {
      const quickPickItems = jumpTracker.jumps.map((jump, idx) => new JumpPickItem(jump, idx));
      const item = await window.showQuickPick(quickPickItems, {
        canPickMany: false,
      });
      if (item && item.jump.document !== undefined) {
        window.showTextDocument(item.jump.document);
        vimState.cursors = [new Cursor(item.jump.position, item.jump.position)];
      }
    } else {
      window.showInformationMessage('No jumps available');
    }
  }
}

export class ClearJumpsCommand extends node.CommandBase {
  public override readonly acceptsRange = false;

  async execute(vimState: VimState): Promise<void> {
    const jumpTracker = globalState.jumpTracker;
    jumpTracker.clearJumps();
  }
}
