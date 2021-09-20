import * as assert from 'assert';
import { SubstituteCommand } from '../../src/cmd_line/commands/substitute';
import { commandNameParser } from '../../src/vimscript/exCommandParser';

suite(':substitute args parser', () => {
  const subParser = commandNameParser.tryParse('s') as (args: string) => SubstituteCommand;

  test('can parse pattern, replace, and flags', () => {
    const args = subParser('/a/b/g').arguments;
    assert.strictEqual(args.pattern, 'a');
    assert.strictEqual(args.replace, 'b');
    assert.strictEqual(args.flags, 8);
  });

  test('can parse count', () => {
    const args = subParser('/a/b/g 3').arguments;
    assert.strictEqual(args.count, 3);
  });

  test('can parse custom delimiter', () => {
    const args = subParser('#a#b#g').arguments;
    assert.strictEqual(args.pattern, 'a');
    assert.strictEqual(args.replace, 'b');
    assert.strictEqual(args.flags, 8);
  });

  test('can escape delimiter', () => {
    const args = subParser('/\\/\\/a/b/').arguments;
    assert.strictEqual(args.pattern, '//a');
    assert.strictEqual(args.replace, 'b');
  });

  test('can use pattern escapes', () => {
    const args = subParser('/\\ba/b/').arguments;
    assert.strictEqual(args.pattern, '\\ba');
    assert.strictEqual(args.replace, 'b');
  });

  test('can escape replacement', () => {
    const args = subParser('/a/\\b/').arguments;
    assert.strictEqual(args.pattern, 'a');
    assert.strictEqual(args.replace, '\b');
  });

  test('can parse flag KeepPreviousFlags', () => {
    const args = subParser('/a/b/&').arguments;
    assert.strictEqual(args.flags, 1);
  });
});
