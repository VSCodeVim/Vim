import * as assert from 'assert';

import * as srcConfiguration from '../../src/configuration/configuration';
import * as testConfiguration from '../testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';
import { getTestingFunctions } from '../testSimplifier';
import { ModeName } from '../../src/mode/mode';

suite('Configuration', () => {
  suiteSetup(() => {
    let configuration = new testConfiguration.Configuration();
    configuration.leader = '<space>';
    configuration.normalModeKeyBindingsNonRecursive = [
      {
        before: ['leader', 'o'],
        after: ['o', 'eSc', 'k'],
      },
      {
        before: ['<leader>', 'f', 'e', 's'],
        after: ['v'],
      },
    ];

    configuration.whichwrap = 'h,l';

    Globals.mockConfiguration = configuration;
    reloadConfiguration();
  });

  teardown(cleanUpWorkspace);

  test('remappings are normalized', async () => {
    const normalizedKeybinds = srcConfiguration.configuration.normalModeKeyBindingsNonRecursive;
    const testingKeybinds = configuration.normalModeKeyBindingsNonRecursive;

    assert.equal(normalizedKeybinds.length, testingKeybinds.length);
    assert.deepEqual(normalizedKeybinds[0].before, [' ', 'o']);
    assert.deepEqual(normalizedKeybinds[0].after, ['o', '<Esc>', 'k']);
  });

  newTest({
    title: 'Can handle long key chords',
    start: ['|'],
    keysPressed: ' fes',
    end: ['|'],
    endMode: ModeName.Visual,
  });

  test('whichwrap is parsed into wrapKeys', async () => {
    let configuration = srcConfiguration.configuration;

    const h = 'h';
    const j = 'j';

    assert.equal(configuration.wrapKeys[h], true);
    assert.equal(configuration.wrapKeys[j], undefined);
  });
});
