import * as vscode from 'vscode';

import { Position } from 'vscode';
import { VimError } from '../../error';
import { Mode } from '../../mode/mode';
import { globalState } from '../../state/globalState';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { RegisterAction, BaseCommand } from '../base';

@RegisterAction
class GoToDeclaration extends BaseCommand {
  modes = [Mode.Normal];
  keys = [
    ['g', 'd'],
    ['g', 'D'],
  ];
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('editor.action.goToDeclaration');

    if (vimState.editor === vscode.window.activeTextEditor) {
      // We didn't switch to a different editor
      vimState.cursorStartPosition = vimState.editor.selection.start;
      vimState.cursorStopPosition = vimState.editor.selection.end;
    }
  }
}

@RegisterAction
class GoToDefinition extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['<C-]>'];
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('editor.action.revealDefinition');

    if (vimState.editor === vscode.window.activeTextEditor) {
      // We didn't switch to a different editor
      vimState.cursorStopPosition = vimState.editor.selection.start;
    }
  }
}

@RegisterAction
class OpenLink extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['g', 'x'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    void vscode.commands.executeCommand('editor.action.openLink');
  }
}

@RegisterAction
class GoBackInChangelist extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', ';'];
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const prevPos = vimState.historyTracker.prevChangeInChangeList();

    if (prevPos instanceof VimError) {
      StatusBar.displayError(vimState, prevPos);
    } else {
      vimState.cursorStopPosition = prevPos;
    }
  }
}

@RegisterAction
class GoForwardInChangelist extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', ','];
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const nextPos = vimState.historyTracker.nextChangeInChangeList();

    if (nextPos instanceof VimError) {
      StatusBar.displayError(vimState, nextPos);
    } else {
      vimState.cursorStopPosition = nextPos;
    }
  }
}

@RegisterAction
class NavigateBack extends BaseCommand {
  modes = [Mode.Normal];
  keys = [['<C-o>'], ['<C-t>']];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await globalState.jumpTracker.jumpBack(position, vimState);
  }
}

@RegisterAction
class NavigateForward extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['<C-i>'];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await globalState.jumpTracker.jumpForward(position, vimState);
  }
}
