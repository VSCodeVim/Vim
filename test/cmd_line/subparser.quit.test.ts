import * as assert from 'assert';

import { commandParsers } from '../../src/cmd_line/subparser';

suite(':quit args parser', () => {
  test('can parse empty args', () => {
    const args = commandParsers.quit.parser('');
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.range, undefined);
  });

  test('ignores trailing white space', () => {
    const args = commandParsers.quit.parser('  ');
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.range, undefined);
  });

  test('can parse !', () => {
    const args = commandParsers.quit.parser('!');
    assert.ok(args.arguments.bang);
    assert.strictEqual(args.arguments.range, undefined);
  });

  test('throws if space before !', () => {
    assert.throws(() => commandParsers.quit.parser(' !'));
  });

  test('ignores space after !', () => {
    const args = commandParsers.quit.parser('! ');
    assert.strictEqual(args.arguments.bang, true);
    assert.strictEqual(args.arguments.range, undefined);
  });

  test('throws if bad input', () => {
    assert.throws(() => commandParsers.quit.parser('x'));
  });
});
