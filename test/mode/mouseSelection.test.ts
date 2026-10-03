import { strict as assert } from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, setupWorkspace } from './../testUtils';

// Coverage for mouse-driven selection. The harness has no real mouse-event
// simulator, so we synthesize a TextEditorSelectionChangeEvent with kind=Mouse
// and dispatch it directly to `modeHandler.handleSelectionChange` — this is
// the same path VSCode itself triggers on mouse-up. We then send Vim operator
// keys and verify they act on the full selection range.

const simulateMouseDrag = async (
  modeHandler: ModeHandler,
  anchor: vscode.Position,
  active: vscode.Position,
): Promise<void> => {
  const editor = modeHandler.vimState.editor;
  editor.selection = new vscode.Selection(anchor, active);
  await modeHandler.handleSelectionChange({
    textEditor: editor,
    selections: [editor.selection],
    kind: vscode.TextEditorSelectionChangeKind.Mouse,
  });
};

const simulateMouseClick = async (
  modeHandler: ModeHandler,
  position: vscode.Position,
): Promise<void> => {
  const editor = modeHandler.vimState.editor;
  editor.selection = new vscode.Selection(position, position);
  await modeHandler.handleSelectionChange({
    textEditor: editor,
    selections: [editor.selection],
    kind: vscode.TextEditorSelectionChangeKind.Mouse,
  });
};

const seedHelloWorld = async (modeHandler: ModeHandler): Promise<void> => {
  await modeHandler.handleMultipleKeyEvents('ihello world'.split(''));
  await modeHandler.handleKeyEvent('<Esc>');
  await modeHandler.handleKeyEvent('0');
};

const seedTwoLines = async (modeHandler: ModeHandler): Promise<void> => {
  await modeHandler.handleMultipleKeyEvents('ihello'.split(''));
  await modeHandler.handleKeyEvent('\n');
  await modeHandler.handleMultipleKeyEvents('world'.split(''));
  await modeHandler.handleKeyEvent('<Esc>');
  await modeHandler.handleKeyEvent('g');
  await modeHandler.handleKeyEvent('g');
  await modeHandler.handleKeyEvent('0');
};

suite('mouse drag → Visual', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
  });

  test('drag from Normal enters Visual', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
  });

  test('d after drag deletes the full selection', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleKeyEvent('d');
    assertEqualLines([' world']);
  });

  test('y after drag leaves the document unchanged and exits to Normal', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleKeyEvent('y');
    assertEqualLines(['hello world']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  test('c after drag deletes selection and enters Insert', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleKeyEvent('c');
    assertEqualLines([' world']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
  });

  test('drag updates lastVisualSelection so gv reselects', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleKeyEvent('<Esc>');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);

    await modeHandler.handleKeyEvent('g');
    await modeHandler.handleKeyEvent('v');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
    await modeHandler.handleKeyEvent('d');
    assertEqualLines([' world']);
  });

  test('second drag while already in Visual updates selection without double-promoting', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 3));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await modeHandler.handleKeyEvent('d');
    assertEqualLines([' world']);
  });
});

suite('mouse drag → cross-line', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
  });

  test('drag from line 0 col 0 to line 1 col 3 enters Visual; d deletes across lines', async () => {
    await seedTwoLines(modeHandler);
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(1, 3));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await modeHandler.handleKeyEvent('d');
    assertEqualLines(['ld']);
  });

  test('drag past EOL on a line caps the right edge but selection still spans correctly', async () => {
    await seedHelloWorld(modeHandler);
    // active = col 50 is far past 'hello world' (11 chars). modeHandler should
    // not let the empty-selection past-EOL guard fire because anchor !== active.
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 50));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await modeHandler.handleKeyEvent('d');
    assertEqualLines(['']);
  });

  test('right-to-left drag selects the same range as left-to-right drag', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 5), new vscode.Position(0, 0));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await modeHandler.handleKeyEvent('d');
    assertEqualLines([' world']);
  });
});

