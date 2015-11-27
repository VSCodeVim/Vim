import vscode = require('vscode');

import node = require('./node');

export interface QuitCommandArguments {
	bang? : boolean;
	range? : node.LineRange;
}

//
//  Implements :quit
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:quit
//
export class QuitCommand extends node.CommandBase {
	name : string;
	shortName : string;
	args : QuitCommandArguments;

	constructor(args : QuitCommandArguments = {}) {
		super();
		this.name = 'quit';
		this.shortName = 'q';
		this.args = args;
	}

	private doQuit(textEditor : vscode.TextEditor) {
		if ((this.activeTextEditor.document.isDirty || this.activeTextEditor.document.isUntitled)
			&& !this.args.bang) {
				throw new Error("unsaved changes");
		}
		
		vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	};

	runOn() : void {
		this.doQuit(this.activeTextEditor);
	}
}
