import { Position } from "./../motion/position";
import { Range } from "./../motion/range";

/**
 * Represents inserting text at a position in the document.
 */
export interface InsertTextTransformation {
  /**
   * Type of this insertion (used for type checking with discriminated
   * union types).
   */
  type                 : "insertText";

  /**
   * Text content of this insertion.
   */
  text                 : string;

  /**
   * The cursor that triggered this insertion.
   */
  associatedCursor     : Position;

  /**
   * Whether the associatedCursor should be adjusted by the contents of text.
   * E.g., if text === 'a', you just inserted an 'a', so the cursor will
   * be bumped one to the right after the insertion, unless notAdjustedByOwnText
   * is set to true.
   *
   * If you're confused by this, just ignore it.
   */
  notAdjustedByOwnText?: boolean;
}

export interface InsertTextVSCodeTransformation {
  type : "insertTextVSCode";
  text : string;
}

/**
 * Represents deleting text at a position in the document.
 */
export interface DeleteTextTransformation {
  type    : "deleteText";
  position: Position;
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
  | ShowCommandLine
  | Dot
  | DeleteTextTransformation;