suite('mouse drag from Insert / Replace → pseudo-Visual', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
  });

  test('drag from Insert enters Visual with modeBeforeEnteringVisualMode=Insert', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('i');
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
    assert.strictEqual(modeHandler.vimState.modeBeforeEnteringVisualMode, Mode.Insert);
    assert.strictEqual(modeHandler.vimState.currentModeWithoutOperatorPending, Mode.InsertVisual);
  });

  test('Insert + drag + Esc returns to Insert (not Normal)', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('i');
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleKeyEvent('<Esc>');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
  });

  test('Insert + drag + d deletes selection and returns to Insert', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('i');
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleKeyEvent('d');
    assertEqualLines([' world']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
  });

  test('drag from Replace enters Visual with modeBeforeEnteringVisualMode=Replace', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('R');
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
    assert.strictEqual(modeHandler.vimState.modeBeforeEnteringVisualMode, Mode.Replace);
    assert.strictEqual(modeHandler.vimState.currentModeWithoutOperatorPending, Mode.ReplaceVisual);
  });

  test('Replace + drag + Esc returns to Replace (not Normal)', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('R');
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleKeyEvent('<Esc>');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Replace);
  });
});

suite('mouse click (empty selection)', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
  });

  test('click in Normal moves the cursor and stays in Normal', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseClick(modeHandler, new vscode.Position(0, 6));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    assert.strictEqual(modeHandler.vimState.cursorStopPosition.character, 6);
  });

  test('click in Insert keeps Insert and moves cursor', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('i');
    await simulateMouseClick(modeHandler, new vscode.Position(0, 6));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
    assert.strictEqual(modeHandler.vimState.cursorStopPosition.character, 6);
  });

  test('click in Replace keeps Replace and moves cursor', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('R');
    await simulateMouseClick(modeHandler, new vscode.Position(0, 6));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Replace);
    assert.strictEqual(modeHandler.vimState.cursorStopPosition.character, 6);
  });

  test('click in Visual exits to Normal', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('v');
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await simulateMouseClick(modeHandler, new vscode.Position(0, 3));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  test('click in pseudo-(insert)Visual returns to Insert (relies on setCurrentMode override)', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('i');
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentModeWithoutOperatorPending, Mode.InsertVisual);

    await simulateMouseClick(modeHandler, new vscode.Position(0, 7));
    assert.strictEqual(
      modeHandler.vimState.currentMode,
      Mode.Insert,
      'MoveLeftMouse calls setCurrentMode(Normal); the leave-Visual override must redirect to Insert',
    );
  });

  test('click in pseudo-(replace)Visual returns to Replace', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('R');
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentModeWithoutOperatorPending, Mode.ReplaceVisual);

    await simulateMouseClick(modeHandler, new vscode.Position(0, 7));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Replace);
  });
});

suite('mouse click past EOL', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
  });

  test('click past EOL in Normal caps cursor at the last char', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseClick(modeHandler, new vscode.Position(0, 50));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
    // 'hello world' length = 11; in Normal mode cursor cannot go past the last char.
    assert.strictEqual(modeHandler.vimState.cursorStopPosition.character, 10);
  });

  test('click past EOL in Insert moves cursor to lineEnd (Insert can be at lineEnd)', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('i');
    await simulateMouseClick(modeHandler, new vscode.Position(0, 50));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
    // 'hello world' length = 11; in Insert the cursor is allowed at lineEnd (col 11).
    // VSCode caps the selection at lineEnd before the handler runs, so the
    // dispatched <LeftMouse> lands on col 11.
    assert.strictEqual(modeHandler.vimState.cursorStopPosition.character, 11);
  });
});

suite('mouseSelectionGoesIntoVisualMode = false', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace({ config: { mouseSelectionGoesIntoVisualMode: false } });
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
  });

  test('drag from Normal does NOT enter Visual', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
  });

  test('drag from Insert does NOT enter Visual', async () => {
    await seedHelloWorld(modeHandler);
    await modeHandler.handleKeyEvent('i');
    await simulateMouseDrag(modeHandler, new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
  });
});

suite('<LeftMouse> remap', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace({
      config: {
        normalModeKeyBindings: [
          {
            before: ['<LeftMouse>'],
            after: ['i'],
          },
        ],
      },
    });
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler);
    modeHandler = handler;
  });

  test('single click in Normal triggers a remapped <LeftMouse>', async () => {
    await seedHelloWorld(modeHandler);
    await simulateMouseClick(modeHandler, new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
  });
});
