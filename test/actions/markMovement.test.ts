import assert from 'assert';
import { Position, Selection, TextDocument, window, workspace } from 'vscode';
import { BaseMarkMovement, MarkMovement, MarkMovementBOL } from '../../src/actions/motion';
import { EasyMotion } from '../../src/actions/plugins/easymotion/easymotion';
import { Cursor } from '../../src/common/motion/cursor';
import { VimState } from '../../src/state/vimState';
import { cleanUpWorkspace, replaceContent, setupWorkspace } from '../testUtils';
import { failedMovement } from '../../src/actions/baseMotion';

class Location {
  public position: Position;
  private getDocument?: () => TextDocument;

  public get document(): TextDocument | null {
    return this.getDocument?.() ?? null;
  }

  public constructor(line: number, column: number, getDocument?: () => TextDocument) {
    this.position = new Position(line, column);
    this.getDocument = getDocument;
  }
}

interface IMarkTestCase {
  name: string;
  start: Location;
  /** Defaults to lowercase if not set (local mark) */
  markName?: string;
  mark: Location;
  /** Overrides `markLocation` for when the expected location is different from the mark's location */
  expect?: Location;
  expectError?: Error;
  documentAContent?: string;
  documentBContent?: string;
}

suite('mark movement', () => {
  let vimState: VimState;
  let documentA: TextDocument;
  let documentB: TextDocument;

  setup(async () => {
    await setupWorkspace();
    vimState = new VimState(window.activeTextEditor!, new EasyMotion());
    await vimState.load();

    documentB = await workspace.openTextDocument({
      content: `line one\n    line two with four spaces of indentation\nline three\n`,
    });

    documentA = await workspace.openTextDocument({
      content: `line 1\n    line 2 with 4 spaces of indentation\nline 3\n`,
    });
  });

  teardown(async () => {
    await cleanUpWorkspace();
  });

  const newMarkTests = (
    testCases: IMarkTestCase[],
    movementFactory: (testCase: IMarkTestCase, markName: string) => BaseMarkMovement,
  ) => {
    for (const testCase of testCases) {
      const {
        name,
        markName,
        start,
        mark,
        documentAContent,
        documentBContent,
        expect,
        expectError,
      } = testCase;

      const arrangeTest = async () => {
        // Arrange
        if (documentAContent) await replaceContent(documentA, documentAContent);
        if (documentBContent) await replaceContent(documentB, documentBContent);

        const selection = new Selection(start.position, start.position);
        const editor = await window.showTextDocument(start.document ?? documentA, {
          selection,
        });

        vimState.cursors[0] = Cursor.FromVSCodeSelection(selection);
        vimState.editor = editor;

        const markToUse = markName || 'a';
        vimState.historyTracker.addMark(
          mark.document ?? vimState.document,
          mark.position,
          markToUse,
        );
        return movementFactory(testCase, markToUse);
      };

      if (expectError) {
        test(name, async () => {
          // Arrange
          const movement = await arrangeTest();

          // Act & Assert
          await assert.rejects(
            () => movement.execAction(vimState.cursorStartPosition, vimState),
            (err) => {
              assert.deepStrictEqual(err, expectError);
              return true;
            },
          );
        });
      } else {
        test(name, async () => {
          // Arrange
          const movement = await arrangeTest();

          // Act
          const result = await movement.execAction(vimState.cursorStartPosition, vimState);

          // Assert
          const _expect = expect ?? mark;
          if (_expect.document === start.document) {
            assert.deepStrictEqual(result, _expect.position, 'returned position must be correct');
          } else {
            // Movement fails so our position in the starting document doesn't get changed
            assert.deepStrictEqual(result, failedMovement(vimState), 'movement should have failed');
          }

          if (_expect.document) {
            assert.deepStrictEqual(
              window.activeTextEditor?.document,
              _expect.document,
              'active document must be correct',
            );
          }

          // If this test case is moving between documents then we need to check the actual editor's selection to
          // verify the cursor has been moved. This is because we rely on `vscode.window.showTextDocument` when jumping
          // between documents
          if (_expect.document !== start.document) {
            const editorPosition = window.activeTextEditor?.selection.active;
            assert.deepStrictEqual(
              editorPosition,
              _expect.position,
              'active selection must be correct when moving between documents',
            );
          }
        });
      }
    }
  };

  suite('MarkMovementBOL', () => {
    const sameLocationTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to correct position when mark is at same location',
        start: new Location(1, 4),
        mark: new Location(1, 4),
      },
      {
        name: 'global mark moves to correct position when mark is at same location',
        markName: 'A',
        start: new Location(1, 4),
        mark: new Location(1, 4),
      },
      {
        name: 'local mark stays at column 0 on empty line',
        start: new Location(1, 0),
        mark: new Location(1, 0),
        documentAContent: 'test\n',
      },
      {
        name: 'global mark stays at column 0 on empty line when mark is in same document',
        markName: 'A',
        start: new Location(1, 0),
        mark: new Location(1, 0),
        documentAContent: 'test\n',
      },
    ];

    const whitespaceTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to EOL on space only line',
        start: new Location(0, 0),
        mark: new Location(0, 0),
        documentAContent: ' '.repeat(4),
        expect: new Location(0, 4),
      },
      {
        name: 'global mark moves to EOL on space only line if in same document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(0, 0),
        documentAContent: ' '.repeat(4),
        expect: new Location(0, 4),
      },
      {
        name: 'global mark moves to EOL on space only line if in different document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(0, 0, () => documentB),
        documentBContent: ' '.repeat(4),
        expect: new Location(0, 4, () => documentB),
      },
      {
        name: 'local mark moves to EOL on tab only line',
        start: new Location(0, 0),
        mark: new Location(0, 0),
        documentAContent: '\t'.repeat(4),
        expect: new Location(0, 4),
      },
      {
        name: 'global mark moves to EOL on tab only line if in same document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(0, 0),
        documentAContent: '\t'.repeat(4),
        expect: new Location(0, 4),
      },
      {
        name: 'global mark moves to EOL on tab only line if in different document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(0, 0, () => documentB),
        documentBContent: '\t'.repeat(4),
        expect: new Location(0, 4, () => documentB),
      },
    ];

    const nonWhitespaceTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to first non-whitespace character',
        start: new Location(0, 0),
        mark: new Location(1, 0),
        expect: new Location(1, 4),
      },
      {
        name: 'global mark moves to first non-whitespace character in same document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(1, 0),
        expect: new Location(1, 4),
      },
      {
        name: 'global mark moves to first non-whitespace character in different document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(1, 0, () => documentB),
        expect: new Location(1, 4, () => documentB),
      },
    ];

    const pastLastLineEmptyTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to start of last line when mark is past last line and last line is empty',
        start: new Location(0, 0),
        mark: new Location(4, 0),
        expect: new Location(3, 0),
      },
      {
        name: 'global mark moves to start of last line when mark is past last line and last line is empty in same document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(4, 0),
        expect: new Location(3, 0),
      },
      {
        name: 'global mark moves to start of last line when mark is past last line and last line is empty in different document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(4, 0, () => documentB),
        expect: new Location(3, 0, () => documentB),
      },
    ];

    const pastLastLineNonEmptyTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to first non-whitespace character of last line when mark is past last line',
        start: new Location(0, 0),
        mark: new Location(4, 0),
        expect: new Location(1, 4),
        documentAContent: 'line 1\n    line 2 with 4 spaces of indentation',
      },
      {
        name: 'global mark moves to first non-whitespace character of last line when mark is past last line in same document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(4, 0),
        expect: new Location(1, 4),
        documentAContent: 'line 1\n    line 2 with 4 spaces of indentation',
      },
      {
        name: 'global mark moves to first non-whitespace character of last line when mark is past last line in different document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(4, 0, () => documentB),
        expect: new Location(1, 4, () => documentB),
        documentBContent: 'line 1\n    line 2 with 4 spaces of indentation',
      },
    ];

    const pastEndOfLineTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to first non-whitespace character when mark is past EOL',
        start: new Location(1, 0),
        mark: new Location(1, 11),
        expect: new Location(1, 4),
        documentAContent: 'line 1\n    line 2',
      },
      {
        name: 'global mark moves to first non-whitespace character when mark is past EOL in same document',
        markName: 'A',
        start: new Location(1, 0),
        mark: new Location(1, 11),
        expect: new Location(1, 4),
        documentAContent: 'line 1\n    line 2',
      },
      {
        name: 'global mark moves to first non-whitespace character when mark is past EOL in different document',
        markName: 'A',
        start: new Location(1, 0),
        mark: new Location(1, 11, () => documentB),
        expect: new Location(1, 4, () => documentB),
        documentBContent: 'line 1\n    line 2',
      },
    ];

    const testCases: IMarkTestCase[] = [
      ...sameLocationTests,
      ...whitespaceTests,
      ...nonWhitespaceTests,
      ...pastLastLineEmptyTests,
      ...pastLastLineNonEmptyTests,
      ...pastEndOfLineTests,
    ];

    newMarkTests(testCases, (testCase, markName) => new MarkMovementBOL(["'", markName]));

    test('throws error when mark is not set', async () => {
      // Arrange
      const movement = new MarkMovementBOL(["'", 'a']);

      // Act & Assert
      await assert.rejects(() => movement.execAction(vimState.cursorStartPosition, vimState));
    });
  });

  suite('MarkMovement', () => {
    const sameLocationTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to correct position when mark is at same location',
        start: new Location(1, 4),
        mark: new Location(1, 4),
      },
      {
        name: 'global mark moves to correct position when mark is at same location',
        markName: 'A',
        start: new Location(1, 4),
        mark: new Location(1, 4),
      },
      {
        name: 'local mark stays at column 0 on empty line',
        start: new Location(1, 0),
        mark: new Location(1, 0),
        documentAContent: 'test\n',
      },
      {
        name: 'global mark stays at column 0 on empty line when mark is in same document',
        markName: 'A',
        start: new Location(1, 0),
        mark: new Location(1, 0),
        documentAContent: 'test\n',
      },
    ];

    const whitespaceTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to exact position on space only line',
        start: new Location(0, 1),
        mark: new Location(0, 1),
        documentAContent: ' '.repeat(4),
      },
      {
        name: 'global mark moves to exact position on space only line if in same document',
        markName: 'A',
        start: new Location(0, 1),
        mark: new Location(0, 1),
        documentAContent: ' '.repeat(4),
      },
      {
        name: 'global mark moves to exact position on space only line if in different document',
        markName: 'A',
        start: new Location(0, 1),
        mark: new Location(0, 1, () => documentB),
        documentBContent: ' '.repeat(4),
      },
      {
        name: 'local mark moves to exact position on tab only line',
        start: new Location(0, 1),
        mark: new Location(0, 1),
        documentAContent: '\t'.repeat(4),
      },
      {
        name: 'global mark moves to exact position on tab only line if in same document',
        markName: 'A',
        start: new Location(0, 1),
        mark: new Location(0, 1),
        documentAContent: '\t'.repeat(4),
      },
      {
        name: 'global mark moves to exact position on tab only line if in different document',
        markName: 'A',
        start: new Location(0, 1),
        mark: new Location(0, 1, () => documentB),
        documentBContent: '\t'.repeat(4),
      },
    ];

    const nonWhitespaceTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to exact position with whitespace',
        start: new Location(0, 0),
        mark: new Location(1, 2),
      },
      {
        name: 'global mark moves to exact position with whitespace in same document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(1, 2),
      },
      {
        name: 'global mark moves to exact position with whitespace in different document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(1, 2, () => documentB),
      },
    ];

    const pastLastLineEmptyTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to end of last line when mark is past last line and last line is empty',
        start: new Location(0, 0),
        mark: new Location(4, 0),
        expect: new Location(3, 0),
      },
      {
        name: 'global mark moves to end of last line when mark is past last line and last line is empty in same document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(4, 0),
        expect: new Location(3, 0),
      },
      {
        name: 'global mark moves to end of last line when mark is past last line and last line is empty in different document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(4, 0, () => documentB),
        expect: new Location(3, 0, () => documentB),
      },
    ];

    const pastLastLineNonEmptyTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to end of last line when mark is past last line',
        start: new Location(0, 0),
        mark: new Location(4, 0),
        expect: new Location(1, 10),
        documentAContent: 'line 1\n    line 2',
      },
      {
        name: 'global mark moves to end of last line when mark is past last line in same document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(4, 0),
        expect: new Location(1, 10),
        documentAContent: 'line 1\n    line 2',
      },
      {
        name: 'global mark moves to end of last line when mark is past last line in different document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(4, 0, () => documentB),
        expect: new Location(1, 10, () => documentB),
        documentBContent: 'line 1\n    line 2',
      },
    ];

    const pastEndOfLineTests: IMarkTestCase[] = [
      {
        name: 'local mark moves to EOL when mark is past EOL',
        start: new Location(0, 0),
        mark: new Location(0, 7),
        expect: new Location(0, 6),
        documentAContent: 'line 1\n    line 2 with 4 spaces of indentation',
      },
      {
        name: 'global mark moves to EOL when mark is past EOL in same document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(0, 7),
        expect: new Location(0, 6),
        documentAContent: 'line 1\n    line 2 with 4 spaces of indentation',
      },
      {
        name: 'global mark moves to EOL when mark is past EOL in different document',
        markName: 'A',
        start: new Location(0, 0),
        mark: new Location(0, 7, () => documentB),
        expect: new Location(0, 6, () => documentB),
        documentBContent: 'line 1\n    line 2 with 4 spaces of indentation',
      },
    ];

    const testCases: IMarkTestCase[] = [
      ...sameLocationTests,
      ...whitespaceTests,
      ...nonWhitespaceTests,
      ...pastLastLineEmptyTests,
      ...pastLastLineNonEmptyTests,
      ...pastEndOfLineTests,
    ];

    newMarkTests(testCases, (testCase, markName) => new MarkMovement(['`', markName]));

    test('throws error when mark is not set', async () => {
      // Arrange
      const movement = new MarkMovement(['`', 'a']);

      // Act & Assert
      await assert.rejects(() => movement.execAction(vimState.cursorStartPosition, vimState));
    });
  });
});
