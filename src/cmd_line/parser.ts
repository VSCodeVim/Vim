// parse range
// parse command name
// command parses its own arguments

import * as vscode from 'vscode';
import * as token from './token';
import * as node from './node';
import * as lexer from './lexer';

interface ParseFunction {
	(state : ParserState, command : node.CommandLine) : ParseFunction;
}

// Keeps track of parsing state.
class ParserState {
	tokens : token.Token[] = [];
	pos : number = 0;
	
	constructor(input : string) {
		this.lex(input);
	}
	
	lex(input : string) {
		this.tokens = lexer.scan(input);
	}
	
	next() : token.Token {
		if (this.pos >= this.tokens.length) {
			this.pos = this.tokens.length;
			return new token.TokenEof();
		}
		let tok = this.tokens[this.pos];
		this.pos++;
		return tok;
	}
}

export function parse(input : string) : node.CommandLine {
	var cmd = new node.CommandLine();
	var f : ParseFunction = parseLineRange;
	let state : ParserState = new ParserState(input);
	while (f) f = f(state, cmd);
	return cmd;
}

function parseLineRange(state : ParserState, commandLine : node.CommandLine) : ParseFunction {	
	while (true) {
		let tok = state.next();
		switch (tok.type) {
			case token.TokenType.Eof:
				return null;
			case token.TokenType.Dot:
			case token.TokenType.Dollar:
			case token.TokenType.Percent:
			case token.TokenType.Comma:
			case token.TokenType.LineNumber:
				commandLine.range.addToken(tok);
				continue;
			case token.TokenType.CommandName:
				commandLine.command = new node.CommandLineCommand(tok.content, null);
				continue; 
			default:
				console.warn("skipping token " + "Token(" + tok.type + ",{" + tok.content + "})");
				return null;				
		}		
	}
}