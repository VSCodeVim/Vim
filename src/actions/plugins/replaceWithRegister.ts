import * as vscode from 'vscode';
import { configuration } from '../../configuration/configuration';
import { Mode } from '../../mode/mode';
import { Register, RegisterMode } from '../../register/register';
import { VimState } from '../../state/vimState';
import { BaseOperator } from '../operator';
import { RegisterAction } from './../base';
import { Position } from 'vscode';
import { Range } from '../../common/motion/range';
import { PutCommand } from '../commands/put';

@RegisterAction
export class ReplaceOperator extends BaseOperator {
  public keys = ['g', 'r'];
  public modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.replaceWithRegister && super.doesActionApply(vimState, keysPressed);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.replaceWithRegister && super.doesActionApply(vimState, keysPressed);
  }

  public async run(vimState: VimState, start: Position, end: Position): Promise<void> {
    const replaceRange =
      vimState.currentRegisterMode === RegisterMode.LineWise
        ? new Range(start.getLineBegin(), end.getLineEndIncludingEOL())
        : new Range(start, end.getRight());

    const register = await Register.get(vimState);
    if (register) {
      const isMultiCursor = vimState.isMultiCursor && register.text instanceof Array;
      const replaceWith = isMultiCursor
        ? await PutCommand.getText(vimState, register, this.multicursorIndex)
        : (register.text as string);

      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: replaceWith,
        range: replaceRange,
      });
    }
    await vimState.setCurrentMode(Mode.Normal);
    return;
  }
}
