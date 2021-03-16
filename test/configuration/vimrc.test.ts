import * as assert from 'assert';
import * as testConfiguration from '../testConfiguration';
import * as os from 'os';
import { vimrc } from '../../src/configuration/vimrc';

suite('Vimrc', () => {
  const configuration = new testConfiguration.Configuration();
  const vimrcpath = os.homedir();
  configuration.vimrc.enable = true;

  test("Can expand $HOME to user's home directory", async () => {
    configuration.vimrc.path = '$HOME';

    await vimrc.load(configuration);
    assert.strictEqual(vimrc.vimrcPath, vimrcpath);
  });

  test("Can expand ~ to user's home directory", async () => {
    configuration.vimrc.path = '~';

    await vimrc.load(configuration);
    assert.strictEqual(vimrc.vimrcPath, vimrcpath);
  });
});
