import * as assert from 'assert';
import * as vscode from 'vscode';

import * as testConfiguration from '../testConfiguration';

import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { cleanUpWorkspace, setupWorkspace, WaitForEditorsToClose } from './../testUtils';

suite('Quit', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    const configuration = new testConfiguration.Configuration();
    await setupWorkspace(configuration);
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  for (const cmd of ['q', 'quit']) {
    test(`:${cmd} does not quit the second split`, async () => {
      await new ExCommandLine('new', modeHandler.vimState.currentMode).run(modeHandler.vimState);
      await new ExCommandLine('enew', modeHandler.vimState.currentMode).run(modeHandler.vimState);
      await new ExCommandLine(cmd, modeHandler.vimState.currentMode).run(modeHandler.vimState);

      await WaitForEditorsToClose(2);

      assert.strictEqual(
        vscode.window.visibleTextEditors.length,
        2,
        'Editor did not split in 1 sec'
      );
    });
  }
});

suite('Quit all editors in split', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    const configuration = new testConfiguration.Configuration();
    configuration.closeSplitEditorsOnQuit = true;
    await setupWorkspace(configuration);
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  for (const cmd of ['q', 'quit']) {
    test(`:${cmd} quits the second split`, async () => {
      await new ExCommandLine('new', modeHandler.vimState.currentMode).run(modeHandler.vimState);
      await new ExCommandLine('enew', modeHandler.vimState.currentMode).run(modeHandler.vimState);
      await new ExCommandLine(cmd, modeHandler.vimState.currentMode).run(modeHandler.vimState);

      await WaitForEditorsToClose(1);

      assert.strictEqual(
        vscode.window.visibleTextEditors.length,
        1,
        'Editor did not split in 1 sec'
      );
    });
  }
});
