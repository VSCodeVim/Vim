import { Position, PositionDiff } from "./../motion/position";
import { Range } from "./../motion/range";

/**
 * This file contains definitions of objects that represent text
 * additions/deletions/replacements on the document. You'll add them
 * to vimState.recordedState.transformations and then they will be applied
 * later on.
 *
 * We do it in this way so they can all be processed in parallel and merged
 * if necessary.
 */

/**
 * Represents inserting text at a position in the document.
 */
export interface InsertTextTransformation {
  /**
   * Type of this insertion (used for type checking with discriminated
   * union types).
   */
  type    : "insertText";

  /**
   * Text content of this insertion.
   */
  text    : string;

  /**
   * The location to insert the text.
   */
  position: Position;

  /**
   * A position diff that will be added to the position of the cursor after
   * the replace transformation has been applied.
   *
   * If you don't know what this is, just ignore it. You probably don't need it.
   */
  diff?: PositionDiff;
}

export interface ReplaceTextTransformation {
  type: "replaceText";

  /**
   * Text to insert.
   */
  text: string;

  /**
   * Start of location to replace.
   */
  start: Position;

  /**
   * End of location to replace.
   */
  end: Position;

  /**
   * A position diff that will be added to the position of the cursor after
   * the replace transformation has been applied.
   *
   * If you don't know what this is, just ignore it. You probably don't need it.
   */
  diff?: PositionDiff;
}

/**
 * Represents inserting a character and allowing visual studio to do
 * its post-character stuff if it wants. (e.g., if you type "(" this
 * will automatically add the closing ")").
 */
export interface InsertTextVSCodeTransformation {
  type : "insertTextVSCode";

  /**
   * Text to insert.
   */
  text : string;

  /**
   * A position diff that will be added to the position of the cursor after
   * the replace transformation has been applied.
   *
   * If you don't know what this is, just ignore it. You probably don't need it.
   */
  diff?: PositionDiff;
}

/**
 * Represents deleting a character at a position in the document.
 */
export interface DeleteTextTransformation {
  type         : "deleteText";

  /**
   * Position at which to delete a character.
   */
  position     : Position;

  /**
   * A position diff that will be added to the position of the cursor after
   * the replace transformation has been applied.
   *
   * If you don't know what this is, just ignore it. You probably don't need it.
   */
  diff?: PositionDiff;
}


/**
 * Represents deleting a range of characters.
 */
export interface DeleteTextRangeTransformation {
  type         : "deleteRange";

  /**
   * Range of characters to delete.
   */
  range: Range;

  /**
   * A position diff that will be added to the position of the cursor after
   * the replace transformation has been applied.
   *
   * If you don't know what this is, just ignore it. You probably don't need it.
   */
  diff?: PositionDiff;

  collapseRange?: boolean;
}

/**
 * Represents pressing ':'
 */
export interface ShowCommandLine {
  type: "showCommandLine";
}

/**
 * Represents pressing '.'
 */
export interface Dot {
  type: "dot";
}

export type Transformation
  = InsertTextTransformation
  | InsertTextVSCodeTransformation
  | ReplaceTextTransformation
  | DeleteTextRangeTransformation
  | DeleteTextTransformation
  | ShowCommandLine
  | Dot
  | DeleteTextTransformation;

/**
 * Text Transformations
 *
 * Using these indicates that you want Visual Studio Code to execute your text
 * actions as a batch operation. It's a bit tricky because we defer cursor updating
 * behavior to whatever the batch operation returns, so if you update the cursor in your
 * Action, VSCode will override whatever you did.
 *
 * If your cursor isn't ending up in the right place, you can adjust it by passing along
 * a PositionDiff.
 *
 * (There are a LOT of weird edge cases with cursor behavior that we don't want to have to reimplement).
 */
export type TextTransformations
  = InsertTextTransformation
  | InsertTextVSCodeTransformation
  | DeleteTextRangeTransformation
  | DeleteTextTransformation
  | ReplaceTextTransformation;

export const isTextTransformation = (x: string) => {
  return x === 'insertText' ||
         x === 'replaceText' ||
         x === 'deleteText' ||
         x === 'deleteRange';
};