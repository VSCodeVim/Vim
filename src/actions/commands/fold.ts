import * as vscode from 'vscode';
import { Position } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { BaseCommand, RegisterAction } from '../base';
import { BaseOperator } from '../operator';

type FoldDirection = 'up' | 'down' | undefined;
abstract class CommandFold extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  abstract commandName: string;
  direction: FoldDirection | undefined;

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const timesToRepeat = vimState.recordedState.count || 1;
    const args =
      this.direction !== undefined
        ? { levels: timesToRepeat, direction: this.direction }
        : undefined;
    vimState.recordedState.transformer.vscodeCommand(this.commandName, args);
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandToggleFold extends CommandFold {
  keys = ['z', 'a'];
  commandName = 'editor.toggleFold';
}

@RegisterAction
class CommandCloseFold extends CommandFold {
  keys = ['z', 'c'];
  commandName = 'editor.fold';
  override direction: FoldDirection = 'up';
}

@RegisterAction
class CommandCloseAllFolds extends CommandFold {
  keys = ['z', 'M'];
  commandName = 'editor.foldAll';
}

@RegisterAction
class CommandOpenFold extends CommandFold {
  keys = ['z', 'o'];
  commandName = 'editor.unfold';
  override direction: FoldDirection = 'down';
}

@RegisterAction
class CommandOpenAllFolds extends CommandFold {
  keys = ['z', 'R'];
  commandName = 'editor.unfoldAll';
}

@RegisterAction
class CommandCloseAllFoldsRecursively extends CommandFold {
  override modes = [Mode.Normal];
  keys = ['z', 'C'];
  commandName = 'editor.foldRecursively';
}

@RegisterAction
class CommandOpenAllFoldsRecursively extends CommandFold {
  override modes = [Mode.Normal];
  keys = ['z', 'O'];
  commandName = 'editor.unfoldRecursively';
}

@RegisterAction
class AddFold extends BaseOperator {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['z', 'f'];

  readonly commandName = 'editor.createFoldingRangeFromSelection';

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    const previousSelections = vimState.lastVisualSelection; // keep in case of Normal mode
    vimState.editor.selection = new vscode.Selection(start, end);
    await vscode.commands.executeCommand(this.commandName);
    vimState.lastVisualSelection = previousSelections;
    vimState.cursors = [new Cursor(start, start)];
    await vimState.setCurrentMode(Mode.Normal); // Vim behavior
  }
}

@RegisterAction
class RemoveFold extends BaseCommand {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['z', 'd'];
  readonly commandName = 'editor.removeManualFoldingRanges';

  override async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand(this.commandName);

    const newCursorPosition =
      vimState.currentMode === Mode.Visual ? vimState.editor.selection.start : position;
    vimState.cursors = [new Cursor(newCursorPosition, newCursorPosition)];
    await vimState.setCurrentMode(Mode.Normal); // Vim behavior
  }
}
