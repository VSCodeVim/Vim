import * as assert from 'assert';
import * as path from 'path';
import * as sinon from 'sinon';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import { Configuration } from '../../testConfiguration';
import { NeovimValidator } from '../../../src/configuration/validators/neovimValidator';

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
    sandbox.stub(fs, 'existsSync').withArgs('/usr/bin/nvim').returns(true);
    sandbox.stub(childProcess, 'execFileSync').withArgs('/usr/bin/nvim', sinon.match.array);

    // test
    const validator = new NeovimValidator();
    const actual = await validator.validate(configuration);

    process.env.PATH = oldPath;

    // assert
    assert.strictEqual(actual.numErrors, 0);
    assert.strictEqual(configuration.enableNeovim, true);
    assert.strictEqual(configuration.neovimPath, '/usr/bin/nvim');
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
