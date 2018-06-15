import * as assert from 'assert';

import * as srcConfiguration from '../../src/configuration/configuration';
import * as testConfiguration from '../testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';
import { getTestingFunctions } from '../testSimplifier';
import { ModeName } from '../../src/mode/mode';

suite('Configuration', () => {
  const { newTest } = getTestingFunctions();
  const configuration = new testConfiguration.Configuration();
  configuration.leader = '<space>';
  configuration.otherModesKeyBindingsNonRecursive = [
    {
      before: ['leader', 'o'],
      after: ['o', 'eSc', 'k'],
    },
    {
      before: ['<leader>', 'f', 'e', 's'],
      after: ['v'],
    },
  ];

  setup(async () => {
    await setupWorkspace(configuration);
  });

  teardown(cleanUpWorkspace);

  test('remappings are normalized', async () => {
    const normalizedKeybinds = srcConfiguration.configuration.otherModesKeyBindingsNonRecursive;
    const testingKeybinds = configuration.otherModesKeyBindingsNonRecursive;

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
});
