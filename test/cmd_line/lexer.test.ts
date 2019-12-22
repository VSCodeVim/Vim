import * as assert from 'assert';

import * as lexer from '../../src/cmd_line/lexer';
import { Token, TokenType } from '../../src/cmd_line/token';

suite('command-line lexer', () => {
  test('can lex empty string', () => {
    const tokens = lexer.lex('');
    assert.strictEqual(tokens.length, 0);
  });

  test('can lex comma', () => {
    const tokens = lexer.lex(',');
    assert.strictEqual(tokens[0].content, new Token(TokenType.Comma, ',').content);
  });

  test('can lex percent', () => {
    const tokens = lexer.lex('%');
    assert.strictEqual(tokens[0].content, new Token(TokenType.Percent, '%').content);
  });

  test('can lex dollar', () => {
    const tokens = lexer.lex('$');
    assert.strictEqual(tokens[0].content, new Token(TokenType.Dollar, '$').content);
  });

  test('can lex dot', () => {
    const tokens = lexer.lex('.');
    assert.strictEqual(tokens[0].content, new Token(TokenType.Dot, '.').content);
  });

  test('can lex one number', () => {
    const tokens = lexer.lex('1');
    assert.strictEqual(tokens[0].content, new Token(TokenType.LineNumber, '1').content);
  });

  test('can lex longer number', () => {
    const tokens = lexer.lex('100');
    assert.strictEqual(tokens[0].content, new Token(TokenType.LineNumber, '100').content);
  });

  test('can lex plus', () => {
    const tokens = lexer.lex('+');
    assert.strictEqual(tokens[0].content, new Token(TokenType.Plus, '+').content);
  });

  test('can lex minus', () => {
    const tokens = lexer.lex('-');
    assert.strictEqual(tokens[0].content, new Token(TokenType.Minus, '-').content);
  });

  test('can lex forward search', () => {
    const tokens = lexer.lex('/horses/');
    assert.strictEqual(tokens[0].content, new Token(TokenType.ForwardSearch, 'horses').content);
  });

  test('can lex forward search escaping', () => {
    const tokens = lexer.lex('/hor\\/ses/');
    assert.strictEqual(tokens[0].content, new Token(TokenType.ForwardSearch, 'hor/ses').content);
  });

  test('can lex reverse search', () => {
    const tokens = lexer.lex('?worms?');
    assert.strictEqual(tokens[0].content, new Token(TokenType.ReverseSearch, 'worms').content);
  });

  test('can lex reverse search escaping', () => {
    const tokens = lexer.lex('?wor\\?ms?');
    assert.strictEqual(tokens[0].content, new Token(TokenType.ReverseSearch, 'wor?ms').content);
  });

  test('can lex command name', () => {
    const tokens = lexer.lex('w');
    assert.strictEqual(tokens[0].content, new Token(TokenType.CommandName, 'w').content);
  });

  test('can lex command args', () => {
    const tokens = lexer.lex('w something');
    assert.strictEqual(tokens[0].content, new Token(TokenType.CommandName, 'w').content);
    assert.strictEqual(tokens[1].content, new Token(TokenType.CommandArgs, ' something').content);
  });

  test('can lex command args with leading whitespace', () => {
    const tokens = lexer.lex('q something');
    assert.strictEqual(tokens[0].content, new Token(TokenType.CommandName, 'q').content);
    assert.strictEqual(tokens[1].content, new Token(TokenType.CommandArgs, ' something').content);
  });

  test('can lex long command name and args', () => {
    const tokens = lexer.lex('write12 something here');
    assert.strictEqual(tokens[0].content, new Token(TokenType.CommandName, 'write').content);
    assert.strictEqual(
      tokens[1].content,
      new Token(TokenType.CommandArgs, '12 something here').content
    );
  });

  test('can lex left and right line refs', () => {
    const tokens = lexer.lex('20,30');
    assert.strictEqual(tokens[0].content, new Token(TokenType.LineNumber, '20').content);
    assert.strictEqual(tokens[1].content, new Token(TokenType.LineNumber, ',').content);
    assert.strictEqual(tokens[2].content, new Token(TokenType.LineNumber, '30').content);
  });
});
