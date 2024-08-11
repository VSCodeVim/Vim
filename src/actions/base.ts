import { Position } from 'vscode';
import { Cursor } from '../common/motion/cursor';
import { Notation } from '../configuration/notation';
import { ActionType, IBaseAction } from './types';
import { isTextTransformation } from '../transformations/transformations';
import { configuration } from './../configuration/configuration';
import { Mode } from './../mode/mode';
import { VimState } from './../state/vimState';
import { isLiteralMode, unmapLiteral } from '../configuration/langmap';

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
  public abstract keys: readonly string[] | readonly string[][];

  /**
   * The keys pressed at the time that this action was triggered.
   */
  // TODO: make readonly
  public keysPressed: string[] = [];

  private static readonly isSingleNumber: RegExp = /^[0-9]$/;
  private static readonly isSingleAlpha: RegExp = /^[a-zA-Z]$/;
  private static readonly isMacroRegister: RegExp = /^[0-9a-zA-Z]$/;

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
      } else if (left === '<macro>' && this.isMacroRegister.test(right)) {
        continue;
      } else if (['<character>', '<register>'].includes(left) && !Notation.IsControlKey(right)) {
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
 * Every Vim action will be added here with the @RegisterAction decorator.
 */
const actionMap = new Map<Mode, Array<new () => BaseAction>>();

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
  for (const actionType of possibleActionsForMode) {
    // TODO: Constructing up to several hundred Actions every time we hit a key is moronic.
    //       I think we can make `doesActionApply` and `couldActionApply` static...
    const action = new actionType();
    if (action.doesActionApply(vimState, keysPressed)) {
      action.keysPressed = isLiteralMode(vimState.currentMode)
        ? [...vimState.recordedState.actionKeys]
        : unmapLiteral(action.keys, vimState.recordedState.actionKeys);
      return action;
    }

    hasPotentialMatch ||= action.couldActionApply(vimState, keysPressed);
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

    actions.push(action);
  }
}
