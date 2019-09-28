import * as assert from 'assert';

import { commandParsers } from '../../src/cmd_line/subparser';

suite(':substitute args parser', () => {
  test('can parse pattern, replace, and flags', () => {
    const args = commandParsers.substitute.parser('/a/b/g');
    assert.equal(args.arguments.pattern, 'a');
    assert.equal(args.arguments.replace, 'b');
    assert.equal(args.arguments.flags, 8);
  });

  test('can parse count', () => {
    const args = commandParsers.substitute.parser('/a/b/g 3');
    assert.equal(args.arguments.count, 3);
  });

  test('can parse custom delimiter', () => {
    const args = commandParsers.substitute.parser('#a#b#g');
    assert.equal(args.arguments.pattern, 'a');
    assert.equal(args.arguments.replace, 'b');
    assert.equal(args.arguments.flags, 8);
  });

  test('can escape delimiter', () => {
    const args = commandParsers.substitute.parser('/\\/\\/a/b/');
    assert.equal(args.arguments.pattern, '//a');
    assert.equal(args.arguments.replace, 'b');
  });

  test('can parse flag KeepPreviousFlags', () => {
    const args = commandParsers.substitute.parser('/a/b/&');
    assert.equal(args.arguments.flags, 1);
  });
});
