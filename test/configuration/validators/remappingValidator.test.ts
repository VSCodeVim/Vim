import * as assert from 'assert';
import { Configuration } from '../../testConfiguration';
import { RemappingValidator } from '../../../src/configuration/validators/remappingValidator';

suite('Remapping Validator', () => {
  test('no remappings', async () => {
    // setup
    const configuration = new Configuration();
    configuration.insertModeKeyBindings = [];
    configuration.insertModeKeyBindingsNonRecursive = [];
    configuration.normalModeKeyBindings = [];
    configuration.normalModeKeyBindingsNonRecursive = [];
    configuration.visualModeKeyBindings = [];
    configuration.visualModeKeyBindingsNonRecursive = [];

    // test
    const validator = new RemappingValidator();
    let actual = await validator.validate(configuration);

    // assert
    assert.equal(actual.numErrors, 0);
    assert.equal(actual.hasError, false);
    assert.equal(actual.numWarnings, 0);
    assert.equal(actual.hasWarning, false);

    assert.equal(configuration.insertModeKeyBindingsMap.size, 0);
    assert.equal(configuration.insertModeKeyBindingsNonRecursiveMap.size, 0);
    assert.equal(configuration.normalModeKeyBindingsMap.size, 0);
    assert.equal(configuration.normalModeKeyBindingsNonRecursiveMap.size, 0);
    assert.equal(configuration.visualModeKeyBindingsMap.size, 0);
    assert.equal(configuration.visualModeKeyBindingsNonRecursiveMap.size, 0);
  });

  test('jj->esc', async () => {
    // setup
    let configuration = new Configuration();
    configuration.insertModeKeyBindings = [
      {
        before: ['j', 'j'],
        after: ['<Esc>'],
      },
    ];
    configuration.insertModeKeyBindingsNonRecursive = [];
    configuration.normalModeKeyBindings = [];
    configuration.normalModeKeyBindingsNonRecursive = [];
    configuration.visualModeKeyBindings = [];
    configuration.visualModeKeyBindingsNonRecursive = [];

    // test
    const validator = new RemappingValidator();
    let actual = await validator.validate(configuration);

    // assert
    assert.equal(actual.numErrors, 0);
    assert.equal(actual.hasError, false);
    assert.equal(actual.numWarnings, 0);
    assert.equal(actual.hasWarning, false);

    assert.equal(configuration.insertModeKeyBindingsMap.size, 1);
    assert.equal(configuration.insertModeKeyBindingsNonRecursiveMap.size, 0);
    assert.equal(configuration.normalModeKeyBindingsMap.size, 0);
    assert.equal(configuration.normalModeKeyBindingsNonRecursiveMap.size, 0);
    assert.equal(configuration.visualModeKeyBindingsMap.size, 0);
    assert.equal(configuration.visualModeKeyBindingsNonRecursiveMap.size, 0);

    assert.equal(
      configuration.insertModeKeyBindingsMap.get('jj'),
      configuration.insertModeKeyBindings[0]
    );
  });

  test('remapping missing after and command', async () => {
    // setup
    let configuration = new Configuration();
    configuration.insertModeKeyBindings = [
      {
        before: ['j', 'j'],
      },
    ];
    configuration.insertModeKeyBindingsNonRecursive = [];
    configuration.normalModeKeyBindings = [];
    configuration.normalModeKeyBindingsNonRecursive = [];
    configuration.visualModeKeyBindings = [];
    configuration.visualModeKeyBindingsNonRecursive = [];

    // test
    const validator = new RemappingValidator();
    let actual = await validator.validate(configuration);

    // assert
    assert.equal(actual.numErrors, 1);
    assert.equal(actual.hasError, true);
    assert.equal(actual.numWarnings, 0);
    assert.equal(actual.hasWarning, false);

    assert.equal(configuration.insertModeKeyBindingsMap.size, 0);
    assert.equal(configuration.insertModeKeyBindingsNonRecursiveMap.size, 0);
    assert.equal(configuration.normalModeKeyBindingsMap.size, 0);
    assert.equal(configuration.normalModeKeyBindingsNonRecursiveMap.size, 0);
    assert.equal(configuration.visualModeKeyBindingsMap.size, 0);
    assert.equal(configuration.visualModeKeyBindingsNonRecursiveMap.size, 0);
  });

  test('remappings are de-duped', async () => {
    // setup
    let configuration = new Configuration();
    configuration.insertModeKeyBindings = [];
    configuration.insertModeKeyBindingsNonRecursive = [];
    configuration.normalModeKeyBindings = [
      {
        before: ['c', 'o', 'p', 'y'],
        after: ['c', 'o', 'p', 'y'],
      },
      {
        before: ['c', 'o', 'p', 'y'],
        after: ['c', 'o', 'p', 'y'],
      },
    ];
    configuration.normalModeKeyBindingsNonRecursive = [];
    configuration.visualModeKeyBindings = [];
    configuration.visualModeKeyBindingsNonRecursive = [];

    // test
    const validator = new RemappingValidator();
    let actual = await validator.validate(configuration);

    // assert
    assert.equal(actual.numErrors, 0);
    assert.equal(actual.hasError, false);
    assert.equal(actual.numWarnings, 1);
    assert.equal(actual.hasWarning, true);

    assert.equal(configuration.insertModeKeyBindingsMap.size, 0);
    assert.equal(configuration.insertModeKeyBindingsNonRecursiveMap.size, 0);
    assert.equal(configuration.normalModeKeyBindingsMap.size, 1);
    assert.equal(configuration.normalModeKeyBindingsNonRecursiveMap.size, 0);
    assert.equal(configuration.visualModeKeyBindingsMap.size, 0);
    assert.equal(configuration.visualModeKeyBindingsNonRecursiveMap.size, 0);
  });
});
