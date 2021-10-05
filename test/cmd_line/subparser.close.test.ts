import * as assert from 'assert';
import { CloseCommand } from '../../src/cmd_line/commands/close';
import { commandNameParser } from '../../src/vimscript/exCommandParser';

suite(':close args parser', () => {
  const closeParser = commandNameParser.tryParse('close') as (args: string) => CloseCommand;

  test('can parse empty args', () => {
    const args = closeParser('');
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.range, undefined);
  });

  test('ignores trailing white space', () => {
    const args = closeParser('  ');
    assert.strictEqual(args.arguments.bang, undefined);
    assert.strictEqual(args.arguments.range, undefined);
  });

  test('can parse !', () => {
    const args = closeParser('!');
    assert.ok(args.arguments.bang);
    assert.strictEqual(args.arguments.range, undefined);
  });

  test('throws if space before !', () => {
    assert.throws(() => closeParser(' !'));
  });

  test('ignores space after !', () => {
    const args = closeParser('! ');
    assert.strictEqual(args.arguments.bang, true);
    assert.strictEqual(args.arguments.range, undefined);
  });

  test('throws if bad input', () => {
    assert.throws(() => closeParser('x'));
  });
});
