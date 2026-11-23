import { Position, TextDocument } from 'vscode';
import { configuration } from '../../configuration/configuration';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import { TextObject } from '../../textobject/textobject';
import { RegisterAction } from '../base';
import { IMovement, failedMovement } from '../baseMotion';

abstract class SelectArgument extends TextObject {
  override modes = [Mode.Normal, Mode.Visual];

  private static openingDelimiterCharacters(): string[] {
    return configuration.argumentObjectOpeningDelimiters;
  }
  private static closingDelimiterCharacters(): string[] {
    return configuration.argumentObjectClosingDelimiters;
  }
  private static separatorCharacters(): string[] {
    return configuration.argumentObjectSeparators;
  }

  // SelectArgument supports two select types: inner and around.
  //
  // Inner will adjust start/stop positions, so that they are inside
  // the delimiters (excluding the delimiters themselves).
  // Around will adjust start/stop positions, so that ONE of them includes
  // a separator character (optionally including extra whitespace).
  protected selectAround = false;

  // Requirement is that below example still works as expected, i.e.
  // when we have nested pairs of parens
  //
  //        ( a, b, (void*) | c(void*, void*), a)
  //
  // Warning: For now, mismatched opening and closing delimiters, e.g.
  // in (foo] will still be matched by this movement.
  //
  // Procedure:
  //
  // 1   Find boundaries left/right (i.e. where the argument starts/ends)
  // 1.1 Walk left until we find a comma or an opening paren, that does not
  //     have a matching closed one. This way we can ignore pairs
  //     of parentheses which are part of the current argument.
  // 1.2 Vice versa for walking right.
  // 2   Depending on our mode (inner or around), improve the start/stop
  //     locations for most consistent behaviour, especially in case of
  //     multi-line statements.

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const failure = failedMovement(vimState);

    let leftSearchStartPosition = position;
    let rightSearchStartPosition = position;

    const charAtPos = TextEditor.getCharAt(vimState.document, position);

    // When the cursor is on a delimiter already, pre-advance the cursor,
    // so that our search actually spans a range. We will advance to the next argument,
    // in case of opening delimiters or separators, and advance to the
    // previous on closing delimiters.
    if (
      SelectArgument.separatorCharacters().includes(charAtPos) ||
      SelectArgument.openingDelimiterCharacters().includes(charAtPos)
    ) {
      rightSearchStartPosition = position.getRightThroughLineBreaks(true);
    } else if (SelectArgument.closingDelimiterCharacters().includes(charAtPos)) {
      leftSearchStartPosition = position.getLeftThroughLineBreaks(true);
    }

    // Early abort, if no delimiters (i.e. (), [], etc.) surround us.
    // This prevents applying the movement to surrounding separators across the buffer.
    if (
      SelectInnerArgument.findLeftArgumentBoundary(
        vimState.document,
        leftSearchStartPosition,
        true,
      ) === undefined ||
      SelectInnerArgument.findRightArgumentBoundary(
        vimState.document,
        rightSearchStartPosition,
        true,
      ) === undefined
    ) {
      return failure;
    }

    const leftArgumentBoundary = SelectInnerArgument.findLeftArgumentBoundary(
      vimState.document,
      leftSearchStartPosition,
    );
    if (leftArgumentBoundary === undefined) {
      return failure;
    }

    const rightArgumentBoundary = SelectInnerArgument.findRightArgumentBoundary(
      vimState.document,
      rightSearchStartPosition,
    );
    if (rightArgumentBoundary === undefined) {
      return failure;
    }

    let start: Position;
    let stop: Position;

