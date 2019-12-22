import * as assert from 'assert';

import { commandParsers } from '../../src/cmd_line/subparser';

suite(':substitute args parser', () => {
  test('can parse pattern, replace, and flags', () => {
    const args = commandParsers.substitute.parser('/a/b/g');
    assert.strictEqual(args.arguments.pattern, 'a');
    assert.strictEqual(args.arguments.replace, 'b');
    assert.strictEqual(args.arguments.flags, 8);
  });

  test('can parse count', () => {
    const args = commandParsers.substitute.parser('/a/b/g 3');
    assert.strictEqual(args.arguments.count, 3);
  });

  test('can parse custom delimiter', () => {
    const args = commandParsers.substitute.parser('#a#b#g');
    assert.strictEqual(args.arguments.pattern, 'a');
    assert.strictEqual(args.arguments.replace, 'b');
    assert.strictEqual(args.arguments.flags, 8);
  });

  test('can escape delimiter', () => {
    const args = commandParsers.substitute.parser('/\\/\\/a/b/');
    assert.strictEqual(args.arguments.pattern, '//a');
    assert.strictEqual(args.arguments.replace, 'b');
  });

  test('can parse flag KeepPreviousFlags', () => {
    const args = commandParsers.substitute.parser('/a/b/&');
    assert.strictEqual(args.arguments.flags, 1);
  });
});
