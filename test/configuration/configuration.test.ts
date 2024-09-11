import * as assert from 'assert';
import * as srcConfiguration from '../../src/configuration/configuration';
import * as vscode from 'vscode';
import { setupWorkspace } from './../testUtils';
import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';
import { IConfiguration } from '../../src/configuration/iconfiguration';

const testConfig: Partial<IConfiguration> = {
  leader: '<space>',
  normalModeKeyBindingsNonRecursive: [
    {
      before: ['leader', 'o'],
      after: ['o', 'eSc', 'k'],
    },
    {
      before: ['<leader>', 'f', 'e', 's'],
      after: ['v'],
    },
  ],
  whichwrap: 'h,l',
};

suite('Configuration', () => {
  setup(async () => {
    await setupWorkspace({ config: testConfig });
  });

  test('remappings are normalized', async () => {
    const normalizedKeybinds = srcConfiguration.configuration.normalModeKeyBindingsNonRecursive;
    const normalizedKeybindsMap = srcConfiguration.configuration.normalModeKeyBindingsMap;
    const testingKeybinds = testConfig.normalModeKeyBindingsNonRecursive;

    assert.strictEqual(normalizedKeybinds.length, testingKeybinds!.length);
    assert.strictEqual(normalizedKeybinds.length, normalizedKeybindsMap.size);
    assert.deepStrictEqual(normalizedKeybinds[0].before, [' ', 'o']);
    assert.deepStrictEqual(normalizedKeybinds[0].after, ['o', '<Esc>', 'k']);
  });

  test('textwidth is configurable per-language', async () => {
    const globalVimConfig = vscode.workspace.getConfiguration('vim');
    const jsVimConfig = vscode.workspace.getConfiguration('vim', { languageId: 'javascript' });

    try {
      assert.strictEqual(jsVimConfig.get('textwidth'), 80);
      await jsVimConfig.update('textwidth', 120, vscode.ConfigurationTarget.Global, true);

      const updatedGlobalVimConfig = vscode.workspace.getConfiguration('vim');
      assert.strictEqual(updatedGlobalVimConfig.get('textwidth'), 80);

      const updatedJsVimConfig = vscode.workspace.getConfiguration('vim', {
        languageId: 'javascript',
      });
      assert.strictEqual(updatedJsVimConfig.get('textwidth'), 120);
    } finally {
      await globalVimConfig.update('textwidth', undefined, vscode.ConfigurationTarget.Global);
      await jsVimConfig.update('textwidth', undefined, vscode.ConfigurationTarget.Global);
    }
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
