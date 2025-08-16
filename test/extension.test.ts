import * as assert from 'assert';
import * as vscode from 'vscode';

import * as srcConfiguration from '../src/configuration/configuration';
import * as testConfiguration from './testConfiguration';

import * as packagejson from '../package.json';

suite('package.json', () => {
  test('all keys have handlers', async () => {
    const registeredCommands = await vscode.commands.getCommands();
    const keybindings = packagejson.contributes.keybindings;
    assert.ok(keybindings);

    for (const keybinding of keybindings) {
      const found = registeredCommands.includes(keybinding.command);
      assert.ok(
        found,
        'Missing handler for key=' + keybinding.key + '. Expected handler=' + keybinding.command,
      );
    }
  });

  test('all defined configurations in package.json have handlers', async () => {
    // package.json
    const pkgConfigurations = packagejson.contributes.configuration.properties;
    assert.ok(pkgConfigurations);
    const keys = Object.keys(pkgConfigurations);
    assert.notStrictEqual(keys.length, 0);

    // configuration
    let handlers = Object.keys(srcConfiguration.configuration);
    let unhandled = keys.filter((k) => handlers.includes(k));
    assert.strictEqual(unhandled.length, 0, 'Missing src handlers for ' + unhandled.join(','));

    // test configuration
    handlers = Object.keys(new testConfiguration.Configuration());
    unhandled = keys.filter((k) => handlers.includes(k));
    assert.strictEqual(unhandled.length, 0, 'Missing test handlers for ' + unhandled.join(','));
  });
});
