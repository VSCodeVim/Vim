// parse range
// parse command name
// command parses its own arguments

import * as vscode from 'vscode';
import * as token from './token';
import * as lexer from './lexer';

export class CommandLineCommand {
	name : string;
	args : token.TokenCommandArgs;
	constructor(name : string, args : token.TokenCommandArgs) {
		this.name = name;
		this.args = args;
	}
	
	get isEmpty() : boolean {
		return !this.name && !this.args;
	}
	
	toString() : string {
		return this.name + " " + this.args;
	}
}

export class LineRange {
	left : token.Token[];
	separator : token.Token;
	right : token.Token[];
	
	constructor() {
		this.left = [];
		this.right = [];
	}
	
	addToken(tok : token.Token) : void  {
		if (tok.type == token.TokenType.Comma) {
			console.log("adding sep " + tok.type);
			this.separator = tok;
			return;
		}
		
		if (!this.separator) {
			if (this.left.length > 0 && tok.type != token.TokenType.Offset) {
				// XXX: is this always this error?
				throw Error("not a Vim command");
			}
			this.left.push(tok);
		}
		else {
			if (this.right.length > 0 && tok.type != token.TokenType.Offset) {
				// XXX: is this always this error?
				throw Error("not a Vim command");
			}			
			this.right.push(tok);
		}
	}
	
	get isEmpty() : boolean {
		return this.left.length === 0 && this.right.length === 0 && !this.separator;
	}
	
	toString() : string {
		return this.left.toString() + this.separator.content + this.right.toString();
	}
	
	runOn(document : vscode.TextEditor) : void {
		if (this.isEmpty) {
			return;
		}
		var lineRef = !this.right ? this.left : this.right;
		var pos = this.lineRefToPosition(document, lineRef);
		document.selection = new vscode.Selection(pos, pos);
	}
	
	lineRefToPosition(doc : vscode.TextEditor, toks : token.Token[]) : vscode.Position {
		var first = toks[0];
		switch (first.type) {
			case token.TokenType.Dollar:
			case token.TokenType.Percent:
				return new vscode.Position(doc.document.lineCount, 0);
			case token.TokenType.Dot:
				return new vscode.Position(doc.selection.active.line, 0);
			case token.TokenType.LineNumber:
				var line = Number.parseInt(first.content);
				line = Math.max(0, line - 1);
				line = Math.min(doc.document.lineCount, line);
				return new vscode.Position(line, 0);
			default:
				throw new Error("not implemented");
		}
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
	
	toString() : string {
		return ":" + this.range.toString() + " " + this.command.toString();
	}

	// Runs the command line on a text editor.
	runOn(document : vscode.TextEditor) {
		if (this.command.isEmpty) {
			// no command, so let's go to the requested line
			this.range.runOn(document);
			return;
		}
		throw new Error("not implemented");
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
			case token.TokenType.Comma:
			case token.TokenType.LineNumber:
				command.range.addToken(tok);
				continue;
			default:
				return null;				
		}		
	}
}