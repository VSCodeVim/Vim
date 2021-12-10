import * as assert from 'assert';
import { Uri } from 'vscode';

import { ModeHandlerMap } from '../../src/mode/modeHandlerMap';

function createRandomUri(): Uri {
  return Uri.file(Math.random().toString(36).substring(7));
}

suite.only('Mode Handler Map', () => {
  setup(() => {
    ModeHandlerMap.clear();
  });

  teardown(() => {
    ModeHandlerMap.clear();
  });

  test('getOrCreate', async () => {
    const key = createRandomUri();
    let [modeHandler, isNew] = await ModeHandlerMap.getOrCreate(key);
    assert.strictEqual(isNew, true);
    assert.notStrictEqual(modeHandler, undefined);

    [, isNew] = await ModeHandlerMap.getOrCreate(key);
    assert.strictEqual(isNew, false);

    assert.deepStrictEqual([...ModeHandlerMap.keys()], [key], 'keys');

    // getAll
    assert.strictEqual(ModeHandlerMap.getAll().length, 1, 'getAll() should have only returned one');

    // delete
    ModeHandlerMap.delete(key);
    assert.strictEqual(ModeHandlerMap.getAll().length, 0);
  });

  test('get', async () => {
    // same file name should return the same modehandler
    const identity = createRandomUri();

    let [modeHandler, isNew] = await ModeHandlerMap.getOrCreate(identity);
    assert.strictEqual(isNew, true);
    assert.notStrictEqual(modeHandler, undefined);

    const prevModeHandler = modeHandler;
    [modeHandler, isNew] = await ModeHandlerMap.getOrCreate(identity);
    assert.strictEqual(isNew, false);
    assert.strictEqual(prevModeHandler, modeHandler);
  });
});
