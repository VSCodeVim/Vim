import { Position } from 'vscode';
import { VimState } from './vimState';

/**
 * State involved with entering Replace mode (R).
 */
export class ReplaceState {
  /**
   * The cursor location where you began replacing characters.
   */
  public replaceCursorStartPosition: Position;

  public readonly originalChars: readonly string[];

  /**
   * The characters the user inserted in replace mode. Useful for when
   * we repeat a replace action with .
   */
  public readonly newChars: string[] = [];

  /**
   * Number of times we're going to repeat this replace action.
   * Comes from the count applied to the `R` command.
   */
  public readonly timesToRepeat: number;

  constructor(vimState: VimState, startPosition: Position, timesToRepeat: number = 1) {
    this.replaceCursorStartPosition = startPosition;
    this.timesToRepeat = timesToRepeat;

    this.originalChars = vimState.document.lineAt(startPosition).text.split('');
  }
}
