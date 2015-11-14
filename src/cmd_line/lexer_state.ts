
// Lexer state.
export class State {
	static EOF : string = '__EOF__';
	start : number = 0;
	pos : number = 0;
	input : string;	
	
	constructor(input : string) {
		this.input = input;
	}
	
	// Returns the next character in the input, or EOF.
	next() : string {
		if (this.isAtEof) {
			this.pos = this.input.length;			
			return State.EOF;
		}
		let c = this.input[this.pos];
		this.pos++;
		return c;
	}
	
	// Returns whether we've reached EOF.
	get isAtEof() : boolean {
		return this.pos >= this.input.length;
	}
	
	// Ignores the span of text between the current start and the current position.
	ignore() : void {
		this.start = this.pos;
	}
	
	// Returns the span of text between the current start and the current position.
	emit() : string {
		let s = this.input.substring(this.start, this.pos);
		this.start = this.pos;
		return s;
	}
	
	backup(): void {
		this.pos--;
	}
	
	skip(c : string) : void {
		var s = this.next();
		while (!this.isAtEof) {
			if (s !== c) break;
			s = this.next();
		}
		this.backup();
	}
	
	skipRun(...chars : string[]) : void {
		while(!this.isAtEof) {
			var c = this.next();
			if (chars.indexOf(c) == -1) break;
		}
		this.backup();
	}
	
	skipWhiteSpace(): void {
		while (true) {
			var c = this.next();
			if (c == ' ' || c == '\t') continue;
			break;
		}
		this.backup();
		this.ignore();
	}
}