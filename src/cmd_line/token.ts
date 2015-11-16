// Tokens for the Vim command line.

export enum TokenType {
	Eof = 0,
	LineNumber = 1,
	Dot = 2,
	Dollar = 3,
	Percent = 4,
	Comma = 5,
	Plus = 6,
	Minus = 7,
	CommandName = 8,
	CommandArgs = 9,
	SlashSearch = 10,
	QuestionMarkSearch = 11,
	Offset = 12
}

export interface Token {
	content : string;
	type : TokenType;
}

// TODO: test and implement tokenization for this.
export class TokenOffset implements Token {
	content : string;
	type : TokenType = TokenType.Offset;
	tokens : Token[];
	constructor() {
		this.tokens = [];
		this.content = this.tokens.join(' ');
	}
}

export class TokenEof implements Token {
	type : TokenType = TokenType.Eof;
	get content() : string { return '__EOF__' };
}

// Line referece.
export class TokenLineNumber implements Token {
	type : TokenType = TokenType.LineNumber;
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}

// Line referece.
export class TokenDot implements Token {
	type : TokenType = TokenType.Dot;
	get content() : string { return '.' };
}

// Line referece.
export class TokenDollar implements Token {
	type = TokenType.Dollar;
	get content() : string { return '$' };
}

export class TokenPercent implements Token {
	type = TokenType.Percent;
	get content() : string { return '%' };
}

export class TokenComma implements Token {
	type = TokenType.Comma;
	get content() : string { return ',' };
}

export class TokenPlus implements Token {
	type = TokenType.Plus;
	get content() : string { return '+' };
}

export class TokenMinus implements Token {
	type = TokenType.Minus;
	get content() : string { return '-' };
}

export class TokenCommandName implements Token {
	type = TokenType.CommandName;
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}

export class TokenCommandArgs implements Token {
	type = TokenType.CommandArgs;
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}

export class TokenSlashSearch implements Token {
	type = TokenType.SlashSearch;
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}

export class TokenQuestionMarkSearch implements Token {
	type = TokenType.QuestionMarkSearch;
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}