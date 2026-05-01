import { Position } from 'vscode';
import { VimError } from '../../error';
import { Mode } from '../../mode/mode';
import { Register } from '../../register/register';
import { globalState } from '../../state/globalState';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { BaseCommand, RegisterAction } from '../base';

@RegisterAction
class RecordMacro extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['q', '<macro>'],
    ['q', '"'],
  ];

  public override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const registerKey = this.keysPressed[1];
    const register = registerKey.toLocaleLowerCase();
    vimState.macro = new RecordedState();
    vimState.macro.registerKey = registerKey;
    vimState.macro.registerName = register;

    if (!Register.isValidUppercaseRegister(registerKey) || !Register.has(register)) {
      // TODO: this seems suspect - why are we not putting `vimState.macro` in the register? Why are we setting `registerName`?
      const newRegister = new RecordedState();
      newRegister.registerName = register;

      vimState.recordedState.registerName = register;
      Register.put(vimState, newRegister);
    }
  }
}

@RegisterAction
export class QuitRecordMacro extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['q'];

  public override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const macro = vimState.macro;
    if (macro === undefined) {
      return;
    }

    const existingMacro = (await Register.get(macro.registerName))?.text;
    if (existingMacro instanceof RecordedState) {
      if (Register.isValidUppercaseRegister(macro.registerKey)) {
        existingMacro.actionsRun = existingMacro.actionsRun.concat(macro.actionsRun);
      } else {
        existingMacro.actionsRun = macro.actionsRun;
      }
    }

    vimState.macro = undefined;
  }

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && vimState.macro !== undefined;
  }

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.couldActionApply(vimState, keysPressed) && vimState.macro !== undefined;
  }
}

@RegisterAction
class ExecuteLastMacro extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['@', '@'];
  override runsOnceForEachCountPrefix = true;
  override createsUndoPoint = true;
  override isJump = true;

  public override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const { lastInvokedMacro } = globalState;

    if (lastInvokedMacro) {
      vimState.recordedState.transformer.addTransformation({
        type: 'macro',
        register: lastInvokedMacro.registerName,
        replay: 'contentChange',
      });
    } else {
      StatusBar.displayError(vimState, VimError.NoPreviouslyUsedRegister());
    }
  }
}

@RegisterAction
class ExecuteMacro extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['@', '<register>'];
  override runsOnceForEachCountPrefix = true;
  override createsUndoPoint = true;

  public override runsOnceForEveryCursor(): boolean {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const register = this.keysPressed[1].toLocaleLowerCase();

    const isFilenameRegister = register === '%' || register === '#';
    if (!Register.isValidRegister(register) || isFilenameRegister) {
      StatusBar.displayError(vimState, VimError.InvalidRegisterName(register));
    }

    if (Register.has(register)) {
      vimState.recordedState.transformer.addTransformation({
        type: 'macro',
        register,
        replay: 'contentChange',
      });
    }
  }
}
