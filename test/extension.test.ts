import * as assert from 'assert';
import * as vscode from 'vscode';

import * as srcConfiguration from '../src/configuration/configuration';
import * as testConfiguration from './testConfiguration';

suite('package.json', () => {
  let pkg: any;

  suiteSetup(() => {
    pkg = require(__dirname + '/../../package.json');
    assert.ok(pkg);
  });

  test('all keys have handlers', async () => {
    let registeredCommands = await vscode.commands.getCommands();
    let keybindings = pkg.contributes.keybindings;
    assert.ok(keybindings);

    for (let i = 0; i < keybindings.length; i++) {
      let keybinding = keybindings[i];

      const found = registeredCommands.includes(keybinding.command);
      assert.ok(
        found,
        'Missing handler for key=' + keybinding.key + '. Expected handler=' + keybinding.command
      );
    }
  });

  test('all defined configurations in package.json have handlers', async () => {
    // package.json
    let pkgConfigurations = pkg.contributes.configuration.properties;
    assert.ok(pkgConfigurations);
    let keys = Object.keys(pkgConfigurations);
    assert.notEqual(keys.length, 0);

    // configuration
    let handlers = Object.keys(srcConfiguration.configuration);
    let unhandled = keys.filter(k => handlers.includes(k));
    assert.equal(unhandled, 0, 'Missing src handlers for ' + unhandled.join(','));

    // test configuration
    handlers = Object.keys(new testConfiguration.Configuration());
    unhandled = keys.filter(k => handlers.includes(k));
    assert.equal(unhandled, 0, 'Missing test handlers for ' + unhandled.join(','));
  });
});
