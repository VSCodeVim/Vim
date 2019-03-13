import * as assert from 'assert';
import { Configuration } from '../../testConfiguration';
import { NeovimValidator } from '../../../src/configuration/validators/neovimValidator';

suite('Neovim Validator', () => {
  test('neovim enabled without path', async () => {
    // setup
    let configuration = new Configuration();
    configuration.enableNeovim = true;
    configuration.neovimPath = '';

    // test
    const validator = new NeovimValidator();
    let actual = await validator.validate(configuration);
    validator.disable(configuration);

    // assert
    assert.equal(actual.numErrors, 1);
    assert.equal(actual.hasError, true);
    assert.equal(configuration.enableNeovim, false);
  });

  test('neovim disabled', async () => {
    // setup
    let configuration = new Configuration();
    configuration.enableNeovim = false;
    configuration.neovimPath = '';

    // test
    const validator = new NeovimValidator();
    let actual = await validator.validate(configuration);

    // assert
    assert.equal(actual.numErrors, 0);
  });
});
