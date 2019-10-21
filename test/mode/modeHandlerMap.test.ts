import * as assert from 'assert';

import { ModeHandlerMap } from '../../src/mode/modeHandlerMap';

suite('Mode Handler Map', () => {
  setup(() => {
    ModeHandlerMap.clear();
  });

  teardown(() => {
    ModeHandlerMap.clear();
  });

  test('getOrCreate', async () => {
    // getOrCreate
    const key = Math.random()
      .toString(36)
      .substring(7);
    let [modeHandler, isNew] = await ModeHandlerMap.getOrCreate(key);
    assert.strictEqual(isNew, true);
    assert.notEqual(modeHandler, undefined);

    [, isNew] = await ModeHandlerMap.getOrCreate(key);
    assert.strictEqual(isNew, false);

    // getKeys
    const keys = ModeHandlerMap.getKeys();
    assert.strictEqual(keys.length, 1);
    assert.strictEqual(keys[0], key);

    // getAll
    const modeHandlerList = ModeHandlerMap.getAll();
    assert.strictEqual(modeHandlerList.length, 1);

    // delete
    ModeHandlerMap.delete(key);
    assert.strictEqual(ModeHandlerMap.getAll().length, 0);
  });
});
