import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { resolveUri, separatePath } from '../../src/util/path';

suite('util path', () => {
  suite('separatePath', () => {
    test('can separate drive letter path on Windows', () => {
      let [dirName, baseName] = separatePath('C:', path.win32.sep);
      assert.strictEqual(dirName, '');
      assert.strictEqual(baseName, 'C:');

      [dirName, baseName] = separatePath('C:\\', path.win32.sep);
      assert.strictEqual(dirName, 'C:\\');
      assert.strictEqual(baseName, '');

      [dirName, baseName] = separatePath('C:\\text', path.win32.sep);
      assert.strictEqual(dirName, 'C:\\');
      assert.strictEqual(baseName, 'text');

      [dirName, baseName] = separatePath('C:\\text\\123', path.win32.sep);
      assert.strictEqual(dirName, 'C:\\text\\');
      assert.strictEqual(baseName, '123');
    });

    test('can separate UNC path on Windows', () => {
      let [dirName, baseName] = separatePath('\\\\test', path.win32.sep);
      assert.strictEqual(dirName, '\\\\test');
      assert.strictEqual(baseName, '');

      [dirName, baseName] = separatePath('\\\\test\\', path.win32.sep);
      assert.strictEqual(dirName, '\\\\test\\');
      assert.strictEqual(baseName, '');

      [dirName, baseName] = separatePath('\\\\test\\abc', path.win32.sep);
      assert.strictEqual(dirName, '\\\\test\\');
      assert.strictEqual(baseName, 'abc');

      [dirName, baseName] = separatePath('\\\\test\\abc\\123', path.win32.sep);
      assert.strictEqual(dirName, '\\\\test\\abc\\');
      assert.strictEqual(baseName, '123');
    });

    test('can separate relative path on Windows', () => {
      let [dirName, baseName] = separatePath('.', path.win32.sep);
      assert.strictEqual(dirName, '');
      assert.strictEqual(baseName, '.');

      [dirName, baseName] = separatePath('.\\', path.win32.sep);
      assert.strictEqual(dirName, '.\\');
      assert.strictEqual(baseName, '');

      [dirName, baseName] = separatePath('.\\test', path.win32.sep);
      assert.strictEqual(dirName, '.\\');
      assert.strictEqual(baseName, 'test');

      [dirName, baseName] = separatePath('~\\..\\.\\test\\123', path.win32.sep);
      assert.strictEqual(dirName, '~\\..\\.\\test\\');
      assert.strictEqual(baseName, '123');
    });

    test('can separate absolute path on posix', () => {
      let [dirName, baseName] = separatePath('/', path.posix.sep);
      assert.strictEqual(dirName, '/');
      assert.strictEqual(baseName, '');

      [dirName, baseName] = separatePath('/abc', path.posix.sep);
      assert.strictEqual(dirName, '/');
      assert.strictEqual(baseName, 'abc');

      [dirName, baseName] = separatePath('/abc/123', path.posix.sep);
      assert.strictEqual(dirName, '/abc/');
      assert.strictEqual(baseName, '123');
    });

    test('can separate relative path on posix', () => {
      let [dirName, baseName] = separatePath('.', path.posix.sep);
      assert.strictEqual(dirName, '');
      assert.strictEqual(baseName, '.');

      [dirName, baseName] = separatePath('./', path.posix.sep);
      assert.strictEqual(dirName, './');
      assert.strictEqual(baseName, '');

      [dirName, baseName] = separatePath('./test', path.posix.sep);
      assert.strictEqual(dirName, './');
      assert.strictEqual(baseName, 'test');

      [dirName, baseName] = separatePath('~/.././test/123', path.posix.sep);
      assert.strictEqual(dirName, '~/.././test/');
      assert.strictEqual(baseName, '123');
    });
  });

  suite('resolveUri', () => {
    test('posix', () => {
      let testUri = vscode.Uri.file('/test/path');
      let resultUri = resolveUri('C:\\', path.posix.sep, testUri, false);
      assert.strictEqual(resultUri, null, 'Failed to return null when it is not posix path');

      testUri = vscode.Uri.file('/test/path');
      resultUri = resolveUri('/abc/123', path.posix.sep, testUri, false);
      if (resultUri === null) {
        assert.fail("null shouldn't be returned.");
      } else {
        assert.strictEqual(resultUri.scheme, 'file');
        assert.strictEqual(resultUri.path, '/abc/123');
      }

      // Convert Uri to local fs Uri if Uri is local untitled
      testUri = testUri.with({ scheme: 'untitled' });
      resultUri = resolveUri('/abc/123', path.posix.sep, testUri, false);
      if (resultUri === null) {
        assert.fail("null shouldn't be returned.");
      } else {
        assert.strictEqual(resultUri.scheme, 'file');
        assert.strictEqual(resultUri.path, '/abc/123');
      }

      testUri = testUri.with({ scheme: 'vscode-remote' });
      assert.ok(resultUri);
      resultUri = resolveUri('/abc/123', path.posix.sep, testUri, false);
      if (resultUri === null) {
        assert.fail("null shouldn't be returned.");
      } else {
        assert.strictEqual(resultUri.scheme, 'vscode-remote');
        assert.strictEqual(resultUri.path, '/abc/123');
      }
    });

    test('win32', () => {
      let testUri = vscode.Uri.file('C:\\123');
      let resultUri = resolveUri('/', path.win32.sep, testUri, false);
      assert.strictEqual(resultUri, null, 'Failed to return null when it is not win32 path');

      testUri = vscode.Uri.file('C:\\test');
      resultUri = resolveUri('C:\\123\\abc', path.win32.sep, testUri, false);
      if (resultUri === null) {
        assert.fail("null shouldn't be returned.");
      } else {
        assert.strictEqual(resultUri.scheme, 'file');
        assert.strictEqual(resultUri.fsPath, `c:\\123\\abc`);
      }

      // Even if remote is true, we can only return local file scheme
      resultUri = resolveUri('C:\\123\\abc', path.win32.sep, testUri, false);
      if (resultUri === null) {
        assert.fail("null shouldn't be returned.");
      } else {
        assert.strictEqual(resultUri.scheme, 'file');
        assert.strictEqual(resultUri.fsPath, `c:\\123\\abc`);
      }

      // Convert Uri to local fs Uri if Uri is local untitled
      testUri = testUri.with({ scheme: 'untitled' });
      resultUri = resolveUri('/abc/123', path.posix.sep, testUri, false);
      if (resultUri === null) {
        assert.fail("null shouldn't be returned.");
      } else {
        assert.strictEqual(resultUri.scheme, 'file');
        assert.strictEqual(resultUri.path, '/abc/123');
      }

      testUri = testUri.with({ scheme: 'vscode-remote' });
      assert.ok(resultUri);
      resultUri = resolveUri('/abc/123', path.posix.sep, testUri, false);
      if (resultUri === null) {
        assert.fail("null shouldn't be returned.");
      } else {
        assert.strictEqual(resultUri.scheme, 'vscode-remote');
        assert.strictEqual(resultUri.path, '/abc/123');
      }
    });
  });
});
