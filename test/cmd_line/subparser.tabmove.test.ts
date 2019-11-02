import * as assert from 'assert';

import { commandParsers } from '../../src/cmd_line/subparser';

function testTabMoveParse(args: string, count?: number, direction?: 'left' | 'right'): void {
  const test = (args1: string) => {
    const cmd = commandParsers.tabmove.parser(args1);
    assert.strictEqual(cmd.arguments.count, count);
    assert.strictEqual(cmd.arguments.direction, direction);
  };

  test(args);
  test(args + '  ');
}

function failsTabMoveParse(args: string): void {
  const test = (args1: string) => {
    assert.throws(() => commandParsers.tabmove.parser(args1));
  };

  test(args);
  test(args + '  ');
}

suite(':tabm[ove] args parser', () => {
  test('has :tabm alias', () => {
    assert.strictEqual(commandParsers.tabmove.abbrev, 'tabm');
  });

  test('can parse empty args', () => {
    testTabMoveParse('', undefined, undefined);
  });

  test('can parse an absolute position', () => {
    testTabMoveParse('0', 0, undefined);
    testTabMoveParse('10', 10, undefined);
    testTabMoveParse('100', 100, undefined);
  });

  test('can parse a relative position', () => {
    testTabMoveParse('+', 1, 'right');
    testTabMoveParse('-', 1, 'left');
    testTabMoveParse('+1', 1, 'right');
    testTabMoveParse('-1', 1, 'left');
    testTabMoveParse('+10', 10, 'right');
    testTabMoveParse('-10', 10, 'left');
    testTabMoveParse('+100', 100, 'right');
    testTabMoveParse('-100', 100, 'left');
  });

  test('fails with invalid inputs', () => {
    failsTabMoveParse('+0');
    failsTabMoveParse('-0');

    failsTabMoveParse('--');
    failsTabMoveParse('++');

    failsTabMoveParse('1+');
    failsTabMoveParse('1-');

    failsTabMoveParse('x');
    failsTabMoveParse('0x');
    failsTabMoveParse('10x');
    failsTabMoveParse('100x');

    failsTabMoveParse('x0');
    failsTabMoveParse('x10');
    failsTabMoveParse('x100');
  });
});
