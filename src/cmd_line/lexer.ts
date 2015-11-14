import * as lexerState from './lexer_state';
import * as token from './token';

interface ScanFunction {
	(state: lexerState.State, tokens: token.Token[]) : ScanFunction;
}

export function scan(input : string) : token.Token[] {
	var state = new lexerState.State(input);
	var tokens : token.Token[] = [];
	for (var f in scanRange(state, tokens)) {
		if (f === null) break;
		f(state, tokens);
	}
	return tokens;
}

function scanRange(state : lexerState.State, tokens : token.Token[]): ScanFunction  {
	while (true) {
		if (state.isAtEof) {
			break;
		}
		var c = state.next();
		switch (c) {
			case ',':
				tokens.push(new token.TokenComma());
				continue;
			case '%':
				tokens.push(new token.TokenPercent());
				continue;
			case '$':
				tokens.push(new token.TokenDollar());
				continue;
			case '.':
				tokens.push(new token.TokenDot());
				continue;
			case '/':
				scanForwardSearch(state, tokens);
				continue;
			case '?':
				scanReverseSearch(state, tokens);
				continue;
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				return scanLineRef(state, tokens);
			case '+':
				tokens.push(new token.TokenPlus());
				continue;
			case '-':
				tokens.push(new token.TokenMinus());
				continue;
			default:
				state.backup();
				return scanCommand(state, tokens);
		}
	}
	return null;
}

function scanLineRef(state : lexerState.State, tokens : token.Token[]): ScanFunction  {
	while (true) {
		if (state.isAtEof) {
			var emitted = state.emit();
			if (emitted) tokens.push(new token.TokenLineNumber(emitted));
			return null;
		}
		var c = state.next();
		switch (c) {
			case '0':
			case '1':
			case '2':			
			case '3':			
			case '4':			
			case '5':			
			case '6':			
			case '7':			
			case '8':			
			case '9':
			continue;			
			default:
			state.backup();
			var emitted = state.emit();
			if (emitted) tokens.push(new token.TokenLineNumber(emitted));
			return scanRange;
		}
	}
	return null;
}

function scanCommand(state : lexerState.State, tokens : token.Token[]): ScanFunction  {
	state.skipWhiteSpace();
	while (true) {
		if (state.isAtEof) {
			var emitted = state.emit();
			if (emitted) tokens.push(new token.TokenCommandName(emitted));
			break;
		}
		var c = state.next();
		var lc = c.toLowerCase();
		if (lc >= 'a' && lc <= 'z') {
			continue;
		}
		else {
			state.backup();
			tokens.push(new token.TokenCommandName(state.emit()));
			state.skipWhiteSpace();
			while (!state.isAtEof) state.next();
			var args = state.emit();
			if (args) tokens.push(new token.TokenCommandArgs(args));
			break;
		}		
	}
	return null;
}

function scanForwardSearch(state : lexerState.State, tokens : token.Token[]): ScanFunction  {
	state.skip('/');
	var escaping : boolean;
	var searchTerm = '';
	while(!state.isAtEof) {
		var c = state.next();
		if (c == '/' && !escaping) break;
		if (c == '\\') {
			escaping = true;
			continue;
		}
		else {
			escaping = false;
		}
		searchTerm += c != '\\' ? c : '\\\\';
	}
	tokens.push(new token.TokenSlashSearch(searchTerm));
	if (!state.isAtEof) state.skip('/');
	state.ignore();
	return scanRange;
}

function scanReverseSearch(state : lexerState.State, tokens : token.Token[]): ScanFunction  {
	state.skip('?');
	var escaping : boolean;
	var searchTerm = '';
	while(!state.isAtEof) {
		var c = state.next();
		if (c == '?' && !escaping) break;
		if (c == '\\') {
			escaping = true;
			continue;
		}
		else {
			escaping = false;
		}
		searchTerm += c != '\\' ? c : '\\\\';
	}
	tokens.push(new token.TokenQuestionMarkSearch(searchTerm));
	if (!state.isAtEof) state.skip('?');
	state.ignore();
	return scanRange;
}