import { Position } from 'vscode';

type ReplaceModeChange = {
  before: string;
  after: string;
};

/**
 * State involved with entering Replace mode (R).
 */
export class ReplaceState {
  /**
   * Number of times we're going to repeat this replace action.
   * Comes from the count applied to the `R` command.
   */
  public readonly timesToRepeat: number;

  private _changes: ReplaceModeChange[][];
  public getChanges(cursorIdx: number): ReplaceModeChange[] {
    if (this._changes[cursorIdx] === undefined) {
      this._changes[cursorIdx] = [];
    }
    return this._changes[cursorIdx];
  }
  public resetChanges(cursorIdx: number) {
    this._changes[cursorIdx] = [];
  }

  constructor(startPositions: Position[], timesToRepeat: number = 1) {
    this.timesToRepeat = timesToRepeat;
    this._changes = startPositions.map((pos) => []);
  }
}
