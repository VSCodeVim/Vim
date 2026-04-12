import * as assert from 'assert';
import {
  applyOperationToConfig,
  setOperationParser,
} from '../../src/cmd_line/commands/setOperation';
import { configuration } from '../../src/configuration/configuration';

function applySet(line: string): void {
  // `setOperationParser` starts with `whitespace.then(...)`, so prepend one
  // space so the bare tail parses through the whitespace consumer.
  const result = setOperationParser.parse(` ${line}`);
  assert.ok(result.status, `failed to parse 'set ${line}'`);
  applyOperationToConfig(configuration, result.value);
}

suite(':set clipboard', () => {
  const originalClipboard = configuration.clipboard;
  const originalUseSystem = configuration.useSystemClipboard;

  teardown(() => {
    configuration.clipboard = originalClipboard;
    configuration.useSystemClipboard = originalUseSystem;
  });

  test('clipboard defaults to empty and does not alias the unnamed register', () => {
    configuration.clipboard = '';
    configuration.useSystemClipboard = false;
    assert.strictEqual(configuration.clipboardAliasesUnnamedRegister, false);
  });

  test(':set clipboard=unnamed aliases the unnamed register', () => {
    configuration.clipboard = '';
    configuration.useSystemClipboard = false;
    applySet('clipboard=unnamed');
    assert.strictEqual(configuration.clipboard, 'unnamed');
    assert.strictEqual(configuration.clipboardAliasesUnnamedRegister, true);
  });

  test(':set clipboard=unnamedplus aliases the unnamed register', () => {
    configuration.clipboard = '';
    configuration.useSystemClipboard = false;
    applySet('clipboard=unnamedplus');
    assert.strictEqual(configuration.clipboard, 'unnamedplus');
    assert.strictEqual(configuration.clipboardAliasesUnnamedRegister, true);
  });

  test(':set clipboard= clears the option', () => {
    configuration.clipboard = 'unnamed';
    configuration.useSystemClipboard = false;
    applySet('clipboard=');
    assert.strictEqual(configuration.clipboard, '');
    assert.strictEqual(configuration.clipboardAliasesUnnamedRegister, false);
  });

  test('vim.useSystemClipboard still forces the alias even when clipboard is empty', () => {
    configuration.clipboard = '';
    configuration.useSystemClipboard = true;
    assert.strictEqual(configuration.clipboardAliasesUnnamedRegister, true);
  });
});
