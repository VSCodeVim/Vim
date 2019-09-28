import * as assert from 'assert';

import { commandParsers, getParser } from '../../src/cmd_line/subparser';

suite('getParser', () => {
  test('empty', () => {
    assert.equal(getParser(''), undefined);
  });

  test(':marks', () => {
    assert.notEqual(getParser('marks'), undefined);
    assert.equal(getParser('marksx'), undefined);
  });

  test(':write', () => {
    const w = getParser('w');
    assert.notEqual(w, undefined);

    assert.equal(getParser('wr'), w);
    assert.equal(getParser('wri'), w);
    assert.equal(getParser('writ'), w);
    assert.equal(getParser('write'), w);

    assert.equal(getParser('writex'), undefined);
  });

  test(':nohlsearch', () => {
    assert.equal(getParser('no'), undefined);

    const noh = getParser('noh');
    assert.notEqual(noh, undefined);

    assert.equal(getParser('nohl'), noh);
    assert.equal(getParser('nohls'), noh);
    assert.equal(getParser('nohlse'), noh);
    assert.equal(getParser('nohlsea'), noh);
    assert.equal(getParser('nohlsear'), noh);
    assert.equal(getParser('nohlsearc'), noh);
    assert.equal(getParser('nohlsearch'), noh);

    assert.equal(getParser('nohlsearchx'), undefined);
  });

  test(':quitall', () => {
    const qa = getParser('qa');
    assert.notEqual(qa, undefined);

    assert.equal(getParser('qal'), qa);
    assert.equal(getParser('qall'), qa);

    assert.equal(getParser('quita'), qa);
    assert.equal(getParser('quital'), qa);
    assert.equal(getParser('quitall'), qa);
  });

  suite(':write args parser', () => {
    test('can parse empty args', () => {
      // TODO: perhaps we don't need to export this func at all.
      // TODO: this func must return args only, not a command?
      // TODO: the range must be passed separately, not as arg.
      const args = commandParsers.write.parser('');
      assert.equal(args.arguments.append, undefined);
      assert.equal(args.arguments.bang, undefined);
      assert.equal(args.arguments.cmd, undefined);
      assert.equal(args.arguments.file, undefined);
      assert.equal(args.arguments.opt, undefined);
      assert.equal(args.arguments.optValue, undefined);
      assert.equal(args.arguments.range, undefined);
    });

    test('can parse ++opt', () => {
      const args = commandParsers.write.parser('++enc=foo');
      assert.equal(args.arguments.append, undefined);
      assert.equal(args.arguments.bang, undefined);
      assert.equal(args.arguments.cmd, undefined);
      assert.equal(args.arguments.file, undefined);
      assert.equal(args.arguments.opt, 'enc');
      assert.equal(args.arguments.optValue, 'foo');
      assert.equal(args.arguments.range, undefined);
    });

    test('throws if bad ++opt name', () => {
      assert.throws(() => commandParsers.write.parser('++foo=foo'));
    });

    test('can parse bang', () => {
      const args = commandParsers.write.parser('!');
      assert.equal(args.arguments.append, undefined);
      assert.equal(args.arguments.bang, true);
      assert.equal(args.arguments.cmd, undefined);
      assert.equal(args.arguments.file, undefined);
      assert.equal(args.arguments.opt, undefined);
      assert.equal(args.arguments.optValue, undefined);
      assert.equal(args.arguments.range, undefined);
    });

    test("can parse ' !cmd'", () => {
      const args = commandParsers.write.parser(' !foo');
      assert.equal(args.arguments.append, undefined);
      assert.equal(args.arguments.bang, undefined);
      assert.equal(args.arguments.cmd, 'foo');
      assert.equal(args.arguments.file, undefined);
      assert.equal(args.arguments.opt, undefined);
      assert.equal(args.arguments.optValue, undefined);
      assert.equal(args.arguments.range, undefined);
    });

    test("can parse ' !cmd' when cmd is empty", () => {
      const args = commandParsers.write.parser(' !');
      assert.equal(args.arguments.append, undefined);
      assert.equal(args.arguments.bang, undefined);
      assert.equal(args.arguments.cmd, undefined);
      assert.equal(args.arguments.file, undefined);
      assert.equal(args.arguments.opt, undefined);
      assert.equal(args.arguments.optValue, undefined);
      assert.equal(args.arguments.range, undefined);
    });
  });
});
