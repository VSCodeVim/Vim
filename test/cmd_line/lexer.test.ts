// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

import * as lexer from '../../src/cmd_line/lexer';
import { Token, TokenType } from '../../src/cmd_line/token';

suite('command-line lexer', () => {
  test('can lex empty string', () => {
    var tokens = lexer.lex('');
    assert.equal(tokens.length, 0);
  });

  test('can lex comma', () => {
    var tokens = lexer.lex(',');
    assert.equal(tokens[0].content, new Token(TokenType.Comma, ',').content);
  });

  test('can lex percent', () => {
    var tokens = lexer.lex('%');
    assert.equal(tokens[0].content, new Token(TokenType.Percent, '%').content);
  });

  test('can lex dollar', () => {
    var tokens = lexer.lex('$');
    assert.equal(tokens[0].content, new Token(TokenType.Dollar, '$').content);
  });

  test('can lex dot', () => {
    var tokens = lexer.lex('.');
    assert.equal(tokens[0].content, new Token(TokenType.Dot, '.').content);
  });

  test('can lex one number', () => {
    var tokens = lexer.lex('1');
    assert.equal(tokens[0].content, new Token(TokenType.LineNumber, '1').content);
  });

  test('can lex longer number', () => {
    var tokens = lexer.lex('100');
    assert.equal(tokens[0].content, new Token(TokenType.LineNumber, '100').content);
  });

  test('can lex plus', () => {
    var tokens = lexer.lex('+');
    assert.equal(tokens[0].content, new Token(TokenType.Plus, '+').content);
  });

  test('can lex minus', () => {
    var tokens = lexer.lex('-');
    assert.equal(tokens[0].content, new Token(TokenType.Minus, '-').content);
  });

  test('can lex forward search', () => {
    var tokens = lexer.lex('/horses/');
    assert.equal(tokens[0].content, new Token(TokenType.ForwardSearch, 'horses').content);
  });

  test('can lex forward search escaping', () => {
    var tokens = lexer.lex('/hor\\/ses/');
    assert.equal(tokens[0].content, new Token(TokenType.ForwardSearch, 'hor/ses').content);
  });

  test('can lex reverse search', () => {
    var tokens = lexer.lex('?worms?');
    assert.equal(tokens[0].content, new Token(TokenType.ReverseSearch, 'worms').content);
  });

  test('can lex reverse search escaping', () => {
    var tokens = lexer.lex('?wor\\?ms?');
    assert.equal(tokens[0].content, new Token(TokenType.ReverseSearch, 'wor?ms').content);
  });

  test('can lex command name', () => {
    var tokens = lexer.lex('w');
    assert.equal(tokens[0].content, new Token(TokenType.CommandName, 'w').content);
  });

  test('can lex command args', () => {
    var tokens = lexer.lex('w something');
    assert.equal(tokens[0].content, new Token(TokenType.CommandName, 'w').content);
    assert.equal(tokens[1].content, new Token(TokenType.CommandArgs, ' something').content);
  });

  test('can lex command args with leading whitespace', () => {
    var tokens = lexer.lex('q something');
    assert.equal(tokens[0].content, new Token(TokenType.CommandName, 'q').content);
    assert.equal(tokens[1].content, new Token(TokenType.CommandArgs, ' something').content);
  });

  test('can lex long command name and args', () => {
    var tokens = lexer.lex('write12 something here');
    assert.equal(tokens[0].content, new Token(TokenType.CommandName, 'write').content);
    assert.equal(tokens[1].content, new Token(TokenType.CommandArgs, '12 something here').content);
  });

  test('can lex left and right line refs', () => {
    var tokens = lexer.lex('20,30');
    assert.equal(tokens[0].content, new Token(TokenType.LineNumber, '20').content);
    assert.equal(tokens[1].content, new Token(TokenType.LineNumber, ',').content);
    assert.equal(tokens[2].content, new Token(TokenType.LineNumber, '30').content);
  });
});
