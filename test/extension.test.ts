import * as assert from 'assert';
import * as vscode from 'vscode';

import * as srcConfiguration from '../src/configuration/configuration';
import * as testConfiguration from './testConfiguration';

import * as packagejson from '../package.json';
import { IConfiguration } from 'src/configuration/iconfiguration';

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
    assert.ok(keys.every((key) => key.startsWith('vim.')));

    const isUnhandled = (configuration: IConfiguration, key: string): boolean => {
      const keyFirstSegment = key.split('.')[1]; // Extract the first segment without the `vim.` prefix from `key`, e.g. get `foo` from 'vim.foo.bar.baz'.

      const handlers = Object.keys(configuration);
      const propertyExists = handlers.includes(keyFirstSegment);
      if (propertyExists) {
        return false;
      }

      // If the property doesn't exist, check the possibility that the field is implemented as a get proxy by calling it.
      if (configuration[keyFirstSegment]) {
        return false;
      }

      return true;
    };

    // configuration
    const srcUnhandled = keys.filter(isUnhandled.bind(null, srcConfiguration.configuration));
    assert.strictEqual(
      srcUnhandled.length,
      0,
      'Missing src handlers for ' + srcUnhandled.join(','),
    );

    // test configuration
    const testConfigurationInstance = new testConfiguration.Configuration();
    const testUnhandled = keys.filter(isUnhandled.bind(null, testConfigurationInstance));
    assert.strictEqual(
      testUnhandled.length,
      0,
      'Missing test handlers for ' + testUnhandled.join(','),
    );
  });
});
