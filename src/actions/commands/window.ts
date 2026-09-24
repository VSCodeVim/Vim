import { Position } from 'vscode';
import { OnlyCommand } from '../../cmd_line/commands/only';
import { QuitCommand } from '../../cmd_line/commands/quit';
import { TabCommand, TabCommandType } from '../../cmd_line/commands/tab';
import { WriteQuitCommand } from '../../cmd_line/commands/writequit';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { BaseCommand, RegisterAction } from '../base';

@RegisterAction
class Quit extends BaseCommand {
  modes = [Mode.Normal];
  keys = [
    ['<C-w>', 'q'],
    ['<C-w>', '<C-q>'],
    ['<C-w>', 'c'],
    ['<C-w>', '<C-c>'],
  ];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    void new QuitCommand({}).execute(vimState);
  }
}

@RegisterAction
class WriteQuit extends BaseCommand {
  modes = [Mode.Normal];
  keys = [['Z', 'Z']];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await new WriteQuitCommand({ bang: false, opt: [] }).execute(vimState);
  }
}

@RegisterAction
class ForceQuit extends BaseCommand {
  modes = [Mode.Normal];
  keys = [['Z', 'Q']];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await new QuitCommand({ bang: true }).execute(vimState);
  }
}

@RegisterAction
class Only extends BaseCommand {
  modes = [Mode.Normal];
  keys = [
    ['<C-w>', 'o'],
    ['<C-w>', '<C-o>'],
  ];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    void new OnlyCommand().execute(vimState);
  }
}

@RegisterAction
class MoveToLeftPane extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', 'h'],
    ['<C-w>', '<left>'],
    ['<C-w>', '<C-h>'],
  ];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateLeft',
      args: {},
    });
  }
}

@RegisterAction
class MoveToRightPane extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', 'l'],
    ['<C-w>', '<right>'],
    ['<C-w>', '<C-l>'],
  ];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateRight',
      args: {},
    });
  }
}

@RegisterAction
class MoveToLowerPane extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', 'j'],
    ['<C-w>', '<down>'],
    ['<C-w>', '<C-j>'],
  ];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateDown',
      args: {},
    });
  }
}

@RegisterAction
class MoveToUpperPane extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', 'k'],
    ['<C-w>', '<up>'],
    ['<C-w>', '<C-k>'],
  ];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateUp',
      args: {},
    });
  }
}

@RegisterAction
class MovePaneLeft extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-w>', 'H']];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.moveActiveEditorGroupLeft',
      args: {},
    });
  }
}

@RegisterAction
class MovePaneRight extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-w>', 'L']];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.moveActiveEditorGroupRight',
      args: {},
    });
  }
}

@RegisterAction
class MovePaneDown extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-w>', 'J']];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.moveActiveEditorGroupDown',
      args: {},
    });
  }
}

@RegisterAction
class MovePaneUp extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-w>', 'K']];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.moveActiveEditorGroupUp',
      args: {},
    });
  }
}

@RegisterAction
class CycleThroughPanes extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', '<C-w>'],
    ['<C-w>', 'w'],
  ];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateEditorGroups',
      args: {},
    });
  }
}

@RegisterAction
class VerticalSplit extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', 'v'],
    ['<C-w>', '<C-v>'],
  ];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.splitEditor',
      args: undefined,
    });
  }
}

@RegisterAction
class OrthogonalSplit extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', 's'],
    ['<C-w>', '<C-s>'],
  ];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.splitEditorOrthogonal',
      args: undefined,
    });
  }
}

@RegisterAction
class EvenPaneWidths extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['<C-w>', '='];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.evenEditorWidths',
      args: {},
    });
  }
}

@RegisterAction
class IncreasePaneWidth extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['<C-w>', '>'];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.increaseViewWidth',
      args: {},
    });
  }
}

@RegisterAction
class DecreasePaneWidth extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['<C-w>', '<'];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.decreaseViewWidth',
      args: {},
    });
  }
}

@RegisterAction
class IncreasePaneHeight extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['<C-w>', '+'];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.increaseViewHeight',
      args: {},
    });
  }
}

@RegisterAction
class DecreasePaneHeight extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['<C-w>', '-'];
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.decreaseViewHeight',
      args: {},
    });
  }
}

@RegisterAction
class NextTab extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['g', 't'], ['<C-pagedown>']];
  override runsOnceForEachCountPrefix = false;
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    // gt behaves differently than gT and goes to an absolute index tab
    // (1-based), it does NOT iterate over next tabs
    if (vimState.recordedState.count > 0) {
      void new TabCommand({
        type: TabCommandType.Edit,
        buf: vimState.recordedState.count,
      }).execute(vimState);
    } else {
      void new TabCommand({
        type: TabCommandType.Next,
        bang: false,
      }).execute(vimState);
    }
  }
}

@RegisterAction
class PreviousTab extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['g', 'T'], ['<C-pageup>']];
  override runsOnceForEachCountPrefix = true; // Yes, this is different from `{count}gt`
  override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    void new TabCommand({
      type: TabCommandType.Previous,
      bang: false,
    }).execute(vimState);
  }
}
