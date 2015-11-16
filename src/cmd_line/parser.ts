// parse range
// parse command name
// command parses its own arguments

import * as vscode from 'vscode';
import * as token from './token';
import * as node from './node';
import * as lexer from './lexer';
import {parseWriteCommandArgs, commandParsers} from './subparsers';
import * as util from '../util';

interface ParseFunction {
	(state : ParserState, command : node.CommandLine) : ParseFunction;
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
				state.backup();
				return parseCommand;
				// commandLine.command = new node.CommandLineCommand(tok.content, null);
				// continue; 
			default:
				console.warn("skipping token " + "Token(" + tok.type + ",{" + tok.content + "})");
				return null;				
		}		
	}
}

function parseCommand(state : ParserState, commandLine : node.CommandLine) : ParseFunction {
	while (!state.isAtEof) {
		var tok = state.next();
		switch (tok.type) {
			case token.TokenType.CommandName:
				var commandParser = commandParsers[tok.content];
				if (!commandParser) {
					throw new Error("not implemented or not a valid command");
				}
				// TODO: Pass the args, but keep in mind there could be multiple
				// commands, not just one.
				var argsTok = state.next();
				var args = argsTok.type === token.TokenType.CommandArgs ? argsTok.content : null;
				commandLine.command = commandParser(args);
				return null;
			default:
				throw new Error("not implemented");
		}
	}
	if (!state.isAtEof) {
		state.backup();
		return parseCommand;
	}
	else {
		return null;
	}
}

// Keeps track of parsing state.
class ParserState {
	tokens : token.Token[] = [];
	pos : number = 0;
	
	constructor(input : string) {
		this.lex(input);
	}
	
	lex(input : string) {
		this.tokens = lexer.lex(input);
	}
	
	next() : token.Token {
		if (this.pos >= this.tokens.length) {
			this.pos = this.tokens.length;
			return new token.Token(token.TokenType.Eof, '__EOF__');
		}
		let tok = this.tokens[this.pos];
		this.pos++;
		return tok;
	}
	
	backup() : void {
		this.pos--;
	}
	
	get isAtEof() {
		return this.pos >= this.tokens.length; // XXX the last token is TokenEof; is this correct?
	}
}
