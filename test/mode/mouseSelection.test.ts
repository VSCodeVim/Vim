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
//
// This guards against an off-by-one bug class where the mouse path would only
// update one cursor endpoint, leaving the other stale at its pre-drag value;
// operators like `d`/`y`/`c` would then act on a 1-char range starting at the
// stale endpoint instead of the full selection.

suite('mouse selection', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    const handler = await getAndUpdateModeHandler();
    assert.ok(handler, 'expected a ModeHandler for the active editor');
    modeHandler = handler;
  });

  /**
   * Set the editor selection from `anchor` to `active` and dispatch a
   * synthetic Mouse-kind selection-change event the way VSCode itself would.
   */
  const simulateMouseDrag = async (
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

  /** Type `hello world` into a fresh buffer, exit to Normal at column 0. */
  const setupHelloWorld = async (): Promise<void> => {
    await modeHandler.handleMultipleKeyEvents('ihello world'.split(''));
    await modeHandler.handleKeyEvent('<Esc>');
    await modeHandler.handleKeyEvent('0');
  };

  test('mouse drag from Normal enters Visual', async () => {
    await setupHelloWorld();
    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);
  });

  test('d after a mouse drag deletes the full selection', async () => {
    await setupHelloWorld();
    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 5));
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

    await modeHandler.handleKeyEvent('d');
    assertEqualLines([' world']);
  });

  test('y after a mouse drag leaves the document unchanged and exits to Normal', async () => {
    await setupHelloWorld();
    await simulateMouseDrag(new vscode.Position(0, 0), new vscode.Position(0, 5));
    await modeHandler.handleKeyEvent('y');

    assertEqualLines(['hello world']);
    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Normal);
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
    assert.ok(handler, 'expected a ModeHandler for the active editor');
    modeHandler = handler;
  });

  /** Single empty-selection click at the given position. */
  const simulateMouseClick = async (position: vscode.Position): Promise<void> => {
    const editor = modeHandler.vimState.editor;
    editor.selection = new vscode.Selection(position, position);
    await modeHandler.handleSelectionChange({
      textEditor: editor,
      selections: [editor.selection],
      kind: vscode.TextEditorSelectionChangeKind.Mouse,
    });
  };

  test('single click in Normal triggers a remapped <LeftMouse>', async () => {
    await modeHandler.handleMultipleKeyEvents('ihello world'.split(''));
    await modeHandler.handleKeyEvent('<Esc>');
    await modeHandler.handleKeyEvent('0');

    await simulateMouseClick(new vscode.Position(0, 5));

    assert.strictEqual(modeHandler.vimState.currentMode, Mode.Insert);
  });
});
