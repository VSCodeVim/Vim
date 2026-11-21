import * as assert from 'assert';
import childProcess from 'child_process';
import fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { NeovimValidator } from '../../../src/configuration/validators/neovimValidator';
import { Configuration } from '../../testConfiguration';

suite('Neovim Validator', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('neovim enabled without path', async () => {
    // setup
    const configuration = new Configuration();
    configuration.enableNeovim = true;
    configuration.neovimPath = '';

    const oldPath = process.env.PATH?.slice();
    process.env.PATH = '';

    // test
    const validator = new NeovimValidator();
    const actual = await validator.validate(configuration);
    validator.disable(configuration);

    process.env.PATH = oldPath;

    // assert
    assert.strictEqual(actual.numErrors, 1);
    assert.strictEqual(actual.hasError, true);
    assert.strictEqual(configuration.enableNeovim, false);
  });

  test('neovim enabled with nvim in path', async () => {
    // setup
    const configuration = new Configuration();
    configuration.enableNeovim = true;
    configuration.neovimPath = '';

    const oldPath = process.env.PATH?.slice();
    process.env.PATH = `/usr/bin${path.delimiter}/some/other/path`;
    const nvimPath = path.join('/usr/bin', process.platform === 'win32' ? 'nvim.exe' : 'nvim');
    sandbox.stub(fs, 'existsSync').withArgs(nvimPath).returns(true);
    sandbox.stub(childProcess, 'execFileSync').withArgs(nvimPath, sinon.match.array);

    // test
    const validator = new NeovimValidator();
    const actual = await validator.validate(configuration);

    process.env.PATH = oldPath;

    // assert
    assert.strictEqual(actual.numErrors, 0);
    assert.strictEqual(configuration.enableNeovim, true);
    assert.strictEqual(configuration.neovimPath, nvimPath);
  });

  test('neovim disabled', async () => {
    // setup
    const configuration = new Configuration();
    configuration.enableNeovim = false;
    configuration.neovimPath = '';

    // test
    const validator = new NeovimValidator();
    const actual = await validator.validate(configuration);

    // assert
    assert.strictEqual(actual.numErrors, 0);
  });
});
