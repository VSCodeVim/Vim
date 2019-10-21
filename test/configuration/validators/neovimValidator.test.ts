import * as assert from 'assert';
import { Configuration } from '../../testConfiguration';
import { NeovimValidator } from '../../../src/configuration/validators/neovimValidator';

suite('Neovim Validator', () => {
  test('neovim enabled without path', async () => {
    // setup
    const configuration = new Configuration();
    configuration.enableNeovim = true;
    configuration.neovimPath = '';

    // test
    const validator = new NeovimValidator();
    const actual = await validator.validate(configuration);
    validator.disable(configuration);

    // assert
    assert.strictEqual(actual.numErrors, 1);
    assert.strictEqual(actual.hasError, true);
    assert.strictEqual(configuration.enableNeovim, false);
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
