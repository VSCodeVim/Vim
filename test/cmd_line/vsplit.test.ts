import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension.ts';
import { ExCommandLine } from '../../src/cmd_line/commandLine.ts';
import { ModeHandler } from '../../src/mode/modeHandler.ts';
import { setupWorkspace, waitForEditorsToClose } from './../testUtils.ts';

suite('Vertical split', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  for (const cmd of ['vs', 'vsp', 'vsplit', 'vnew', 'vne']) {
    test(`:${cmd} creates a second split`, async () => {
      await new ExCommandLine(cmd, modeHandler.vimState.currentMode).run(modeHandler.vimState);
      await waitForEditorsToClose(2);

      assert.strictEqual(
        vscode.window.visibleTextEditors.length,
        2,
        'Editor did not split in 1 sec',
      );
    });
  }
});
