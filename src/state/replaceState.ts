import { Position } from 'vscode';
import { TextEditor } from './../textEditor';
import { VimState } from './vimState';

/**
 * State involved with entering Replace mode (R).
 */
export class ReplaceState {
  /**
   * The cursor location where you began replacing characters.
   */
  public replaceCursorStartPosition: Position;

  public originalChars: string[] = [];

  /**
   * The characters the user inserted in replace mode. Useful for when
   * we repeat a replace action with .
   */
  public newChars: string[] = [];

  /**
   * Number of times we're going to repeat this replace action.
   */
  public timesToRepeat: number;

  constructor(vimState: VimState, startPosition: Position, timesToRepeat: number = 1) {
    this.replaceCursorStartPosition = startPosition;
    this.timesToRepeat = timesToRepeat;

    const text = vimState.document.lineAt(startPosition).text.substring(startPosition.character);
    for (let [key, value] of text.split('').entries()) {
      this.originalChars[key + startPosition.character] = value;
    }
  }
}
