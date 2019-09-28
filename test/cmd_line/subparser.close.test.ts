import * as assert from 'assert';

import { commandParsers } from '../../src/cmd_line/subparser';

suite(':close args parser', () => {
  test('can parse empty args', () => {
    const args = commandParsers.close.parser('');
    assert.equal(args.arguments.bang, undefined);
    assert.equal(args.arguments.range, undefined);
  });

  test('ignores trailing white space', () => {
    const args = commandParsers.close.parser('  ');
    assert.equal(args.arguments.bang, undefined);
    assert.equal(args.arguments.range, undefined);
  });

  test('can parse !', () => {
    const args = commandParsers.close.parser('!');
    assert.ok(args.arguments.bang);
    assert.equal(args.arguments.range, undefined);
  });

  test('throws if space before !', () => {
    assert.throws(() => commandParsers.close.parser(' !'));
  });

  test('ignores space after !', () => {
    const args = commandParsers.close.parser('! ');
    assert.equal(args.arguments.bang, true);
    assert.equal(args.arguments.range, undefined);
  });

  test('throws if bad input', () => {
    assert.throws(() => commandParsers.close.parser('x'));
  });
});
