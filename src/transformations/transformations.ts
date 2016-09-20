import { Position, PositionDiff } from "./../motion/position";

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
  | ReplaceTextTransformation
  | ShowCommandLine
  | Dot
  | DeleteTextTransformation;