import type { Position } from 'vscode';
import type { VimState } from '../state/vimState';

export interface IBaseAction {
  readonly isMotion: boolean;
  readonly isOperator: boolean;
  readonly isCommand: boolean;
  readonly isJump: boolean;
  readonly createsUndoPoint: boolean;

  keysPressed: string[];
  multicursorIndex: number | undefined;

  readonly preservesDesiredColumn: boolean;
}

export interface IBaseCommand extends IBaseAction {
  exec(position: Position, vimState: VimState): Promise<void>;
}

export interface IBaseOperator extends IBaseAction {
  run(vimState: VimState, start: Position, stop: Position): Promise<void>;
  runRepeat(vimState: VimState, position: Position, count: number): Promise<void>;
}
