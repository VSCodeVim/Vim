import * as assert from 'assert';
import { QuitCommand } from '../../src/cmd_line/commands/quit';
import { commandNameParser } from '../../src/vimscript/exCommandParser';

suite(':quit args parser', () => {
  const quitParser = commandNameParser.tryParse('quit') as (args: string) => QuitCommand;

  test('can parse empty args', () => {
    const args = quitParser('').arguments;
    assert.strictEqual(args.bang, undefined);
    assert.strictEqual(args.range, undefined);
  });

  test('ignores trailing white space', () => {
    const args = quitParser('  ').arguments;
    assert.strictEqual(args.bang, undefined);
    assert.strictEqual(args.range, undefined);
  });

  test('can parse !', () => {
    const args = quitParser('!').arguments;
    assert.ok(args.bang);
    assert.strictEqual(args.range, undefined);
  });

  test('throws if space before !', () => {
    assert.throws(() => quitParser(' !'));
  });

  test('ignores space after !', () => {
    const args = quitParser('! ').arguments;
    assert.strictEqual(args.bang, true);
    assert.strictEqual(args.range, undefined);
  });

  test('throws if bad input', () => {
    assert.throws(() => quitParser('x'));
  });
});
