import {State} from './lexer_state';
import * as token from './token';

interface ScanFunction {
	(state: State, tokens: token.Token[]) : ScanFunction;
}

export function scan(input : string) : token.Token[] {
	var state = new State(input);
	var tokens : token.Token[] = [];
	var f : ScanFunction = scanRange; // first scanning function
	while (f) {
		// Each scanning function returns the next scanning function or null.
		f = f(state, tokens);
	}
	return tokens;
}

function scanRange(state : State, tokens : token.Token[]): ScanFunction  {
	while (true) {
		if (state.isAtEof) {
			break;
		}
		var c = state.next();
		switch (c) {
			case ',':
				tokens.push(new token.TokenComma());
				state.ignore();
				continue;
			case '%':
				tokens.push(new token.TokenPercent());
				state.ignore();
				continue;
			case '$':
				tokens.push(new token.TokenDollar());
				state.ignore();
				continue;
			case '.':
				tokens.push(new token.TokenDot());
				state.ignore();
				continue;
			case '/':
				return scanForwardSearch;
			case '?':
				return scanReverseSearch
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
				return scanLineRef;
			case '+':
				tokens.push(new token.TokenPlus());
				state.ignore();
				continue;
			case '-':
				tokens.push(new token.TokenMinus());
				state.ignore();
				continue;
			default:
				state.backup();
				return scanCommand;
		}
	}
	return null;
}

function scanLineRef(state : State, tokens : token.Token[]): ScanFunction  {
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

function scanCommand(state : State, tokens : token.Token[]): ScanFunction  {
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

function scanForwardSearch(state : State, tokens : token.Token[]): ScanFunction  {
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
	state.ignore();
	if (!state.isAtEof) state.skip('/');
	return scanRange;
}

function scanReverseSearch(state : State, tokens : token.Token[]): ScanFunction  {
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
	state.ignore();
	if (!state.isAtEof) state.skip('?');
	return scanRange;
}