    if (this.selectAround) {
      const isLeftOnOpening: boolean = SelectArgument.openingDelimiterCharacters().includes(
        TextEditor.getCharAt(vimState.document, leftArgumentBoundary),
      );
      const isRightOnClosing: boolean = SelectArgument.closingDelimiterCharacters().includes(
        TextEditor.getCharAt(vimState.document, rightArgumentBoundary),
      );

      // Edge-case:
      // Ensure we do not select anything if we have an empty argument list, e.g. "()"
      const isEmptyArgumentList =
        leftArgumentBoundary.getRight().isEqual(rightArgumentBoundary) &&
        isLeftOnOpening &&
        isRightOnClosing;
      if (isEmptyArgumentList) {
        return failure;
      }

      // Only when we are in the first argument we outset the right boundary
      // until the first non-whitespace, so we do not end up with whitespace
      // at the beginning of the parens.
      const isInFirstArgument = isLeftOnOpening && !isRightOnClosing;
      if (isInFirstArgument) {
        stop = rightArgumentBoundary.getRight();
        // Walk right until non-whitespace
        while (/\s/.test(TextEditor.getCharAt(vimState.document, stop.getRight()))) {
          stop = stop.getRight();
        }
      } else {
        // In any other case, we inset
        stop = rightArgumentBoundary.getLeftThroughLineBreaks(true);
      }

      // In case the left boundary is on a opening delimiter, move that position inwards
      if (isLeftOnOpening) {
        start = leftArgumentBoundary.getRightThroughLineBreaks(true);
      } else {
        start = leftArgumentBoundary;
      }
    } else {
      // Inset the start once to get off the boundary and then keep
      // going until the first non whitespace.
      // This ensures that indented argument-lists keep the indentation.
      start = leftArgumentBoundary.getRightThroughLineBreaks(false);
      while (/\s/.test(TextEditor.getCharAt(vimState.document, start))) {
        start = start.getRightThroughLineBreaks(false);
      }

      // Same procedure for stop.
      stop = rightArgumentBoundary.getLeftThroughLineBreaks(false);
      while (/\s/.test(TextEditor.getCharAt(vimState.document, stop))) {
        stop = stop.getLeftThroughLineBreaks(false);
      }

      // Edge-case: Seems there is only whitespace in this argument.
      // Omit any weird handling and just clear all whitespace.
      if (stop.isBeforeOrEqual(start)) {
        start = leftArgumentBoundary.getRightThroughLineBreaks(true);
        stop = rightArgumentBoundary.getLeftThroughLineBreaks(true);
      }
    }

    // Handle case when cursor is not inside the anticipated movement range
    if (position.isBefore(start)) {
      vimState.recordedState.operatorPositionDiff = start.subtract(position);
    }
    vimState.cursorStartPosition = start;

    return {
      start,
      stop,
    };
  }

  private static findLeftArgumentBoundary(
    document: TextDocument,
    position: Position,
    ignoreSeparators: boolean = false,
  ): Position | undefined {
    let delimiterPosition: Position | undefined;
    let walkingPosition = position;
    let closedParensCount = 0;

    while (true) {
      const char = TextEditor.getCharAt(document, walkingPosition);
      if (closedParensCount === 0) {
        let isOnBoundary: boolean = SelectArgument.openingDelimiterCharacters().includes(char);
        if (!ignoreSeparators) {
          isOnBoundary ||= SelectArgument.separatorCharacters().includes(char);
        }

        if (isOnBoundary) {
          // We have found the left most delimiter or the first proper delimiter
          // in our cursor's list 'depth' and thus can abort.
          delimiterPosition = walkingPosition;
          break;
        }
      }
      if (SelectArgument.closingDelimiterCharacters().includes(char)) {
        closedParensCount++;
      }
      if (SelectArgument.openingDelimiterCharacters().includes(char)) {
        closedParensCount--;
      }

      if (walkingPosition.isAtDocumentBegin()) {
        break;
      }

      walkingPosition = walkingPosition.getLeftThroughLineBreaks(true);
    }

    return delimiterPosition;
  }

  private static findRightArgumentBoundary(
    document: TextDocument,
    position: Position,
    ignoreSeparators: boolean = false,
  ): Position | undefined {
    let delimiterPosition: Position | undefined;
    let walkingPosition = position;
    let openedParensCount = 0;

    while (true) {
      const char = TextEditor.getCharAt(document, walkingPosition);
      if (openedParensCount === 0) {
        let isOnBoundary: boolean = SelectArgument.closingDelimiterCharacters().includes(char);
        if (!ignoreSeparators) {
          isOnBoundary ||= SelectArgument.separatorCharacters().includes(char);
        }

        if (isOnBoundary) {
          delimiterPosition = walkingPosition;
          break;
        }
      }
      if (SelectArgument.openingDelimiterCharacters().includes(char)) {
        openedParensCount++;
      }
      if (SelectArgument.closingDelimiterCharacters().includes(char)) {
        openedParensCount--;
      }

      if (walkingPosition.isAtDocumentEnd(document)) {
        break;
      }

      // We need to include the EOL so that isAtDocumentEnd actually
      // becomes true.
      walkingPosition = walkingPosition.getRightThroughLineBreaks(true);
    }

    return delimiterPosition;
  }
}

@RegisterAction
export class SelectInnerArgument extends SelectArgument {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['i', 'a'];
}

@RegisterAction
export class SelectAroundArgument extends SelectArgument {
  override modes = [Mode.Normal, Mode.Visual];
  keys = ['a', 'a'];
  override selectAround = true;
}
