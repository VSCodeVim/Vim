import * as assert from 'assert';

import * as srcConfiguration from '../../src/configuration/configuration';
import { Globals } from '../../src/globals';
import * as testConfiguration from '../testConfiguration';
import { reloadConfiguration } from '../testUtils';

suite('Configuration', () => {
  suiteSetup(() => {
    let configuration = new testConfiguration.Configuration();
    configuration.leader = '<space>';
    configuration.normalModeKeyBindingsNonRecursive = [
      {
        before: ['leader', 'o'],
        after: ['o', 'eSc', 'k'],
      },
    ];

    Globals.mockConfiguration = configuration;
    reloadConfiguration();
  });

  test('remappings are normalized', async () => {
    let configuration = srcConfiguration.configuration;
    let keybindings = configuration.normalModeKeyBindingsNonRecursive;

    assert.equal(keybindings.length, 1);
    assert.deepEqual(keybindings[0].before, [' ', 'o']);
    assert.deepEqual(keybindings[0].after, ['o', '<Esc>', 'k']);
  });
});
