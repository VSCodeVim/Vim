import * as node from './node';

// maps command names to parsers for said commands.
export const commandParsers = {
	w: parseWriteCommandArgs,
	write: parseWriteCommandArgs
}

export function parseWriteCommandArgs(args : string = null) {
	// TODO: actually parse arguments.
	return new node.WriteCommand(args ? args : null);
}