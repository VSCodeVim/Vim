import * as assert from 'assert';
import * as os from 'os';
import { configuration } from '../../src/configuration/configuration';
import { VimrcImpl, vimrc } from '../../src/configuration/vimrc';
import * as testConfiguration from '../testConfiguration';

suite('Vimrc', () => {
  const testConfig = new testConfiguration.Configuration();
  const vimrcpath = os.homedir();
  testConfig.vimrc.enable = true;

  test("Can expand $HOME to user's home directory", async () => {
    testConfig.vimrc.path = '$HOME';

    await vimrc.load(testConfig);
    assert.strictEqual(vimrc.vimrcPath, vimrcpath);
  });

  test("Can expand ~ to user's home directory", async () => {
    testConfig.vimrc.path = '~';

    await vimrc.load(testConfig);
    assert.strictEqual(vimrc.vimrcPath, vimrcpath);
  });

  suite('applySetLine', () => {
    const originalClipboard = configuration.clipboard;

    teardown(() => {
      configuration.clipboard = originalClipboard;
    });

    test('recognizes `set clipboard=unnamed` and applies it', () => {
      configuration.clipboard = '';
      const handled = VimrcImpl.applySetLine(configuration, 'set clipboard=unnamed');
      assert.strictEqual(handled, true);
      assert.strictEqual(configuration.clipboard, 'unnamed');
    });

    test('recognizes the short form `se clipboard=unnamedplus`', () => {
      configuration.clipboard = '';
      const handled = VimrcImpl.applySetLine(configuration, 'se clipboard=unnamedplus');
      assert.strictEqual(handled, true);
      assert.strictEqual(configuration.clipboard, 'unnamedplus');
    });

    test('tolerates leading whitespace', () => {
      configuration.clipboard = '';
      const handled = VimrcImpl.applySetLine(configuration, '   set clipboard=unnamed');
      assert.strictEqual(handled, true);
      assert.strictEqual(configuration.clipboard, 'unnamed');
    });

    test('returns false for non-set lines', () => {
      assert.strictEqual(VimrcImpl.applySetLine(configuration, 'nnoremap <C-h> <<'), false);
      assert.strictEqual(VimrcImpl.applySetLine(configuration, 'source ~/.vim/other.vim'), false);
    });

    test('unknown option is swallowed as a warning, not thrown', () => {
      assert.doesNotThrow(() => VimrcImpl.applySetLine(configuration, 'set bogusoption=foo'));
    });
  });
});
