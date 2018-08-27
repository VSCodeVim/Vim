import { Position } from '../common/motion/position';
import { RecordedState } from './../state/recordedState';
import { SearchState } from './searchState';

export class Jump {
  public fileName: string;
  public position: Position;
  public recordedState?: RecordedState;

  constructor({
    fileName,
    position,
    recordedState,
  }: {
    fileName: string;
    position: Position;
    recordedState?: RecordedState;
  }) {
    this.fileName = fileName;
    this.position = position;
    this.recordedState = recordedState;
  }

  public equals(other: Jump): boolean {
    return this.fileName === other.fileName && this.position.isEqual(other.position);
  }
}

export class JumpHistory {
  private jumps: Jump[] = [];
  private currentPosition = 0;

  public push(jump: Jump) {
    const previousJump = this.jumps[this.currentPosition - 1];
    const currentJump = this.jumps[this.currentPosition];
    const nextJump = this.jumps[this.currentPosition + 1];

    if (previousJump && previousJump.equals(jump)) {
      this.currentPosition -= 1;
      console.log('On previous jump', this.currentPosition);
      return;
    }

    if (currentJump && currentJump.equals(jump)) {
      console.log('On current jump', this.currentPosition);
      return;
    }

    if (previousJump && previousJump.equals(jump)) {
      this.currentPosition -= 1;
      console.log('On previous jump', this.currentPosition);
      return;
    }

    if (nextJump && nextJump.equals(jump)) {
      this.currentPosition += 1;
      console.log('On next jump', this.currentPosition);
      return;
    }

    if (this.currentPosition < this.jumps.length - 1) {
      this.jumps.splice(this.currentPosition + 1, this.jumps.length);
      console.log('Removing following jumps');
    }
    const last = this.jumps[this.jumps.length - 1];
    if (!last || !last.position.isEqual(jump.position)) {
      console.log('Added new jump', jump.fileName, jump.position.line);
      this.jumps.push(jump);
    }
    this.currentPosition = this.jumps.length - 1;
  }

  public back(): Jump {
    this.currentPosition = Math.max(this.currentPosition - 1, 0);
    return this.jumps[this.currentPosition];
  }

  public forward(): Jump {
    this.currentPosition = Math.min(this.currentPosition + 1, this.jumps.length - 1);
    return this.jumps[this.currentPosition];
  }
}

/**
 * State which stores global state (across editors)
 */
export class GlobalState {
  private static _jumpHistory: JumpHistory = new JumpHistory();

  /**
   * Getters and setters for changing global state
   */
  public get jumpHistory(): JumpHistory {
    return GlobalState._jumpHistory;
  }

  /**
   * The keystroke sequence that made up our last complete action (that can be
   * repeated with '.').
   */
  private static _previousFullAction: RecordedState | undefined = undefined;

  /**
   * Previous searches performed
   */
  private static _searchStatePrevious: SearchState[] = [];

  /**
   * Last search state for running n and N commands
   */
  private static _searchState: SearchState | undefined = undefined;

  /**
   *  Index used for navigating search history with <up> and <down> when searching
   */
  private static _searchStateIndex: number = 0;

  /**
   * Used internally for nohl.
   */
  private static _hl = true;

  /**
   * Getters and setters for changing global state
   */
  public get searchStatePrevious(): SearchState[] {
    return GlobalState._searchStatePrevious;
  }

  public set searchStatePrevious(states: SearchState[]) {
    GlobalState._searchStatePrevious = GlobalState._searchStatePrevious.concat(states);
  }

  public get previousFullAction(): RecordedState | undefined {
    return GlobalState._previousFullAction;
  }

  public set previousFullAction(state: RecordedState | undefined) {
    GlobalState._previousFullAction = state;
  }

  public get searchState(): SearchState | undefined {
    return GlobalState._searchState;
  }

  public set searchState(state: SearchState | undefined) {
    GlobalState._searchState = state;
  }

  public get searchStateIndex(): number {
    return GlobalState._searchStateIndex;
  }

  public set searchStateIndex(state: number) {
    GlobalState._searchStateIndex = state;
  }

  public get hl(): boolean {
    return GlobalState._hl;
  }

  public set hl(enabled: boolean) {
    GlobalState._hl = enabled;
  }
}
