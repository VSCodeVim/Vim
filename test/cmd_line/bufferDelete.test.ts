import * as assert from 'assert';
import * as vscode from 'vscode';

import { join } from 'path';
import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import * as error from '../../src/error';
import { ModeHandler } from '../../src/mode/modeHandler';
import * as t from '../testUtils';

suite('Buffer delete', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await t.setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  for (const cmd of ['bdelete', 'bdel', 'bd']) {
    test(`${cmd} deletes the current buffer`, async () => {
      await new ExCommandLine(cmd, modeHandler.vimState.currentMode).run(modeHandler.vimState);
      await t.waitForEditorsToClose();

      assert.strictEqual(vscode.window.visibleTextEditors.length, 0);
    });
  }

  test('bd does not delete buffer when there are unsaved changes', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
    try {
      await new ExCommandLine('bd', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    } catch (e) {
      assert.strictEqual(e, error.VimError.fromCode(error.ErrorCode.NoWriteSinceLastChange));
    }
  });

  test('bd! deletes the current buffer regardless of unsaved changes', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);

    await new ExCommandLine('bd!', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    await t.waitForEditorsToClose();

    assert.strictEqual(vscode.window.visibleTextEditors.length, 0);
  });

  test.skip("bd 'N' deletes the Nth buffer open", async () => {
    const dirPath = await t.createDir();
    const filePaths: string[] = [];

    try {
      for (let i = 0; i < 3; i++) {
        const uri: vscode.Uri = vscode.Uri.parse(join(dirPath, `${i}`));
        filePaths.push(uri.toString());
        void vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) => {
          void doc.save();
        });
      }

      await new ExCommandLine('bd 2', modeHandler.vimState.currentMode).run(modeHandler.vimState);
      await vscode.commands.executeCommand('workbench.action.openEditorAtIndex2');

      assert.strictEqual(vscode.window.visibleTextEditors.length, 2);
      assert.strictEqual(vscode.window.activeTextEditor?.document.uri.fsPath, filePaths[2]);
    } finally {
      await vscode.workspace.fs.delete(vscode.Uri.file(dirPath), { recursive: true });
    }
  });
});
