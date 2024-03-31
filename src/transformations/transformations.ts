import { Position, Range, TextDocumentContentChangeEvent } from 'vscode';
import { RecordedState } from '../state/recordedState';
import { PositionDiff } from './../common/motion/position';

/**
 * This file contains definitions of objects that represent text
 * additions/deletions/replacements on the document. You'll add them
 * to vimState.recordedState.transformer.transformations and then they will be applied
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
  type: 'insertText';

  /**
   * Text content of this insertion.
   */
  text: string;

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
  type: 'replaceText';

  /**
   * Text to insert.
   */
  text: string;

  /**
   * Range of characters to replace.
   */
  range: Range;

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
  type: 'insertTextVSCode';

  /**
   * Text to insert.
   */
  text: string;

  /**
   * Whether this transformation was created in multicursor mode.
   */
  isMultiCursor?: boolean;

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
  type: 'deleteRange';

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
  type: 'moveCursor';

  cursorIndex?: number;

  /**
   * Move the cursor this much.
   */
  diff: PositionDiff;
}

/**
 * Replays a RecordedState. Used for `.`, primarily.
 */
export interface Dot {
  type: 'replayRecordedState';
  count: number;
  recordedState: RecordedState;
}

export interface VSCodeCommandTransformation {
  type: 'vscodeCommand';
  command: string;
  args: any[];
}

/**
 * Represents macro
 */
export interface Macro {
  type: 'macro';
  register: string;
  replay: 'contentChange' | 'keystrokes';
}

/**
 * Represents updating document content changes
 */
export interface ContentChangeTransformation {
  type: 'contentChange';
  changes: TextDocumentContentChangeEvent[];
  diff: PositionDiff;
}

export type Transformation =
  | InsertTextTransformation
  | InsertTextVSCodeTransformation
  | ReplaceTextTransformation
  | DeleteTextRangeTransformation
  | MoveCursorTransformation
  | Dot
  | Macro
  | ContentChangeTransformation
  | VSCodeCommandTransformation;

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
export type TextTransformations =
  | InsertTextTransformation
  | InsertTextVSCodeTransformation
  | DeleteTextRangeTransformation
  | MoveCursorTransformation
  | ReplaceTextTransformation;

export const isTextTransformation = (x: Transformation): x is TextTransformations => {
  return (
    x.type === 'insertText' ||
    x.type === 'replaceText' ||
    x.type === 'deleteRange' ||
    x.type === 'moveCursor'
  );
};
export const isMultiCursorTextTransformation = (x: Transformation): boolean => {
  return (x.type === 'insertTextVSCode' && x.isMultiCursor) ?? false;
};

const getRangeFromTextTransformation = (transformation: TextTransformations): Range | undefined => {
  switch (transformation.type) {
    case 'insertText':
      return new Range(
        transformation.position,
        transformation.position.advancePositionByText(transformation.text),
      );
    case 'replaceText':
      // TODO: Do we need to do the same sort of thing here as for insertText?
      return transformation.range;
    case 'deleteRange':
      return transformation.range;
    case 'moveCursor':
      return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  throw new Error('Unhandled text transformation: ' + transformation);
};

export function overlappingTransformations(
  transformations: TextTransformations[],
): [TextTransformations, TextTransformations] | undefined {
  for (let i = 0; i < transformations.length; i++) {
    for (let j = i + 1; j < transformations.length; j++) {
      const first = transformations[i];
      const second = transformations[j];

      const firstRange = getRangeFromTextTransformation(first);
      const secondRange = getRangeFromTextTransformation(second);

      if (!firstRange || !secondRange) {
        continue;
      }

      const intersection = firstRange.intersection(secondRange);
      if (intersection && !intersection.start.isEqual(intersection.end)) {
        return [first, second];
      }
    }
  }

  return undefined;
}

export const areAllSameTransformation = (transformations: Transformation[]): boolean => {
  const firstTransformation = transformations[0];

  return transformations.every((t) => {
    return Object.entries(t).every(([key, value]) => {
      // TODO: this is all quite janky
      return (firstTransformation as unknown as Record<string, any>)[key] === value;
    });
  });
};

export function stringify(transformation: Transformation): string {
  if (transformation.type === 'replayRecordedState') {
    return `Replay: ${transformation.recordedState.actionsRun
      .map((x) => x.keysPressed.join(''))
      .join('')}`;
  } else {
    return JSON.stringify(transformation);
  }
}
