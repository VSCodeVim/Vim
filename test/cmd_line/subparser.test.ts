import * as assert from 'assert';
import { getAndUpdateModeHandler } from '../../extensionBase';
import { WriteCommand } from '../../src/cmd_line/commands/write';

import { Mode } from '../../src/mode/mode';
import { commandNameParser } from '../../src/vimscript/exCommandParser';
import { newTest } from '../testSimplifier';
import { setupWorkspace, cleanUpWorkspace } from '../testUtils';

suite('getParser', () => {
  setup(async () => {
    await setupWorkspace();
    await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('empty', () => {
    assert.notStrictEqual(commandNameParser.tryParse(''), undefined);
  });

  test(':marks', () => {
    assert.notStrictEqual(commandNameParser.tryParse('marks'), undefined);
    assert.strictEqual(commandNameParser.parse('marksx').status, false);
  });

  test(':ju', () => {
    const j = commandNameParser.tryParse('ju');
    assert.notStrictEqual(j, undefined);
    assert.strictEqual(commandNameParser.tryParse('jumps'), j);
    assert.strictEqual(commandNameParser.tryParse('jump'), j);
  });

  test(':sh', () => {
    const s = commandNameParser.tryParse('shell');
    assert.notStrictEqual(s, undefined);
    assert.strictEqual(commandNameParser.tryParse('sh'), s);
  });

  test(':write', () => {
    const w = commandNameParser.tryParse('w');
    assert.notStrictEqual(w, undefined);

    assert.strictEqual(commandNameParser.tryParse('wr'), w);
    assert.strictEqual(commandNameParser.tryParse('wri'), w);
    assert.strictEqual(commandNameParser.tryParse('writ'), w);
    assert.strictEqual(commandNameParser.tryParse('write'), w);

    assert.strictEqual(commandNameParser.parse('writex').status, false);
  });

  test(':nohlsearch', () => {
    assert.notDeepStrictEqual(commandNameParser.parse('no'), commandNameParser.parse('nohl'));

    const noh = commandNameParser.tryParse('noh');
    assert.notStrictEqual(noh, undefined);

    assert.strictEqual(commandNameParser.tryParse('nohl'), noh);
    assert.strictEqual(commandNameParser.tryParse('nohls'), noh);
    assert.strictEqual(commandNameParser.tryParse('nohlse'), noh);
    assert.strictEqual(commandNameParser.tryParse('nohlsea'), noh);
    assert.strictEqual(commandNameParser.tryParse('nohlsear'), noh);
    assert.strictEqual(commandNameParser.tryParse('nohlsearc'), noh);
    assert.strictEqual(commandNameParser.tryParse('nohlsearch'), noh);

    assert.strictEqual(commandNameParser.parse('nohlsearchx').status, false);
  });

  test(':quitall', () => {
    const qa = commandNameParser.tryParse('qa');
    assert.notStrictEqual(qa, undefined);

    assert.strictEqual(commandNameParser.tryParse('qal'), qa);
    assert.strictEqual(commandNameParser.tryParse('qall'), qa);

    assert.strictEqual(commandNameParser.tryParse('quita'), qa);
    assert.strictEqual(commandNameParser.tryParse('quital'), qa);
    assert.strictEqual(commandNameParser.tryParse('quitall'), qa);
  });

  suite(':write args parser', () => {
    const writeParser = commandNameParser.tryParse('write') as (args: string) => WriteCommand;

    test('can parse empty args', () => {
      // TODO: perhaps we don't need to export this func at all.
      // TODO: this func must return args only, not a command?
      // TODO: the range must be passed separately, not as arg.
      const args = writeParser('').arguments;
      assert.strictEqual(args.append, undefined);
      assert.strictEqual(args.bang, undefined);
      assert.strictEqual(args.cmd, undefined);
      assert.strictEqual(args.file, undefined);
      assert.strictEqual(args.opt, undefined);
      assert.strictEqual(args.optValue, undefined);
      assert.strictEqual(args.range, undefined);
    });

    test('can parse ++opt', () => {
      const args = writeParser('++enc=foo').arguments;
      assert.strictEqual(args.append, undefined);
      assert.strictEqual(args.bang, undefined);
      assert.strictEqual(args.cmd, undefined);
      assert.strictEqual(args.file, undefined);
      assert.strictEqual(args.opt, 'enc');
      assert.strictEqual(args.optValue, 'foo');
      assert.strictEqual(args.range, undefined);
    });

    test('throws if bad ++opt name', () => {
      assert.throws(() => writeParser('++foo=foo'));
    });

    test('can parse bang', () => {
      const args = writeParser('!').arguments;
      assert.strictEqual(args.append, undefined);
      assert.strictEqual(args.bang, true);
      assert.strictEqual(args.cmd, undefined);
      assert.strictEqual(args.file, undefined);
      assert.strictEqual(args.opt, undefined);
      assert.strictEqual(args.optValue, undefined);
      assert.strictEqual(args.range, undefined);
    });

    test("can parse ' !cmd'", () => {
      const args = writeParser(' !foo').arguments;
      assert.strictEqual(args.append, undefined);
      assert.strictEqual(args.bang, undefined);
      assert.strictEqual(args.cmd, 'foo');
      assert.strictEqual(args.file, undefined);
      assert.strictEqual(args.opt, undefined);
      assert.strictEqual(args.optValue, undefined);
      assert.strictEqual(args.range, undefined);
    });

    test("can parse ' !cmd' when cmd is empty", () => {
      const args = writeParser(' !').arguments;
      assert.strictEqual(args.append, undefined);
      assert.strictEqual(args.bang, undefined);
      assert.strictEqual(args.cmd, undefined);
      assert.strictEqual(args.file, undefined);
      assert.strictEqual(args.opt, undefined);
      assert.strictEqual(args.optValue, undefined);
      assert.strictEqual(args.range, undefined);
    });

    newTest({
      title: 'Unknown ex command throws E492',
      start: ['tes|t'],
      keysPressed: ':fakecmd\n',
      end: ['tes|t'],
      endMode: Mode.Normal,
      statusBar: 'E492: Not an editor command: fakecmd',
    });
  });
});
