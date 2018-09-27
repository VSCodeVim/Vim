import * as vscode from 'vscode';
import * as assert from 'assert';

import { cleanUpWorkspace, setupWorkspace } from './testUtils';
import { ModeName } from '../src/mode/mode';
import { VimState } from '../src/state/vimState';

suite('Vim State', () => {
  let vimState: VimState;

  setup(async () => {
    await setupWorkspace();
    vimState = new VimState(vscode.window.activeTextEditor!, false);
  });

  teardown(cleanUpWorkspace);

  test('can send event onVimModeChanged', (done) => {
    vimState.currentMode = ModeName.Normal;
    vimState.onVimModeChanged(e => {
      assert.equal(e.newMode, ModeName.Insert);
      done();
    });

    vimState.currentMode = ModeName.Insert;
  });
});
