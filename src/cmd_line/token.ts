// Tokens for the Vim command line.

export interface Token {
	content : string;
}

// Line referece.
export class TokenLineNumber implements Token {
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}

// Line referece.
export class TokenDot implements Token {
	get content() : string { return '.' };
}

// Line referece.
export class TokenDollar implements Token {
	get content() : string { return '$' };
}

export class TokenPercent implements Token {
	get content() : string { return '%' };
}

export class TokenComma implements Token {
	get content() : string { return ',' };
}

export class TokenPlus implements Token {
	get content() : string { return '+' };
}

export class TokenMinus implements Token {
	get content() : string { return '-' };
}

export class TokenCommandName implements Token {
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}

export class TokenCommandArgs implements Token {
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}

export class TokenSlashSearch implements Token {
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}

export class TokenQuestionMarkSearch implements Token {
	content : string;
	constructor(content : string) {
		this.content = content;
	}	
}