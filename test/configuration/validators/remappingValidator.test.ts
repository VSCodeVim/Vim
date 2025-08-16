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
    configuration.operatorPendingModeKeyBindings = [];
    configuration.operatorPendingModeKeyBindingsNonRecursive = [];
    configuration.visualModeKeyBindings = [];
    configuration.visualModeKeyBindingsNonRecursive = [];

    // test
    const validator = new RemappingValidator();
    const actual = await validator.validate(configuration);

    // assert
    assert.strictEqual(actual.numErrors, 0);
    assert.strictEqual(actual.hasError, false);
    assert.strictEqual(actual.numWarnings, 0);
    assert.strictEqual(actual.hasWarning, false);

    assert.strictEqual(configuration.insertModeKeyBindingsMap.size, 0);
    assert.strictEqual(configuration.normalModeKeyBindingsMap.size, 0);
    assert.strictEqual(configuration.operatorPendingModeKeyBindingsMap.size, 0);
    assert.strictEqual(configuration.visualModeKeyBindingsMap.size, 0);
  });

  test('jj->esc', async () => {
    // setup
    const configuration = new Configuration();
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
    const actual = await validator.validate(configuration);

    // assert
    assert.strictEqual(actual.numErrors, 0);
    assert.strictEqual(actual.hasError, false);
    assert.strictEqual(actual.numWarnings, 0);
    assert.strictEqual(actual.hasWarning, false);

    assert.strictEqual(configuration.insertModeKeyBindingsMap.size, 1);
    assert.strictEqual(configuration.normalModeKeyBindingsMap.size, 0);
    assert.strictEqual(configuration.visualModeKeyBindingsMap.size, 0);

    assert.strictEqual(
      configuration.insertModeKeyBindingsMap.get('jj'),
      configuration.insertModeKeyBindings[0],
    );
  });

  test('remapping missing after and command', async () => {
    // setup
    const configuration = new Configuration();
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
    const actual = await validator.validate(configuration);

    // assert
    assert.strictEqual(actual.numErrors, 1);
    assert.strictEqual(actual.hasError, true);
    assert.strictEqual(actual.numWarnings, 0);
    assert.strictEqual(actual.hasWarning, false);

    assert.strictEqual(configuration.insertModeKeyBindingsMap.size, 0);
    assert.strictEqual(configuration.normalModeKeyBindingsMap.size, 0);
    assert.strictEqual(configuration.visualModeKeyBindingsMap.size, 0);
  });

  test('remappings are de-duped', async () => {
    // setup
    const configuration = new Configuration();
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
    const actual = await validator.validate(configuration);

    // assert
    assert.strictEqual(actual.numErrors, 0);
    assert.strictEqual(actual.hasError, false);
    assert.strictEqual(actual.numWarnings, 1);
    assert.strictEqual(actual.hasWarning, true);

    assert.strictEqual(configuration.insertModeKeyBindingsMap.size, 0);
    assert.strictEqual(configuration.normalModeKeyBindingsMap.size, 1);
    assert.strictEqual(configuration.visualModeKeyBindingsMap.size, 0);
  });

  test('remappings are de-duped even when on different recursive types', async () => {
    // setup
    const configuration = new Configuration();
    configuration.insertModeKeyBindings = [];
    configuration.insertModeKeyBindingsNonRecursive = [];
    configuration.normalModeKeyBindings = [
      {
        before: ['c', 'o', 'p', 'y'],
        after: ['c', 'o', 'p', 'y'],
      },
    ];
    configuration.normalModeKeyBindingsNonRecursive = [
      {
        before: ['c', 'o', 'p', 'y'],
        after: ['c', 'o', 'p', 'y'],
      },
    ];
    configuration.visualModeKeyBindings = [];
    configuration.visualModeKeyBindingsNonRecursive = [];

    // test
    const validator = new RemappingValidator();
    const actual = await validator.validate(configuration);

    // assert
    assert.strictEqual(actual.numErrors, 0);
    assert.strictEqual(actual.hasError, false);
    assert.strictEqual(actual.numWarnings, 1);
    assert.strictEqual(actual.hasWarning, true);

    assert.strictEqual(configuration.insertModeKeyBindingsMap.size, 0);
    assert.strictEqual(configuration.normalModeKeyBindingsMap.size, 1);
    assert.strictEqual(configuration.visualModeKeyBindingsMap.size, 0);
  });

  test('remappings added on different recursive types are combined in one Map', async () => {
    // setup
    const configuration = new Configuration();
    configuration.insertModeKeyBindings = [
      {
        before: ['a'],
        after: ['b'],
      },
    ];
    configuration.insertModeKeyBindingsNonRecursive = [
      {
        before: ['c'],
        after: ['d'],
      },
    ];
    configuration.normalModeKeyBindings = [
      {
        before: ['a'],
        after: ['b'],
      },
    ];
    configuration.normalModeKeyBindingsNonRecursive = [
      {
        before: ['c'],
        after: ['d'],
      },
    ];
    configuration.visualModeKeyBindings = [
      {
        before: ['a'],
        after: ['b'],
      },
    ];
    configuration.visualModeKeyBindingsNonRecursive = [
      {
        before: ['c'],
        after: ['d'],
      },
    ];
    configuration.commandLineModeKeyBindings = [
      {
        before: ['a'],
        after: ['b'],
      },
    ];
    configuration.commandLineModeKeyBindingsNonRecursive = [
      {
        before: ['c'],
        after: ['d'],
      },
    ];
    configuration.operatorPendingModeKeyBindings = [
      {
        before: ['a'],
        after: ['b'],
      },
    ];
    configuration.operatorPendingModeKeyBindingsNonRecursive = [
      {
        before: ['c'],
        after: ['d'],
      },
    ];

    // test
    const validator = new RemappingValidator();
    const actual = await validator.validate(configuration);

    // assert
    assert.strictEqual(actual.numErrors, 0);
    assert.strictEqual(actual.hasError, false);
    assert.strictEqual(actual.numWarnings, 0);
    assert.strictEqual(actual.hasWarning, false);

    assert.strictEqual(configuration.insertModeKeyBindingsMap.size, 2);
    assert.strictEqual(configuration.normalModeKeyBindingsMap.size, 2);
    assert.strictEqual(configuration.visualModeKeyBindingsMap.size, 2);
    assert.strictEqual(configuration.commandLineModeKeyBindingsMap.size, 2);
    assert.strictEqual(configuration.operatorPendingModeKeyBindingsMap.size, 2);
  });
});
