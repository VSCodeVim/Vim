import * as assert from 'assert';
import { commandParsers } from '../../src/vimscript/exCommandParser';

suite(':put args parser', () => {
  test('can parse empty args', () => {
    const args = commandParsers.put.parser('');
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.register, undefined);
  });

  test('can parse !', () => {
    const args = commandParsers.put.parser('!');
    assert.strictEqual(args.arguments.bang, true);
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
