import { Position } from 'vscode';
import { Cursor } from '../common/motion/cursor';
import { Notation } from '../configuration/notation';
import { ActionType, IBaseAction } from './types';
import { isTextTransformation } from '../transformations/transformations';
import { configuration } from './../configuration/configuration';
import { Mode } from './../mode/mode';
import { VimState } from './../state/vimState';

export abstract class BaseAction implements IBaseAction {
  abstract readonly actionType: ActionType;

  public name = '';

  /**
   * If true, the cursor position will be added to the jump list on completion.
   */
  public readonly isJump: boolean = false;

  /**
   * If true, the action will create an undo point.
   */
  public readonly createsUndoPoint: boolean = false;

  /**
   * If this is being run in multi cursor mode, the index of the cursor
   * this action is being applied to.
   */
  public multicursorIndex: number | undefined;

  /**
   * Whether we should change `vimState.desiredColumn`
   */
  public readonly preservesDesiredColumn: boolean = false;

  /**
   * Modes that this action can be run in.
   */
  public abstract readonly modes: readonly Mode[];

  /**
   * The sequence of keys you use to trigger the action, or a list of such sequences.
   */
  public abstract readonly keys: readonly string[] | readonly string[][];

  /**
   * The keys pressed at the time that this action was triggered.
   */
  // TODO: make readonly
  public keysPressed: string[] = [];

  private static readonly isSingleNumber: RegExp = /^[0-9]$/;
  private static readonly isSingleAlpha: RegExp = /^[a-zA-Z]$/;

  /**
   * Is this action valid in the current Vim state?
   */
  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (
      vimState.currentModeIncludingPseudoModes === Mode.OperatorPendingMode &&
      this.actionType === 'command'
    ) {
      return false;
    }

    return (
      this.modes.includes(vimState.currentMode) &&
      BaseAction.CompareKeypressSequence(this.keys, keysPressed)
    );
  }

  /**
   * What is the applicability of this action in the current Vim state?
   */
  public getActionApplicability(vimState: VimState, keysPressed: string[]): ActionApplicability {
    if (this.doesActionApply(vimState, keysPressed)) {
      return ActionApplicability.DoesApply;
    } else if (this.couldActionApply(vimState, keysPressed)) {
      return ActionApplicability.CouldApply;
    } else {
      return ActionApplicability.CannotApply;
    }
  }

  /**
   * Could the user be in the process of doing this action.
   */
  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (
      vimState.currentModeIncludingPseudoModes === Mode.OperatorPendingMode &&
      this.actionType === 'command'
    ) {
      return false;
    }

    if (!this.modes.includes(vimState.currentMode)) {
      return false;
    }

    const keys2D = BaseAction.is2DArray(this.keys) ? this.keys : [this.keys];
    const keysSlice = keys2D.map((x) => x.slice(0, keysPressed.length));
    if (!BaseAction.CompareKeypressSequence(keysSlice, keysPressed)) {
      return false;
    }

    return true;
  }

  public static CompareKeypressSequence(
    one: readonly string[] | readonly string[][],
    two: readonly string[],
  ): boolean {
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

    for (let i = 0, j = 0; i < one.length; i++, j++) {
      const left = one[i];
      const right = two[j];

      if (left === right && right !== configuration.leader) {
        continue;
      } else if (left === '<any>') {
        continue;
      } else if (left === '<leader>' && right === configuration.leader) {
        continue;
      } else if (left === '<number>' && this.isSingleNumber.test(right)) {
        continue;
      } else if (left === '<alpha>' && this.isSingleAlpha.test(right)) {
        continue;
      } else if (left === '<character>' && !Notation.IsControlKey(right)) {
        continue;
      } else {
        return false;
      }
    }

    return true;
  }

  public toString(): string {
    return this.keys.join('');
  }

  private static is2DArray<T>(x: readonly T[] | readonly T[][]): x is readonly T[][] {
    return Array.isArray(x[0]);
  }
}

/**
 * A command is something like <Esc>, :, v, i, etc.
 */
export abstract class BaseCommand extends BaseAction {
  override actionType: ActionType = 'command' as const;

  /**
   * If isCompleteAction is true, then triggering this command is a complete action -
   * that means that we'll go and try to run it.
   */
  public isCompleteAction = true;

