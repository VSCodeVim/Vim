import * as vscode from 'vscode';

import { configuration } from '../../configuration/configuration';
import { Mode } from '../../mode/mode';
import { Notation } from '../..//configuration/notation';
import { VimState } from '../../state/vimState';
import { Position } from 'vscode';
import { RegisterAction } from '../base';
import { BaseMovement, IMovement, failedMovement } from '../baseMotion';
import { findHelper, MoveRepeat, MoveRepeatReversed } from '../motion';

let posF = [-1, -1];
let beforeCleverFAction = '';

@RegisterAction
class ActionCleverForwardCommand extends BaseMovement {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['f'];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.cleverF && super.doesActionApply(vimState, keysPressed);
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count ||= 1;
    if (arrayEqual(posF, [position.line, position.character]) && beforeCleverFAction === 'f') {
      const action = new MoveRepeat([';'], true);
      return action.execActionWithCount(position, vimState, count);
    } else if (
      arrayEqual(posF, [position.line, position.character]) &&
      beforeCleverFAction === 'F'
    ) {
      const action = new MoveRepeatReversed([','], true);
      beforeCleverFAction = 'f';
      return action.execActionWithCount(position, vimState, count);
    } else {
      await vimState.setCurrentMode(Mode.CleverFForwardMode);
      beforeCleverFAction = 'f';
      return position;
    }
  }
}

@RegisterAction
class ActionCleverFBackwardCommand extends BaseMovement {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['F'];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.cleverF && super.doesActionApply(vimState, keysPressed);
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count ||= 1;
    try {
      if (arrayEqual(posF, [position.line, position.character]) && beforeCleverFAction === 'F') {
        const action = new MoveRepeat([';'], true);
        return action.execActionWithCount(position, vimState, count);
      } else if (
        arrayEqual(posF, [position.line, position.character]) &&
        beforeCleverFAction === 'f'
      ) {
        const action = new MoveRepeatReversed([','], true);
        beforeCleverFAction = 'F';
        return action.execActionWithCount(position, vimState, count);
      } else {
        await vimState.setCurrentMode(Mode.CleverFBackwardMode);
        beforeCleverFAction = 'F';
        return position;
      }
    } finally {
      console.log('test');
    }
  }
}

const arrayEqual = (a: number[], b: number[]): boolean => {
  if (!Array.isArray(a)) return false;
  if (!Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0, n = a.length; i < n; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

@RegisterAction
class MoveCleverFFindForward extends BaseMovement {
  override modes = [Mode.CleverFForwardMode];
  keys = ['<character>'];
  public override async execActionWithCount(
    position: vscode.Position,
    vimState: VimState,
    count: number
  ): Promise<vscode.Position | IMovement> {
    await vimState.setCurrentMode(Mode.Normal);
    posF = [position.line, position.character];
    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[0]);
    let result = findHelper(vimState, position, toFind, count, 'forward');
    vimState.lastSemicolonRepeatableMovement = new MoveCleverFFindForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveCleverFFindBackward(this.keysPressed, true);
    if (!result) {
      return failedMovement(vimState);
    }
    if (vimState.recordedState.operator) {
      result = result.getRight();
    }
    posF = [result.line, result.character];
    return result;
  }
}

@RegisterAction
class MoveCleverFFindBackward extends BaseMovement {
  override modes = [Mode.CleverFBackwardMode];
  keys = ['<character>'];
  public override async execActionWithCount(
    position: vscode.Position,
    vimState: VimState,
    count: number
  ): Promise<vscode.Position | IMovement> {
    await vimState.setCurrentMode(Mode.Normal);
    posF = [position.line, position.character];
    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[0]);
    let result = findHelper(vimState, position, toFind, count, 'backward');
    vimState.lastSemicolonRepeatableMovement = new MoveCleverFFindBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveCleverFFindForward(this.keysPressed, true);
    if (!result) {
      return failedMovement(vimState);
    }
    if (vimState.recordedState.operator) {
      result = result.getRight();
    }
    posF = [result.line, result.character];
    return result;
  }
}
