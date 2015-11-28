import vscode = require('vscode');

import node = require('../node');
import error = require('../../error');

export interface QuitCommandArguments extends node.CommandArgs {
	bang?: boolean;
	range?: node.LineRange;
}

//
//  Implements :quit
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:quit
//
export class QuitCommand extends node.CommandBase {
	protected _arguments : QuitCommandArguments;

	constructor(args : QuitCommandArguments = {}) {
		super();
		this._name = 'quit';
		this._shortName = 'q';
		this._arguments = args;
	}
	
	get arguments() : QuitCommandArguments {
		return this._arguments;
	}
	
	execute() : void {
		this.quit();
	}	

	private quit() {
		// See https://github.com/Microsoft/vscode/issues/723
		if ((this.activeTextEditor.document.isDirty || this.activeTextEditor.document.isUntitled)
			&& !this.arguments.bang) {
				throw error.VimError.fromCode(error.ErrorCode.E37);
		}
		
		vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	};
}
