// parse range
// parse command name
// command parses its own arguments

import * as token from './token';
import * as lexer from './lexer';

class CommandLineCommand {
	name : string;
	args : token.TokenCommandArgs;
	constructor(name : string, args : token.TokenCommandArgs) {
		this.name = name;
		this.args = args;
	}
	
	get isEmpty() : boolean {
		return !this.name && !this.args;
	}
}

class LineRange {
	left : token.Token[];
	separator : token.Token;
	right : token.Token[];
	
	constructor() {
		this.left = [];
		this.right = [];
	}
	
	addToken(tok : token.Token) : void  {
		if (!this.separator) this.left.push(tok);
		else 				 this.right.push(tok);
	}
	
	get isEmpty() : boolean {
		return this.left.length === 0 && this.right.length === 0 && !this.separator;
	}
}

export class CommandLine {
	range : LineRange;
	command : CommandLineCommand;
	
	constructor() {
		this.range = new LineRange();
		this.command = new CommandLineCommand(null, null);
	}
	
	get isEmpty() : boolean {
		return this.range.isEmpty && this.command.isEmpty;
	}
}

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

interface ParseFunction {
	(state : ParserState, command : CommandLine) : ParseFunction;
}

export function parse(input : string) : CommandLine {
	var command = new CommandLine();
	var f : ParseFunction = parseLineRange;
	let state : ParserState = new ParserState(input);
	while (f) {
		f = f(state, command);
	}
	return command;
}

function parseLineRange(state : ParserState, command : CommandLine) : ParseFunction {	
	while (true) {
		let tok = state.next();
		switch (tok.type) {
			case token.TokenType.Eof:
				return null;
			case token.TokenType.Dot:
			case token.TokenType.Dollar:
			case token.TokenType.Percent:
				command.range.addToken(tok);
			default:
				return null;				
		}		
	}
}