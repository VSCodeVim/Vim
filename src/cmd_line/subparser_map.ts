import * as node from "./node";
import * as command_node from './command_node_map';
import {Scanner} from './scanner';

export function parseMapCommandArgs(args : string) : command_node.MapCommand {
	var parsedArgs : command_node.MapCommandArguments = {};
	var scanner = new Scanner(args);
	scanner.skipWhiteSpace();
	while (!scanner.isAtEof) {
		var c = scanner.next();
		if (c === ' ' || c === '\t')
		{
			scanner.backup();
			parsedArgs.lhs = scanner.emit();
			break;
		}
	}
	if (scanner.isAtEof) {
		parsedArgs.rhs = "";
		return new command_node.MapCommand(parsedArgs);
	}
	scanner.expect(' ');
	scanner.ignore();
	while(!scanner.isAtEof) {
		scanner.next();
	}
	parsedArgs.rhs = scanner.emit();
	return new command_node.MapCommand(parsedArgs);
}