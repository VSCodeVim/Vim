import { Position } from "./../motion/position";
import { Range } from "./../motion/range";

/**
 * Represents inserting text at a position in the document.
 */
export interface InsertTextTransformation {
  type             : "insertText";
  text             : string;
  associatedCursor : Range;
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