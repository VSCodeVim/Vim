import * as node from "../commands/quit";
import {Scanner} from '../scanner';

export function parseQuitCommandArgs(args : string) : node.QuitCommand {
	if (!args) {
		return new node.QuitCommand();
	}
	var scannedArgs : node.QuitCommandArguments = {};
	var scanner = new Scanner(args);
	const c = scanner.next();
	if (c === '!') {
		scannedArgs.bang = true;
	} else if (c !== ' ') {
		throw new Error('bad command');
	}
	scanner.skipWhiteSpace();
	if (!scanner.isAtEof) {
		throw new Error('bad command');
	}
	return new node.QuitCommand(scannedArgs);
}
