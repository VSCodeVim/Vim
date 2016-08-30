import { Position } from "./../motion/position";

/**
 * Represents inserting text at a position in the document.
 */
interface InsertTextTransformation {
  type           : "insertText";
  text           : string;
  position?      : Position;
  letVSCodeInsert: boolean;
}

/**
 * Represents deleting text at a position in the document.
 */
interface DeleteTextTransformation {
  type    : "deleteText";
  position: Position;
}

/**
 * Represents pressing ':'
 */
interface ShowCommandLine {
  type: "showCommandLine";
}

/**
 * Represents pressing '.'
 */
interface Dot {
  type: "dot";
}

export type Transformation
  = InsertTextTransformation
  | ShowCommandLine
  | Dot
  | DeleteTextTransformation;

function blah(x: Transformation) {
}