  /**
   * In multi-cursor mode, do we run this command for every cursor, or just once?
   */
  public runsOnceForEveryCursor(): boolean {
    return true;
  }

  /**
   * If true, exec() will get called N times where N is the count.
   *
   * If false, exec() will only be called once, and you are expected to
   * handle count prefixes (e.g. the 3 in 3w) yourself.
   */
  public readonly runsOnceForEachCountPrefix: boolean = false;

  /**
   * Run the command a single time.
   */
  public async exec(position: Position, vimState: VimState): Promise<void> {
    throw new Error('Not implemented!');
  }

  /**
   * Run the command the number of times VimState wants us to.
   */
  public async execCount(position: Position, vimState: VimState): Promise<void> {
    const timesToRepeat = this.runsOnceForEachCountPrefix ? vimState.recordedState.count || 1 : 1;

    if (!this.runsOnceForEveryCursor()) {
      for (let i = 0; i < timesToRepeat; i++) {
        await this.exec(position, vimState);
      }

      for (const transformation of vimState.recordedState.transformer.transformations) {
        if (isTextTransformation(transformation) && transformation.cursorIndex === undefined) {
          transformation.cursorIndex = 0;
        }
      }

      return;
    }

    const resultingCursors: Cursor[] = [];

    const cursorsToIterateOver = vimState.cursors
      .map((x) => new Cursor(x.start, x.stop))
      .sort((a, b) =>
        a.start.line > b.start.line ||
        (a.start.line === b.start.line && a.start.character > b.start.character)
          ? 1
          : -1,
      );

    let cursorIndex = 0;
    for (const { start, stop } of cursorsToIterateOver) {
      this.multicursorIndex = cursorIndex++;

      vimState.cursorStopPosition = stop;
      vimState.cursorStartPosition = start;

      for (let j = 0; j < timesToRepeat; j++) {
        await this.exec(stop, vimState);
      }

      resultingCursors.push(new Cursor(vimState.cursorStartPosition, vimState.cursorStopPosition));

      for (const transformation of vimState.recordedState.transformer.transformations) {
        if (isTextTransformation(transformation) && transformation.cursorIndex === undefined) {
          transformation.cursorIndex = this.multicursorIndex;
        }
      }
    }

    vimState.cursors = resultingCursors;
  }
}

export enum KeypressState {
  WaitingOnKeys,
  NoPossibleMatch,
}

/**
 * Every Vim action and an action instance will be added here with the @RegisterAction decorator.
 * Action's instance is included to avoid having to create a new instance of each action
 * on each getRelevantAction(...) call.
 */
const actionMap = new Map<Mode, Array<[new () => BaseAction, BaseAction]>>();

/**
 * Gets the action that should be triggered given a key sequence.
 *
 * If there is a definitive action that matched, returns that action.
 *
 * If an action could potentially match if more keys were to be pressed, returns `KeyPressState.WaitingOnKeys`
 * (e.g. you pressed "g" and are about to press "g" action to make the full action "gg")
 *
 * If no action could ever match, returns `KeypressState.NoPossibleMatch`.
 */
export function getRelevantAction(
  keysPressed: string[],
  vimState: VimState,
): BaseAction | KeypressState {
  const possibleActionsForMode = actionMap.get(vimState.currentMode) ?? [];

  let hasPotentialMatch = false;
  for (const [actionType, actionInstance] of possibleActionsForMode) {
    const applicability: ActionApplicability = actionInstance.getActionApplicability(
      vimState,
      keysPressed
    );
    if (applicability === ActionApplicability.DoesApply) {
      const action = new actionType();
      action.keysPressed = [...vimState.recordedState.actionKeys];
      return action;
    }
    hasPotentialMatch ||= applicability === ActionApplicability.CouldApply;
  }

  return hasPotentialMatch ? KeypressState.WaitingOnKeys : KeypressState.NoPossibleMatch;
}

export function RegisterAction(action: new () => BaseAction): void {
  const actionInstance = new action();
  for (const modeName of actionInstance.modes) {
    let actions = actionMap.get(modeName);
    if (!actions) {
      actions = [];
      actionMap.set(modeName, actions);
    }

    if (actionInstance.keys === undefined) {
      // action that can't be called directly
      continue;
    }

    actions.push([action, actionInstance]);
  }
}

export enum ActionApplicability {
  DoesApply,
  CouldApply,
  CannotApply,
}
