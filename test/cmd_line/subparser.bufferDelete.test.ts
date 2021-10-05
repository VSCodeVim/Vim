import * as assert from 'assert';
import { BufferDeleteCommand } from '../../src/cmd_line/commands/bufferDelete';
import { commandNameParser } from '../../src/vimscript/exCommandParser';

suite(':bufferDelete args parser', () => {
  const bdParser = commandNameParser.tryParse('bd') as (args: string) => BufferDeleteCommand;

  test('can parse empty args', () => {
    const args = bdParser('').arguments;
    assert.strictEqual(args.bang, undefined);
    assert.strictEqual(args.tabPosition, undefined);
  });

  test('can parse !', () => {
    const args = bdParser('!').arguments;
    assert.ok(args.bang);
    assert.strictEqual(args.tabPosition, '');
  });

  test('can parse tab position', () => {
    const args = bdParser('1000').arguments;
    assert.ok(args.tabPosition);
    assert.strictEqual(args.bang, undefined);
    assert.strictEqual(args.tabPosition, '1000');
  });

  test('ignores space after tab position', () => {
    const args = bdParser('3 ').arguments;
    assert.strictEqual(args.tabPosition, '3');
  });
});
