import { Position, Range } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { PositionDiff, sorted } from '../../common/motion/position';
import { configuration } from '../../configuration/configuration';
import { Mode } from '../../mode/mode';
import { RegisterMode } from '../../register/register';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import { isTextTransformation } from '../../transformations/transformations';
import { RegisterAction, BaseCommand } from '../base';

@RegisterAction
class ActionJoin extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['J'];
  override createsUndoPoint = true;
  override runsOnceForEachCountPrefix = false;

  public async execJoinLines(
    startPosition: Position,
    position: Position,
    vimState: VimState,
    count: number,
  ): Promise<void> {
    count = count - 1 || 1;

    const joinspaces = configuration.joinspaces;

    let startLineNumber: number;
    let endLineNumber: number;

    if (startPosition.isEqual(position) || startPosition.line === position.line) {
      if (position.line + 1 < vimState.document.lineCount) {
        startLineNumber = position.line;
        endLineNumber = position.getDown(count).line;
      } else {
        startLineNumber = position.line;
        endLineNumber = position.line;
      }
    } else {
      startLineNumber = startPosition.line;
      endLineNumber = position.line;
    }

    let trimmedLinesContent = vimState.document.lineAt(startPosition).text;
    let columnDeltaOffset: number = 0;

    for (let i = startLineNumber + 1; i <= endLineNumber; i++) {
      const line = vimState.document.lineAt(i);

      if (line.firstNonWhitespaceCharacterIndex < line.text.length) {
        // Compute number of spaces to separate the lines
        let insertSpace = ' ';

        if (trimmedLinesContent === '' || trimmedLinesContent.endsWith('\t')) {
          insertSpace = '';
        } else if (
          joinspaces &&
          (trimmedLinesContent.endsWith('.') ||
            trimmedLinesContent.endsWith('!') ||
            trimmedLinesContent.endsWith('?'))
        ) {
          insertSpace = '  ';
        } else if (
          joinspaces &&
          (trimmedLinesContent.endsWith('. ') ||
            trimmedLinesContent.endsWith('! ') ||
            trimmedLinesContent.endsWith('? '))
        ) {
          insertSpace = ' ';
        } else if (trimmedLinesContent.endsWith(' ')) {
          insertSpace = '';
        }

        const lineTextWithoutIndent = line.text.substring(line.firstNonWhitespaceCharacterIndex);

        if (lineTextWithoutIndent.charAt(0) === ')') {
          insertSpace = '';
        }

        trimmedLinesContent += insertSpace + lineTextWithoutIndent;
        columnDeltaOffset = lineTextWithoutIndent.length + insertSpace.length;
      }
    }

    const deleteStartPosition = new Position(startLineNumber, 0);
    const deleteEndPosition = new Position(endLineNumber, TextEditor.getLineLength(endLineNumber));

    if (!deleteStartPosition.isEqual(deleteEndPosition)) {
      if (startPosition.isEqual(position)) {
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: trimmedLinesContent,
          range: new Range(deleteStartPosition, deleteEndPosition),
          diff: PositionDiff.offset({
            character: trimmedLinesContent.length - columnDeltaOffset - position.character,
          }),
        });
      } else {
        vimState.recordedState.transformer.addTransformation({
          type: 'replaceText',
          text: trimmedLinesContent,
          range: new Range(deleteStartPosition, deleteEndPosition),
          manuallySetCursorPositions: true,
        });

        vimState.cursorStartPosition = vimState.cursorStopPosition = new Position(
          startPosition.line,
          trimmedLinesContent.length - columnDeltaOffset,
        );
        await vimState.setCurrentMode(Mode.Normal);
      }
    }
  }

  public override async execCount(position: Position, vimState: VimState): Promise<void> {
    const cursorsToIterateOver = vimState.cursors
      .map((x) => new Cursor(x.start, x.stop))
      .sort((a, b) =>
        a.start.line > b.start.line ||
        (a.start.line === b.start.line && a.start.character > b.start.character)
          ? 1
          : -1,
      );

    const resultingCursors: Cursor[] = [];
    for (const [idx, { start, stop }] of cursorsToIterateOver.entries()) {
      this.multicursorIndex = idx;

      vimState.cursorStopPosition = stop;
      vimState.cursorStartPosition = start;

      await this.execJoinLines(start, stop, vimState, vimState.recordedState.count || 1);

      resultingCursors.push(new Cursor(vimState.cursorStartPosition, vimState.cursorStopPosition));

      for (const transformation of vimState.recordedState.transformer.transformations) {
        if (isTextTransformation(transformation) && transformation.cursorIndex === undefined) {
          transformation.cursorIndex = this.multicursorIndex;
        }
      }
    }

    vimState.cursors = resultingCursors;
  }
}

@RegisterAction
class ActionJoinVisualMode extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['J'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(vimState.editor.selection.start, vimState.editor.selection.end);

    /**
     * For joining lines, Visual Line behaves the same as Visual so we align the register mode here.
     */
    vimState.currentRegisterMode = RegisterMode.CharacterWise;
    await new ActionJoin().execJoinLines(start, end, vimState, 1);
  }
}

@RegisterAction
class ActionJoinVisualBlockMode extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['J'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);

    vimState.currentRegisterMode = RegisterMode.CharacterWise;
    await new ActionJoin().execJoinLines(start, end, vimState, 1);
  }
}

@RegisterAction
class ActionJoinNoWhitespace extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'J'];
  override createsUndoPoint = true;

  // gJ is essentially J without the edge cases. ;-)

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.line === vimState.document.lineCount - 1) {
      return; // TODO: bell
    }

    const count = vimState.recordedState.count > 2 ? vimState.recordedState.count - 1 : 1;
    await this.execJoin(count, position, vimState);
  }

  public async execJoin(count: number, position: Position, vimState: VimState): Promise<void> {
    const replaceRange = new Range(
      new Position(position.line, 0),
      new Position(
        Math.min(position.line + count, vimState.document.lineCount - 1),
        0,
      ).getLineEnd(),
    );

    const joinedText = vimState.document.getText(replaceRange).replace(/\r?\n/g, '');

    // Put the cursor at the start of the last joined line's text
    const newCursorColumn =
      joinedText.length - vimState.document.lineAt(replaceRange.end).text.length;

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      range: replaceRange,
      text: joinedText,
      diff: PositionDiff.exactCharacter({
        character: newCursorColumn,
      }),
    });
  }
}

@RegisterAction
class ActionJoinNoWhitespaceVisualMode extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['g', 'J'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    const count = start.line === end.line ? 1 : end.line - start.line;
    await new ActionJoinNoWhitespace().execJoin(count, start, vimState);
    await vimState.setCurrentMode(Mode.Normal);
  }
}
