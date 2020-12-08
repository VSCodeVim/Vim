import * as assert from 'assert';

import { getAndUpdateModeHandler } from '../../extension';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('Mode Handler', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  test('ctor', () => {
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);
  });

  test('can set current mode', async () => {
    assert.strictEqual(modeHandler.currentMode, Mode.Normal);

    await modeHandler.handleKeyEvent('i');
    assert.strictEqual(modeHandler.currentMode, Mode.Insert);
  });
});
