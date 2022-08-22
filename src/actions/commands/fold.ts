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

abstract class FoldOperator extends BaseOperator {
  public modes = [Mode.Normal];
  abstract commandName: string;

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    const previousSelections = vimState.editor.selections;
    vimState.editor.selection = new vscode.Selection(start, end);
    await vscode.commands.executeCommand(this.commandName);
    await new CommandCloseFold().exec(start, vimState);
    vimState.editor.selections = previousSelections;
    vimState.cursors = [new Cursor(start, start)];
  }
}

@RegisterAction
class AddFold extends FoldOperator {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['z', 'f'];
  commandName = 'editor.createFoldingRangeFromSelection';
}

@RegisterAction
class RemoveFold extends FoldOperator {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['z', 'd'];
  commandName = 'editor.removeManualFoldingRanges';
}
