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
    let key = Math.random()
      .toString(36)
      .substring(7);
    let [modeHandler, isNew] = await ModeHandlerMap.getOrCreate(key);
    assert.equal(isNew, true);
    assert.notEqual(modeHandler, undefined);

    [, isNew] = await ModeHandlerMap.getOrCreate(key);
    assert.equal(isNew, false);

    // getKeys
    let keys = ModeHandlerMap.getKeys();
    assert.equal(keys.length, 1);
    assert.equal(keys[0], key);

    // getAll
    let modeHandlerList = ModeHandlerMap.getAll();
    assert.equal(modeHandlerList.length, 1);

    // delete
    ModeHandlerMap.delete(key);
    assert.equal(ModeHandlerMap.getAll().length, 0);
  });
});
