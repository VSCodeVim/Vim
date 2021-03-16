import * as assert from 'assert';

import { commandParsers } from '../../src/cmd_line/subparser';

suite(':bufferDelete args parser', () => {
  test('can parse empty args', () => {
    const args = commandParsers.bdelete.parser('');
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.tabPosition, undefined);
  });

  test('can parse !', () => {
    const args = commandParsers.bdelete.parser('!');
    assert.ok(args.arguments.bang);
    assert.strictEqual(args.arguments.tabPosition, '');
  });

  test('can parse tab position', () => {
    const args = commandParsers.bdelete.parser('1000');
    assert.ok(args.arguments.tabPosition);
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.tabPosition, '1000');
  });

  test('ignores space after tab position', () => {
    const args = commandParsers.bdelete.parser('3 ');
    assert.strictEqual(args.arguments.tabPosition, '3');
  });
});
