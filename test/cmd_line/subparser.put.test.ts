import * as assert from 'assert';
import { commandParsers } from '../../src/cmd_line/subparser';

suite(':put args parser', () => {
  test('can parse empty args', () => {
    const args = commandParsers.put.parser('');
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.register, undefined);
  });

  test('can parse !', () => {
    const args = commandParsers.put.parser('!');
    assert.strictEqual(args.arguments.bang, true);
    assert.strictEqual(args.arguments.range, undefined);
  });

  test('can parse register', () => {
    const args = commandParsers.put.parser(' *');
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.register, '*');
  });

  test('can parse register with no whitespace', () => {
    const args = commandParsers.put.parser('*');
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.register, '*');
  });

  test('can parse register with no whitespace and !', () => {
    const args = commandParsers.put.parser('!*');
    assert.strictEqual(args.arguments.bang, true);
    assert.strictEqual(args.arguments.register, '*');
  });
});
