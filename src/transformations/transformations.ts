import { Position } from "./../motion/position";

/**
 * Represents inserting text at a position in the document.
 */
export interface InsertTextTransformation {
  type           : "insertText";
  text           : string;
  position?      : Position;
  letVSCodeInsert: boolean;
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
  | ShowCommandLine
  | Dot
  | DeleteTextTransformation;