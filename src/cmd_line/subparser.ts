import * as node from "./node";
import * as command_node from './command_node';
import {Scanner} from './scanner';
import {parseQuitCommandArgs} from './subparser_quit';

// maps command names to parsers for said commands.
export const commandParsers = {
	w: parseWriteCommandArgs,
	write: parseWriteCommandArgs,
	quit: parseQuitCommandArgs,
	q: parseQuitCommandArgs
};

function parseWriteCommandArgs(args : string) : command_node.WriteCommand {
	if (!args) {
		return new command_node.WriteCommand();
	}
	var scannedArgs : command_node.WriteCommandArguments = {};
	var scanner = new Scanner(args);
	while (true) {
		scanner.skipWhiteSpace();
		if (scanner.isAtEof) {
			break;
		}
		let c = scanner.next();
		switch (c) {
			case '!':
				if (scanner.start > 0) {
					// :write !cmd
					scanner.ignore();
					while (!scanner.isAtEof) {
						scanner.next();
					}
					// vim ignores silently if no command after :w !
					scannedArgs.cmd = scanner.emit().trim() || undefined;
					continue;
				}
				// :write!
				scannedArgs.bang = true;
				scanner.ignore();
				continue;
			case '+':
				// :write ++opt=value
				scanner.expect('+');
				scanner.ignore();
				scanner.expectOneOf('bin', 'nobin', 'ff', 'enc');
				scannedArgs.opt = scanner.emit();
				scanner.expect('=');
				scanner.ignore();
				while (!scanner.isAtEof) {
					let c = scanner.next();
					if (c !== ' ' || c !== '\t') {
						continue;
					}
					scanner.backup();
					continue;
				}
				let value = scanner.emit();
				if (!value) {
					throw new Error("Expected value for option.");
				}
				scannedArgs.optValue = value;
				continue;
			default:
				throw new Error("Not implemented");
		}
	}
	// TODO: actually parse arguments.
	// ++bin ++nobin ++ff ++enc =VALUE
	return new node.WriteCommand(scannedArgs);
}
