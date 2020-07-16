import { window, QuickPickItem } from 'vscode';

import * as node from '../node';
import { VimState } from '../../state/vimState';
import { globalState } from '../../state/globalState';
import { Jump } from '../../jumps/jump';
import { Range } from '../../common/motion/range';

class JumpPickItem implements QuickPickItem {
  jump: Jump;

  label: string;
  description?: string;
  detail?: string;
  picked?: boolean;
  alwaysShow?: boolean;

  constructor(jump: Jump) {
    this.jump = jump;
    this.label = jump.fileName;
    this.detail = `jump ${jump.number} line ${jump.position.line + 1} col ${
      jump.position.character
    }`;
    try {
      this.description = jump.editor?.document.lineAt(jump.position)?.text;
    } catch (e) {
      this.description = undefined;
    }
  }
}

export class JumpsCommand extends node.CommandBase {
  async execute(vimState: VimState): Promise<void> {
    const jumpTracker = globalState.jumpTracker;
    if (jumpTracker.hasJumps) {
      const quickPickItems = jumpTracker.jumps.map((jump) => new JumpPickItem(jump));
      const item = await window.showQuickPick(quickPickItems, {
        canPickMany: false,
      });
      if (item && item.jump.editor != null) {
        window.showTextDocument(item.jump.editor.document);
        vimState.cursors = [new Range(item.jump.position, item.jump.position)];
      }
    } else {
      window.showInformationMessage('No jumps available');
    }
  }
}

export class ClearJumpsCommand extends node.CommandBase {
  async execute(): Promise<void> {
    const jumpTracker = globalState.jumpTracker;
    jumpTracker.clearJumps();
  }
}
