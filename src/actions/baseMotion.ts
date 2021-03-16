import { RegisterMode } from '../register/register';
import { BaseAction } from './base';
import { Mode } from '../mode/mode';
import { VimState } from '../state/vimState';
import { RecordedState } from '../state/recordedState';
import { clamp } from '../util/util';
import { Position } from 'vscode';

export function isIMovement(o: IMovement | Position): o is IMovement {
  return (o as IMovement).start !== undefined && (o as IMovement).stop !== undefined;
}

export enum SelectionType {
  Concatenating, // Selections that concatenate repeated movements
  Expanding, // Selections that expand the start and end of the previous selection
}

/**
 * The result of a (more sophisticated) Movement.
 */
export interface IMovement {
  start: Position;
  stop: Position;

  /**
   * Whether this motion succeeded. Some commands, like fx when 'x' can't be found,
   * will not move the cursor. Furthermore, dfx won't delete *anything*, even though
   * deleting to the current character would generally delete 1 character.
   */
  failed?: boolean;

  /**
   * Wheter this motion resulted in the current multicursor index being removed. This
   * happens when multiple selections combine into one.
   */
  removed?: boolean;

  // It /so/ annoys me that I have to put this here.
  registerMode?: RegisterMode;
}

export function failedMovement(vimState: VimState): IMovement {
  return {
    start: vimState.cursorStartPosition,
    stop: vimState.cursorStopPosition,
    failed: true,
  };
}

export abstract class BaseMovement extends BaseAction {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];

  isMotion = true;

  /**
   * If movement can be repeated with semicolon or comma this will be true when
   * running the repetition.
   */
  isRepeat = false;

  /**
   * This is for commands like $ which force the desired column to be at
   * the end of even the longest line.
   */
  public setsDesiredColumnToEOL = false;

  protected minCount = 1;
  protected maxCount = 99999;
  protected selectionType = SelectionType.Concatenating;

  constructor(keysPressed?: string[], isRepeat?: boolean) {
    super();

    if (keysPressed) {
      this.keysPressed = keysPressed;
    }

    if (isRepeat) {
      this.isRepeat = isRepeat;
    }
  }

  /**
   * Run the movement a single time.
   *
   * Generally returns a new Position. If necessary, it can return an IMovement instead.
   * Note: If returning an IMovement, make sure that repeated actions on a
   * visual selection work. For example, V}}
   */
  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    throw new Error('Not implemented!');
  }

  /**
   * Run the movement in an operator context a single time.
   *
   * Some movements operate over different ranges when used for operators.
   */
  public async execActionForOperator(
    position: Position,
    vimState: VimState
  ): Promise<Position | IMovement> {
    return this.execAction(position, vimState);
  }

  /**
   * Run a movement count times.
   *
   * count: the number prefix the user entered, or 0 if they didn't enter one.
   */
  public async execActionWithCount(
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<Position | IMovement> {
    const recordedState = vimState.recordedState;
    let result: Position | IMovement = new Position(0, 0); // bogus init to satisfy typechecker
    let prevResult = failedMovement(vimState);
    let firstMovementStart: Position = new Position(position.line, position.character);

    count = clamp(count, this.minCount, this.maxCount);

    for (let i = 0; i < count; i++) {
      const firstIteration = i === 0;
      const lastIteration = i === count - 1;
      result = await this.createMovementResult(position, vimState, recordedState, lastIteration);

      if (result instanceof Position) {
        /**
         * This position will be passed to the `motion` on the next iteration,
         * it may cause some issues when count > 1.
         */
        position = result;
      } else {
        if (result.failed) {
          return prevResult;
        }

        if (firstIteration) {
          firstMovementStart = new Position(result.start.line, result.start.character);
        }

        position = this.adjustPosition(position, result, lastIteration);
        prevResult = result;
      }
    }

    if (this.selectionType === SelectionType.Concatenating && isIMovement(result)) {
      result.start = firstMovementStart;
    }

    return result;
  }

  protected async createMovementResult(
    position: Position,
    vimState: VimState,
    recordedState: RecordedState,
    lastIteration: boolean
  ): Promise<Position | IMovement> {
    const result =
      recordedState.operator && lastIteration
        ? await this.execActionForOperator(position, vimState)
        : await this.execAction(position, vimState);
    return result;
  }

  protected adjustPosition(position: Position, result: IMovement, lastIteration: boolean) {
    if (!lastIteration) {
      position = result.stop.getRightThroughLineBreaks();
    }
    return position;
  }
}
