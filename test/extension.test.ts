"use strict";

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as _ from 'lodash';

suite("package.json", () => {
  test("all keys have handlers", async () => {
    let pkg = require(__dirname + '/../../package.json');
    assert.ok(pkg);

    let registeredCommands = await vscode.commands.getCommands();
    let keybindings = pkg.contributes.keybindings;
    assert.ok(pkg);

    for (let i = 0; i < keybindings.length; i++) {
      let keybinding = keybindings[i];

      var found = registeredCommands.indexOf(keybinding.command) >= -1;
      assert.ok(found, "Missing handler for key=" + keybinding.key + ". Expected handler=" + keybinding.command);
    }
  });
});
