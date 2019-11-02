import * as assert from 'assert';

import * as node from '../../src/cmd_line/node';
import * as parser from '../../src/cmd_line/parser';
import * as token from '../../src/cmd_line/token';

suite('command-line parser', () => {
  test('can parse empty string', () => {
    const cmd = parser.parse('');
    assert.ok(cmd.isEmpty);
  });

  test('can parse left - dot', () => {
    const cmd: node.CommandLine = parser.parse('.');
    assert.strictEqual(cmd.range.left[0].type, token.TokenType.Dot);
  });

  test('can parse left - dollar', () => {
    const cmd: node.CommandLine = parser.parse('$');
    assert.strictEqual(cmd.range.left[0].type, token.TokenType.Dollar);
  });

  test('can parse left - percent', () => {
    const cmd: node.CommandLine = parser.parse('%');
    assert.strictEqual(cmd.range.left[0].type, token.TokenType.Percent);
  });

  test('can parse separator - comma', () => {
    const cmd: node.CommandLine = parser.parse(',');
    assert.strictEqual(cmd.range.separator.type, token.TokenType.Comma);
  });

  test('can parse right - dollar', () => {
    const cmd: node.CommandLine = parser.parse(',$');
    assert.strictEqual(cmd.range.left.length, 0);
    assert.strictEqual(cmd.range.right.length, 1);
    assert.strictEqual(cmd.range.right[0].type, token.TokenType.Dollar, 'unexpected token');
  });
});
