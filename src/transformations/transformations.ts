import { Position } from "./../motion/position";

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
}

export interface InsertTextVSCodeTransformation {
  type : "insertTextVSCode";
  text : string;
}

/**
 * Represents deleting text at a position in the document.
 */
export interface DeleteTextTransformation {
  type         : "deleteText";
  position     : Position;
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