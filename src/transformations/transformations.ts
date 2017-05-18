import { Position, PositionDiff } from "./../common/motion/position";
import { Range } from "./../common/motion/range";
import * as vscode from 'vscode';

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
   * The index of the cursor that this transformation applies to.
   */
  cursorIndex?: number;

  /**
   * A position diff that will be added to the position of the cursor after
   * the replace transformation has been applied.
   *
   * If you don't know what this is, just ignore it. You probably don't need it.
   */
  diff?: PositionDiff;


  manuallySetCursorPositions?: boolean;
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
   * The index of the cursor that this transformation applies to.
   */
  cursorIndex?: number;

  /**
   * A position diff that will be added to the position of the cursor after
   * the replace transformation has been applied.
   *
   * If you don't know what this is, just ignore it. You probably don't need it.
   */
  diff?: PositionDiff;

  /**
   * Please don't use this! It's a hack.
   */
  manuallySetCursorPositions?: boolean;
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
   * The index of the cursor that this transformation applies to.
   */
  cursorIndex?: number;

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
   * The index of the cursor that this transformation applies to.
   */
  cursorIndex?: number;

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

  /**
   * The index of the cursor that this transformation applies to.
   */
  cursorIndex?: number;

  /**
   * Please don't use this! It's a hack.
   */
  manuallySetCursorPositions?: boolean;
}

export interface MoveCursorTransformation {
  type: "moveCursor";

  cursorIndex?: number;

  /**
   * Move the cursor this much.
   */
  diff: PositionDiff;
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

/**
 * Represents Tab
 */
export interface Tab {
  type: "tab";
  cursorIndex?: number;

  /**
   * Move the cursor this much.
   */
  diff?: PositionDiff;
}

/**
 * Represents macro
 */
export interface Macro {
  type: "macro";
  register: string;
  replay: "contentChange" | "keystrokes";
}

/**
 * Represents updating document content changes
 */
export interface ContentChangeTransformation {
  type: "contentChange";
  changes: vscode.TextDocumentContentChangeEvent[];
  diff: PositionDiff;
}

export type Transformation
  = InsertTextTransformation
  | InsertTextVSCodeTransformation
  | ReplaceTextTransformation
  | DeleteTextRangeTransformation
  | DeleteTextTransformation
  | MoveCursorTransformation
  | ShowCommandLine
  | Dot
  | Macro
  | ContentChangeTransformation
  | DeleteTextTransformation
  | Tab;

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
 * (There are a LOT of weird edge cases with cursor behavior that we don't want to have to reimplement. Trust
 * me... I tried.)
 */
export type TextTransformations
  = InsertTextTransformation
  | InsertTextVSCodeTransformation
  | DeleteTextRangeTransformation
  | MoveCursorTransformation
  | DeleteTextTransformation
  | ReplaceTextTransformation;

export const isTextTransformation = (x: Transformation): x is TextTransformations => {
  return x.type === 'insertText'  ||
         x.type === 'replaceText' ||
         x.type === 'deleteText'  ||
         x.type === 'moveCursor'  ||
         x.type === 'deleteRange';
};

const getRangeFromTextTransformation = (transformation: TextTransformations): Range | undefined => {
  switch (transformation.type) {
    case 'insertText':
      return new Range(transformation.position, transformation.position);
    case 'replaceText':
      return new Range(transformation.start, transformation.end);
    case 'deleteText':
      return new Range(transformation.position, transformation.position);
    case 'deleteRange':
      return transformation.range;
    case 'moveCursor':
      return undefined;
  }

  throw new Error("This should never happen!");
};

export const areAnyTransformationsOverlapping = (transformations: TextTransformations[]) => {
  for (let i = 0; i < transformations.length; i++) {
    for (let j = i + 1; j < transformations.length; j++) {
      const first = transformations[i];
      const second = transformations[j];

      const firstRange = getRangeFromTextTransformation(first);
      const secondRange = getRangeFromTextTransformation(second);

      if (!firstRange || !secondRange) { continue; }

      if (firstRange.overlaps(secondRange)) {
        return true;
      }
    }
  }

  return false;
};