// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as lexer from '../src/cmd_line/lexer'
import * as token from '../src/cmd_line/token'

suite("Cmd line tests - lexing", () => {

	test("can lex empty string", () => {
		var tokens = lexer.scan("");
		assert.equal(tokens.length, 0);
	});

	test("can lex comma", () => {
		var tokens = lexer.scan(",");
		assert.equal(tokens[0].content, new token.TokenComma().content);
	});

	test("can lex percent", () => {
		var tokens = lexer.scan("%");
		assert.equal(tokens[0].content, new token.TokenPercent().content);
	});

	test("can lex dollar", () => {
		var tokens = lexer.scan("$");
		assert.equal(tokens[0].content, new token.TokenDollar().content);
	});

	test("can lex dot", () => {
		var tokens = lexer.scan(".");
		assert.equal(tokens[0].content, new token.TokenDot().content);
	});

	test("can lex one number", () => {
		var tokens = lexer.scan("1");
		assert.equal(tokens[0].content, new token.TokenLineNumber("1").content);
	});

	test("can lex longer number", () => {
		var tokens = lexer.scan("100");
		assert.equal(tokens[0].content, new token.TokenLineNumber("100").content);
	});

	test("can lex plus", () => {
		var tokens = lexer.scan("+");
		assert.equal(tokens[0].content, new token.TokenPlus().content);
	});

	test("can lex minus", () => {
		var tokens = lexer.scan("-");
		assert.equal(tokens[0].content, new token.TokenMinus().content);
	});

	test("can lex forward search", () => {
		var tokens = lexer.scan("/horses/");
		assert.equal(tokens[0].content, new token.TokenSlashSearch("horses").content);
	});
	
	test("can lex forward search escaping", () => {
		var tokens = lexer.scan("/hor\\/ses/");
		assert.equal(tokens[0].content, new token.TokenSlashSearch("hor/ses").content);
	});	

	test("can lex reverse search", () => {
		var tokens = lexer.scan("?worms?");
		assert.equal(tokens[0].content, new token.TokenQuestionMarkSearch("worms").content);
	});

	test("can lex reverse search escaping", () => {
		var tokens = lexer.scan("?wor\\?ms?");
		assert.equal(tokens[0].content, new token.TokenQuestionMarkSearch("wor?ms").content);
	});

	test("can lex command name", () => {
		var tokens = lexer.scan("w");
		assert.equal(tokens[0].content, new token.TokenCommandName("w").content);
	});

	test("can lex command args", () => {
		var tokens = lexer.scan("w something");
		assert.equal(tokens[0].content, new token.TokenCommandName("w").content);
		assert.equal(tokens[1].content, new token.TokenCommandArgs("something").content);
	});
	
	test("can lex long command name and args", () => {
		var tokens = lexer.scan("write12 something here");
		assert.equal(tokens[0].content, new token.TokenCommandName("write").content);
		assert.equal(tokens[1].content, new token.TokenCommandArgs("12 something here").content);
	});

	test("can lex left and right line refs", () => {
		var tokens = lexer.scan("20,30");
		assert.equal(tokens[0].content, new token.TokenLineNumber("20").content);
		assert.equal(tokens[1].content, new token.TokenLineNumber(",").content);
		assert.equal(tokens[2].content, new token.TokenLineNumber("30").content);
	});		
});