import { Position } from 'vscode';
import { OnlyCommand } from '../../cmd_line/commands/only';
import { QuitCommand } from '../../cmd_line/commands/quit';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { BaseCommand, RegisterAction } from '../base';

@RegisterAction
class CommandQuit extends BaseCommand {
  modes = [Mode.Normal];
  keys = [
    ['<C-w>', 'q'],
    ['<C-w>', '<C-q>'],
    ['<C-w>', 'c'],
    ['<C-w>', '<C-c>'],
  ];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    void new QuitCommand({}).execute(vimState);
  }
}

@RegisterAction
class CommandOnly extends BaseCommand {
  modes = [Mode.Normal];
  keys = [
    ['<C-w>', 'o'],
    ['<C-w>', '<C-o>'],
  ];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    void new OnlyCommand().execute(vimState);
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
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateUp',
      args: {},
    });
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
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateLeft',
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

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.decreaseViewHeight',
      args: {},
    });
  }
}
