import * as assert from 'assert';
import * as srcConfiguration from '../../src/configuration/configuration';
import * as testConfiguration from '../testConfiguration';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';
import { getTestingFunctions } from '../testSimplifier';
import { Mode } from '../../src/mode/mode';

suite('Configuration', () => {
  const { newTest } = getTestingFunctions();
  const configuration = new testConfiguration.Configuration();
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

  setup(async () => {
    await setupWorkspace(configuration);
  });

  teardown(cleanUpWorkspace);

  test('remappings are normalized', async () => {
    const normalizedKeybinds = srcConfiguration.configuration.normalModeKeyBindingsNonRecursive;
    const normalizedKeybindsMap = srcConfiguration.configuration.normalModeKeyBindingsMap;
    const testingKeybinds = configuration.normalModeKeyBindingsNonRecursive;

    assert.strictEqual(normalizedKeybinds.length, testingKeybinds.length);
    assert.strictEqual(normalizedKeybinds.length, normalizedKeybindsMap.size);
    assert.deepEqual(normalizedKeybinds[0].before, [' ', 'o']);
    assert.deepEqual(normalizedKeybinds[0].after, ['o', '<Esc>', 'k']);
  });

  test('whichwrap is parsed into wrapKeys', async () => {
    const wrapKeys = srcConfiguration.configuration.wrapKeys;

    const h = 'h';
    const j = 'j';

    assert.strictEqual(wrapKeys[h], true);
    assert.strictEqual(wrapKeys[j], undefined);
  });

  newTest({
    title: 'Can handle long key chords',
    start: ['|'],
    // <leader>fes
    keysPressed: ' fes',
    end: ['|'],
    endMode: Mode.Visual,
  });
});
