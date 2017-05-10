import { Position } from './../common/motion/position';
import { TextEditor } from './../textEditor';

/**
 * State involved with entering Replace mode (R).
 */
export class ReplaceState {
  /**
   * The location of the cursor where you begun to replace characters.
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

  constructor(startPosition: Position, timesToRepeat: number = 1) {
    this.replaceCursorStartPosition = startPosition;
    this.timesToRepeat = timesToRepeat;

    let text = TextEditor.getLineAt(startPosition).text.substring(startPosition.character);
    for (let [key, value] of text.split("").entries()) {
      this.originalChars[key + startPosition.character] = value;
    }
  }
}
