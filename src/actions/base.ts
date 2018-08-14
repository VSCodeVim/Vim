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
    if (this.modes.indexOf(vimState.currentMode) === -1) {
      return false;
    }

    if (!BaseAction.CompareKeypressSequence(this.keys, keysPressed)) {
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

  /**
   * Could the user be in the process of doing this action.
   */
  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) {
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

  public static CompareKeypressSequence(a: string[] | string[][], b: string[]): boolean {
    if (BaseAction.is2DArray(a)) {
      for (const sequence of a) {
        if (BaseAction.CompareKeypressSequence(sequence, b)) {
          return true;
        }
      }

      return false;
    }

    if (a.length !== b.length) {
      return false;
    }

    const isSingleNumber: RegExp = /^[0-9]$/;
    const isSingleAlpha: RegExp = /^[a-zA-Z]$/;

    for (let i = 0; i < a.length; i++) {
      const left = a[i],
        right = b[i];

      if (left === right) {
        continue;
      }

      if (left === '<any>' || right === '<any>') {
        continue;
      }

      if (
        (left === '<number>' && isSingleNumber.test(right)) ||
        (right === '<number>' && isSingleNumber.test(left))
      ) {
        continue;
      }

      if (
        (left === '<alpha>' && isSingleAlpha.test(right)) ||
        (right === '<alpha>' && isSingleAlpha.test(left))
      ) {
        continue;
      }

      if (
        (left === '<character>' && !Notation.IsControlKey(right)) ||
        (right === '<character>' && !Notation.IsControlKey(left))
      ) {
        continue;
      }

      if (
        (left === '<leader>' && right === configuration.leader) ||
        (right === '<leader>' && left === configuration.leader)
      ) {
        continue;
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

    var possibleActionsForMode = Actions.actionMap.get(vimState.currentMode) || [];
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
    var actions = Actions.actionMap.get(modeName);
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
