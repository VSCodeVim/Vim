import { VimState } from './../mode/modeHandler';
import { ModeName } from './../mode/mode';
import { Configuration } from './../configuration/configuration';

const is2DArray = function<T>(x: any): x is T[][] {
  return Array.isArray(x[0]);
};

export let compareKeypressSequence = function(one: string[] | string[][], two: string[]): boolean {
  if (is2DArray(one)) {
    for (const sequence of one) {
      if (compareKeypressSequence(sequence, two)) {
        return true;
      }
    }

    return false;
  }

  if (one.length !== two.length) {
    return false;
  }

  const isSingleNumber = (s: string): boolean => {
    return s.length === 1 && '1234567890'.indexOf(s) > -1;
  };

  const containsControlKey = (s: string): boolean => {
    // We count anything starting with < (e.g. <c-u>) as a control key, but we
    // exclude the first 3 because it's more convenient to do so.

    return (
      s.toUpperCase() !== '<BS>' &&
      s.toUpperCase() !== '<SHIFT+BS>' &&
      s.toUpperCase() !== '<TAB>' &&
      s.startsWith('<') &&
      s.length > 1
    );
  };

  for (let i = 0, j = 0; i < one.length; i++, j++) {
    const left = one[i],
      right = two[j];

    if (left === '<any>') {
      continue;
    }
    if (right === '<any>') {
      continue;
    }

    if (left === '<number>' && isSingleNumber(right)) {
      continue;
    }
    if (right === '<number>' && isSingleNumber(left)) {
      continue;
    }

    if (left === '<character>' && !containsControlKey(right)) {
      continue;
    }
    if (right === '<character>' && !containsControlKey(left)) {
      continue;
    }

    if (left === '<leader>' && right === Configuration.leader) {
      continue;
    }
    if (right === '<leader>' && left === Configuration.leader) {
      continue;
    }

    if (left === Configuration.leader) {
      return false;
    }
    if (right === Configuration.leader) {
      return false;
    }

    if (left !== right) {
      return false;
    }
  }

  return true;
};

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
    if (!compareKeypressSequence(this.keys, keysPressed)) {
      return false;
    }
    if (
      this.mustBeFirstKey &&
      vimState.recordedState.numberOfKeysInCommandWithoutCountPrefix - keysPressed.length > 0
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
    if (!compareKeypressSequence(this.keys.slice(0, keysPressed.length), keysPressed)) {
      return false;
    }
    if (
      this.mustBeFirstKey &&
      vimState.recordedState.numberOfKeysInCommandWithoutCountPrefix - keysPressed.length > 0
    ) {
      return false;
    }

    return true;
  }

  public toString(): string {
    return this.keys.join('');
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
  public static allActions: { type: typeof BaseAction; action: BaseAction }[] = [];

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
    let couldPotentiallyHaveMatch = false;

    for (const thing of Actions.allActions) {
      const { type, action } = thing!;

      // It's an action that can't be called directly.
      if (action.keys === undefined) {
        continue;
      }
      if (action.doesActionApply(vimState, keysPressed)) {
        const result = new type();

        result.keysPressed = vimState.recordedState.actionKeys.slice(0);

        return result;
      }

      if (action.couldActionApply(vimState, keysPressed)) {
        couldPotentiallyHaveMatch = true;
      }
    }

    return couldPotentiallyHaveMatch ? KeypressState.WaitingOnKeys : KeypressState.NoPossibleMatch;
  }
}

export function RegisterAction(action: typeof BaseAction): void {
  Actions.allActions.push({ type: action, action: new action() });
}
