import * as vscode from 'vscode';

import { configuration } from '../../configuration/configuration';
import { Mode } from '../../mode/mode';
import { Notation } from '../..//configuration/notation';
import { VimState } from '../../state/vimState';
import { Position } from 'vscode';
import { RegisterAction } from '../base';
import { BaseMovement, IMovement, failedMovement } from '../baseMotion';
import { findHelper, MoveRepeat, MoveRepeatReversed } from '../motion';

/**
 * State of Clever-f
 */
let posF = [-1, -1];
let beforeCleverFAction: string;
let previousMode: Mode;

/**
 * CleverF f command
 */
@RegisterAction
class ActionCleverForwardCommand extends BaseMovement {
  override modes = [Mode.Normal];
  keys = ['f'];

  // This command is Not Enabled when vim.clever-F is false.
  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.cleverF && super.doesActionApply(vimState, keysPressed);
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count ||= 1;
    // First if is repeat "f" movement. Ex) "f","a","f" called
    // Second else if is repeat "F" movement.Ex) "F","a","f" called
    // Third else is first "f" command. Ex) "f","a" called
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
      previousMode = vimState.currentMode;
      await vimState.setCurrentMode(Mode.CleverFForwardMode);
      beforeCleverFAction = 'f';
      return position;
    }
  }
}

/**
 * CleverF F command
 */
@RegisterAction
class ActionCleverFBackwardCommand extends BaseMovement {
  override modes = [Mode.Normal];
  keys = ['F'];

  // This command is Not Enabled when vim.clever-F is false.
  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return configuration.cleverF && super.doesActionApply(vimState, keysPressed);
  }

  public override async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    count ||= 1;
    // First if is repeat "F" movement. Ex) "F","a","F" called
    // Second else if is repeat "f" movement.Ex) "f","a","F" called
    // Third else is first "F" command. Ex) "F","a" called
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
      previousMode = vimState.currentMode;
      await vimState.setCurrentMode(Mode.CleverFBackwardMode);
      beforeCleverFAction = 'F';
      return position;
    }
  }
}

/**
 * Compare Array Elements is Equal
 */
const arrayEqual = (a: number[], b: number[]): boolean => {
  if (!Array.isArray(a)) return false;
  if (!Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0, n = a.length; i < n; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

/**
 *  When change cleverFForwardMode by "f" command, this class is called
 */
@RegisterAction
class MoveCleverFFindForward extends BaseMovement {
  override modes = [Mode.CleverFForwardMode];
  keys = ['<character>'];
  public override async execActionWithCount(
    position: vscode.Position,
    vimState: VimState,
    count: number
  ): Promise<vscode.Position | IMovement> {
    // Reset Mode
    await vimState.setCurrentMode(previousMode);

    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[0]);
    let result = findHelper(vimState, position, toFind, count, 'forward');

    // To repeat this command
    vimState.lastSemicolonRepeatableMovement = new MoveCleverFFindForward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveCleverFFindBackward(this.keysPressed, true);

    if (!result) {
      return failedMovement(vimState);
    }
    if (vimState.recordedState.operator) {
      result = result.getRight();
    }
    // Mark a position to repeat this command
    posF = [result.line, result.character];

    return result;
  }
}

/**
 *  When change cleverFBackwardMode by "F" command, this class is called
 */
@RegisterAction
class MoveCleverFFindBackward extends BaseMovement {
  override modes = [Mode.CleverFBackwardMode];
  keys = ['<character>'];
  public override async execActionWithCount(
    position: vscode.Position,
    vimState: VimState,
    count: number
  ): Promise<vscode.Position | IMovement> {
    // Reset Mode
    await vimState.setCurrentMode(previousMode);

    count ||= 1;
    const toFind = Notation.ToControlCharacter(this.keysPressed[0]);
    let result = findHelper(vimState, position, toFind, count, 'backward');

    // To repeat this command
    vimState.lastSemicolonRepeatableMovement = new MoveCleverFFindBackward(this.keysPressed, true);
    vimState.lastCommaRepeatableMovement = new MoveCleverFFindForward(this.keysPressed, true);

    if (!result) {
      return failedMovement(vimState);
    }
    if (vimState.recordedState.operator) {
      result = result.getRight();
    }
    // Mark a position to repeat this command
    posF = [result.line, result.character];
    return result;
  }
}
