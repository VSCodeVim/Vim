import { configuration } from './../configuration/configuration';
import { ModeName } from './../mode/mode';
import { VimState } from './../state/vimState';
import { Notation } from '../configuration/notation';

export class BaseAction {
  /**
   * Can this action be paired with an operator (is it like w in dw)? All
   * BaseMovements can be, and some more sophisticated commands also can be.
   */
  public isMotion = false;

  /**
   * If isJump is true, then the cursor position will be added to the jump list on completion.
   */
  public isJump = false;

  public canBeRepeatedWithDot = false;

  /**
   * Modes that this action can be run in.
   */
  public modes: ModeName[];

  /**
   * The sequence of keys you use to trigger the action, or a list of such sequences.
   */
  public keys: string[] | string[][];

  public mustBeFirstKey = false;

  public isOperator = false;

  /**
   * The keys pressed at the time that this action was triggered.
   */
  public keysPressed: string[] = [];

  /**
   * Is this action valid in the current Vim state?
   */
  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (
      this.mustBeFirstKey &&
      vimState.recordedState.commandWithoutCountPrefix.length > keysPressed.length
    ) {
      return false;
    }

    return (
      this.modes.includes(vimState.currentMode) &&
      BaseAction.CompareKeypressSequence(this.keys, keysPressed)
    );
  }

  /**
   * Could the user be in the process of doing this action.
   */
  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (!this.modes.includes(vimState.currentMode)) {
      return false;
    }

    const keys2D = BaseAction.is2DArray(this.keys) ? this.keys : [this.keys];
    const keysSlice = keys2D.map(x => x.slice(0, keysPressed.length));
    if (!BaseAction.CompareKeypressSequence(keysSlice, keysPressed)) {
      return false;
    }

    if (
      this.mustBeFirstKey &&
      vimState.recordedState.commandWithoutCountPrefix.length - keysPressed.length > 0
    ) {
      return false;
    }

    return true;
  }

  public static CompareKeypressSequence(one: string[] | string[][], two: string[]): boolean {
    if (BaseAction.is2DArray(one)) {
      for (const sequence of one) {
        if (BaseAction.CompareKeypressSequence(sequence, two)) {
          return true;
        }
      }

      return false;
    }

    if (one.length !== two.length) {
      return false;
    }

    const isSingleNumber: RegExp = /^[0-9]$/;
    const isSingleAlpha: RegExp = /^[a-zA-Z]$/;

    for (let i = 0, j = 0; i < one.length; i++, j++) {
      const left = one[i],
        right = two[j];

      if (left === '<any>') {
        continue;
      }
      if (right === '<any>') {
        continue;
      }

      if (left === '<number>' && isSingleNumber.test(right)) {
        continue;
      }
      if (right === '<number>' && isSingleNumber.test(left)) {
        continue;
      }

      if (left === '<alpha>' && isSingleAlpha.test(right)) {
        continue;
      }
      if (right === '<alpha>' && isSingleAlpha.test(left)) {
        continue;
      }

      if (left === '<character>' && !Notation.IsControlKey(right)) {
        continue;
      }
      if (right === '<character>' && !Notation.IsControlKey(left)) {
        continue;
      }

      if (left === '<leader>' && right === configuration.leader) {
        continue;
      }
      if (right === '<leader>' && left === configuration.leader) {
        continue;
      }

      if (left === configuration.leader) {
        return false;
      }
      if (right === configuration.leader) {
        return false;
      }

      if (left !== right) {
        return false;
      }
    }

    return true;
  }

  public toString(): string {
    return this.keys.join('');
  }

  private static is2DArray<T>(x: any): x is T[][] {
    return Array.isArray(x[0]);
  }
}

export enum KeypressState {
  WaitingOnKeys,
  NoPossibleMatch,
}

export class Actions {
  /**
   * Every Vim action will be added here with the @RegisterAction decorator.
   */
  public static actionMap = new Map<ModeName, typeof BaseAction[]>();

  /**
   * Gets the action that should be triggered given a key
   * sequence.
   *
   * If there is a definitive action that matched, returns that action.
   *
   * If an action could potentially match if more keys were to be pressed, returns true. (e.g.
   * you pressed "g" and are about to press "g" action to make the full action "gg".)
   *
   * If no action could ever match, returns false.
   */
  public static getRelevantAction(
    keysPressed: string[],
    vimState: VimState
  ): BaseAction | KeypressState {
    let isPotentialMatch = false;

    const possibleActionsForMode = Actions.actionMap.get(vimState.currentMode) || [];
    for (const actionType of possibleActionsForMode) {
      const action = new actionType();
      if (action.doesActionApply(vimState, keysPressed)) {
        action.keysPressed = vimState.recordedState.actionKeys.slice(0);
        return action;
      }

      if (action.couldActionApply(vimState, keysPressed)) {
        isPotentialMatch = true;
      }
    }

    return isPotentialMatch ? KeypressState.WaitingOnKeys : KeypressState.NoPossibleMatch;
  }
}

export function RegisterAction(action: typeof BaseAction): void {
  const actionInstance = new action();
  for (const modeName of actionInstance.modes) {
    let actions = Actions.actionMap.get(modeName);
    if (!actions) {
      actions = [];
      Actions.actionMap.set(modeName, actions);
    }

    if (actionInstance.keys === undefined) {
      // action that can't be called directly
      continue;
    }

    actions.push(action);
  }
}
