import { Position } from 'vscode';
import { isVisualMode } from '../../../mode/mode';
import { VimState } from '../../../state/vimState';
import { Logger } from '../../../util/logger';
import { BaseMovement, failedMovement, IMovement } from '../../baseMotion';
import { MoveInsideCharacter } from '../../motion';
import { searchPosition } from './searchUtils';
import { bracketObjectsEnabled } from './targetsConfig';

/*
 * This function creates a last/next movement based on an existing one.
 * It works by searching for a next/last character, and then applying the given action in its position.
 * For examples of how to use it, see src/actions/plugins/targets/lastNextObjects.ts.
 */
function LastNextObject<T extends MoveInsideCharacter>(type: new () => T, which: 'l' | 'n') {
  abstract class NextHandlerClass extends BaseMovement {
    public override readonly keys: readonly string[] | readonly string[][];
    override isJump = true;

    // actual action (e.g. `i(` )
    private readonly actual: T;
    readonly secondKey: 'l' | 'n' = which;
    // character to search forward/backward for next/last (e.g. `(` for next parenthesis)
    abstract readonly charToFind: string;
    // this is just to make sure we won't register anything that we can't handle. see constructor.
    readonly valid: boolean;

    public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
      return this.valid && bracketObjectsEnabled() && super.doesActionApply(vimState, keysPressed);
    }

    constructor() {
      super();
      this.actual = new type();

      const secondKey = this.secondKey;
      const withWhichKey = (keys: string[]): string[] | undefined => {
        if (keys.length === 2) {
          return [keys[0], secondKey, keys[1]];
        } else {
          return undefined;
        }
      };

      // we want fail without throwing an exception, but with log, to not break the Vim
      const errMsg = `failed to register ${which === 'l' ? 'last' : 'next'} for ${type.name}`;
      // failed, but it should never happen
      if (this.actual.keys.length < 1) {
        this.valid = false;
        this.keys = [];
        Logger.error(errMsg);
        return;
      }
      if (typeof this.actual.keys[0] === 'string') {
        const keys = withWhichKey(this.actual.keys as string[]);
        // failed
        if (keys === undefined) {
          this.valid = false;
          this.keys = [];
          Logger.error(errMsg);
          return;
        } else {
          this.keys = keys;
        }
      } else {
        const keys = this.actual.keys.map((k) => withWhichKey(k as string[]));
        // failed
        if (!keys.every((p) => p !== undefined)) {
          this.valid = false;
          this.keys = [];
          Logger.error(errMsg);
          return;
        } else {
          this.keys = keys;
        }
      }
      this.valid = true;
    }

    public override async execAction(
      position: Position,
      vimState: VimState,
      firstIteration: boolean,
      lastIteration: boolean,
    ): Promise<IMovement> {
      const maybePosition = searchPosition(this.charToFind, vimState.document, position, {
        direction: which === 'l' ? '<' : '>',
        includeCursor: false,
        throughLineBreaks: true,
      });
      if (maybePosition === undefined) {
        return failedMovement(vimState);
      }
      vimState.cursorStartPosition = maybePosition;
      vimState.cursorStopPosition = maybePosition;
      const movement = await this.actual.execAction(
        maybePosition,
        vimState,
        firstIteration,
        lastIteration,
      );
      if (movement.failed) {
        return movement;
      }
      const { start, stop } = movement;
      if (!isVisualMode(vimState.currentMode) && position.isBefore(start)) {
        vimState.recordedState.operatorPositionDiff = start.subtract(position);
      } else if (!isVisualMode(vimState.currentMode) && position.isAfter(stop)) {
        if (position.line === stop.line) {
          vimState.recordedState.operatorPositionDiff = stop.subtract(position);
        } else {
          vimState.recordedState.operatorPositionDiff = start.subtract(position);
        }
      }

      vimState.cursorStartPosition = start;
      vimState.cursorStopPosition = stop;
      return movement;
    }
  }
  return NextHandlerClass;
}

export function LastObject<T extends MoveInsideCharacter>(type: new () => T) {
  return LastNextObject(type, 'l');
}
export function NextObject<T extends MoveInsideCharacter>(type: new () => T) {
  return LastNextObject(type, 'n');
}
