import * as assert from 'assert';

import { commandParsers } from '../../src/cmd_line/subparser';

suite(':quit args parser', () => {
  test('has all aliases', () => {
    assert.equal(commandParsers.quit.name, commandParsers.q.name);
  });

  test('can parse empty args', () => {
    var args = commandParsers.quit('');
    assert.equal(args.arguments.bang, undefined);
    assert.equal(args.arguments.range, undefined);
  });

  test('ignores trailing white space', () => {
    var args = commandParsers.quit('  ');
    assert.equal(args.arguments.bang, undefined);
    assert.equal(args.arguments.range, undefined);
  });

  test('can parse !', () => {
    var args = commandParsers.quit('!');
    assert.ok(args.arguments.bang);
    assert.equal(args.arguments.range, undefined);
  });

  test('throws if space before !', () => {
    assert.throws(() => commandParsers.quit(' !'));
  });

  test('ignores space after !', () => {
    var args = commandParsers.quit('! ');
    assert.equal(args.arguments.bang, true);
    assert.equal(args.arguments.range, undefined);
  });

  test('throws if bad input', () => {
    assert.throws(() => commandParsers.quit('x'));
  });
});
