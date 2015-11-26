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
export class QuitCommand implements node.CommandBase {
	name : string;
	shortName : string;
	args : QuitCommandArguments;

	constructor(args : QuitCommandArguments = {}) {
		this.name = 'quit';
		this.shortName = 'q';
		this.args = args;
	}

	private doQuit(textEditor : vscode.TextEditor) {
		if ((textEditor.document.isDirty || textEditor.document.isUntitled)
			&& !this.args.bang) {
				throw new Error("unsaved changes");
		}
		
		vscode.commands.executeCommand('workbench.action.closeActiveEditor');
	};

	runOn(textEditor : vscode.TextEditor) : void {
		this.doQuit(textEditor);
	}
}
