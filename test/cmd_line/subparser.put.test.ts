import * as assert from 'assert';
import { PutExCommand } from '../../src/cmd_line/commands/put';
import { commandNameParser } from '../../src/vimscript/exCommandParser';

suite(':put args parser', () => {
  const putParser = commandNameParser.tryParse('put') as (args: string) => PutExCommand;

  test('can parse empty args', () => {
    const args = putParser('').arguments;
    assert.strictEqual(args.bang, undefined);
    assert.strictEqual(args.register, undefined);
  });

  test('can parse !', () => {
    const args = putParser('!').arguments;
    assert.strictEqual(args.bang, true);
  });

  test('can parse register', () => {
    const args = putParser(' *').arguments;
    assert.strictEqual(args.bang, undefined);
    assert.strictEqual(args.register, '*');
  });

  test('can parse register with no whitespace', () => {
    const args = putParser('*').arguments;
    assert.strictEqual(args.bang, undefined);
    assert.strictEqual(args.register, '*');
  });

  test('can parse register with no whitespace and !', () => {
    const args = putParser('!*').arguments;
    assert.strictEqual(args.bang, true);
    assert.strictEqual(args.register, '*');
  });
});
