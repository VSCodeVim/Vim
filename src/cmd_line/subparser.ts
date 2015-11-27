import {parseQuitCommandArgs} from './subparsers/quit';
import {parseWriteCommandArgs} from './subparsers/write';

// TODO: add type for this dict.
// maps command names to parsers for said commands.
export const commandParsers = { 
	'w': parseWriteCommandArgs,
	'write': parseWriteCommandArgs,
	
	'quit': parseQuitCommandArgs,
	'q': parseQuitCommandArgs
};
