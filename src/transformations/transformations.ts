import * as _ from 'lodash'
import * as vscode from 'vscode'
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

export function processInsertionsAndDeletions(transformations: Transformation[]): {
  newCursorPositions: Range[],
  modifiedTransformations: Transformation[],
} | undefined {
  // TODO - should probably ensure that there are no vscode insertions here.

  let insertions: InsertTextTransformation[] = _.filter(transformations,
    x => x.type === "insertText") as any;

  if (insertions.length === 0) {
    return undefined;
  }

  // Calculate the correct location of every insertion.
  // (Note that e.g. inserting a newline earlier can cause later
  // insertions to move down the document.)

  let modifiedInsertions = insertions.map(ins => {
    let newInsertion: InsertTextTransformation = {
      type: 'insertText',
      text: ins.text,
      associatedCursor: ins.associatedCursor,
      notAdjustedByOwnText: ins.notAdjustedByOwnText,
    };

    // We don't handle the case of inserting a long string with a newline in the middle
    // currently. I don't think it's necessary.
    if (ins.text.indexOf("\n") > -1 && ins.text.length > 1) {
      vscode.window.showErrorMessage("Bad error in execCount in actions.ts");
    }

    if (ins.text !== "\n") {
      let beforeInsert = _.filter(insertions, other =>
        other.associatedCursor.line === ins.associatedCursor.line &&
        other.associatedCursor.isBefore(ins.associatedCursor));

      for (const before of beforeInsert) {
        newInsertion.associatedCursor = newInsertion.associatedCursor.getRight(before.text.length);
      }

      return newInsertion;
    } else {
      let beforeInsert = _.filter(insertions, other =>
        other.associatedCursor.isBefore(ins.associatedCursor)).length;

      // no bounds check because it's entirely concievable that we're off the bounds of
      // the (pre-insertion) document.

      newInsertion.associatedCursor = newInsertion.associatedCursor
        .getDownByCount(beforeInsert, { boundsCheck: false });

      return newInsertion;
    }
  });

  // Now that we've calculated the positions of all the insertions,
  // calculate the position of all the cursors.

  let newCursors = _.map(modifiedInsertions, ins => {
    if (ins.notAdjustedByOwnText) { return ins.associatedCursor; }

    if (ins.text === "\n") {
      return ins.associatedCursor.getDownByCount(1, { boundsCheck: false })
        .getLineBegin();
    } else {
      return ins.associatedCursor.getRight(ins.text.length);
    }
  });

  newCursors.map(x => console.log(x.toString()));

  return {
    modifiedTransformations: modifiedInsertions as any,
    newCursorPositions: newCursors.map(x => new Range(x, x))
  };
}