import * as assert from 'assert';
import { SubstituteCommand } from '../../src/cmd_line/commands/substitute';
import { commandNameParser } from '../../src/vimscript/exCommandParser';

suite(':substitute args parser', () => {
  const subParser = commandNameParser.tryParse('s') as (args: string) => SubstituteCommand;

  test('can parse pattern, replace, and flags', () => {
    const args = subParser('/a/b/g').arguments;
    assert.strictEqual(args.pattern?.patternString, 'a');
    assert.strictEqual(args.replace, 'b');
    assert.deepStrictEqual(args.flags, { replaceAll: true });
  });

  test('can parse count', () => {
    const args = subParser('/a/b/g 3').arguments;
    assert.strictEqual(args.count, 3);
  });

  test('can parse custom delimiter', () => {
    const args = subParser('#a#b#g').arguments;
    assert.strictEqual(args.pattern?.patternString, 'a');
    assert.strictEqual(args.replace, 'b');
    assert.deepStrictEqual(args.flags, { replaceAll: true });
  });

  test('can escape delimiter', () => {
    const args = subParser('/\\/\\/a/b/').arguments;
    assert.strictEqual(args.pattern?.patternString, '\\/\\/a');
    assert.strictEqual(args.pattern?.regex.source, '\\/\\/a');
    assert.strictEqual(args.replace, 'b');
  });

  test('can use pattern escapes', () => {
    const args = subParser('/\\ba/b/').arguments;
    assert.strictEqual(args.pattern?.patternString, '\\ba');
    assert.strictEqual(args.replace, 'b');
  });

  test('can escape replacement', () => {
    const args = subParser('/a/\\b/').arguments;
    assert.strictEqual(args.pattern?.patternString, 'a');
    assert.strictEqual(args.replace, '\b');
  });

  test('can parse flag KeepPreviousFlags', () => {
    const args = subParser('/a/b/&').arguments;
    assert.deepStrictEqual(args.flags, { keepPreviousFlags: true });
  });
});
