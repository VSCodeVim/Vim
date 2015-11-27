// XXX: use graceful-fs ??
import fs = require('fs');

import vscode = require('vscode');

import node = require('../node');
import util = require('../../util');

export interface WriteCommandArguments extends node.CommandArgs {
	opt? : string;
	optValue? : string;
	bang? : boolean;
	range? : node.LineRange;
	file? : string;
	append? : boolean;
	cmd? : string;
}

//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:write
//
export class WriteCommand extends node.CommandBase {
	protected _arguments : WriteCommandArguments;

	constructor(args : WriteCommandArguments = {}) {
		super();
		this._name = 'write';
		this._shortName = 'w';
		this._arguments = args;
	}
	
	get arguments() : WriteCommandArguments {
		return this._arguments;
	}

	execute() : void {
		if (this._arguments.opt) {
			util.showError("Not implemented.");
			return;
		} else if (this._arguments.file) {
			util.showError("Not implemented.");
			return;
		} else if (this._arguments.append) {
			util.showError("Not implemented.");
			return;
		} else if (this._arguments.cmd) {
			util.showError("Not implemented.");
			return;
		}

		fs.access(this.activeTextEditor.document.fileName, fs.W_OK, (accessErr) => {
			if (accessErr) {
				if (this._arguments.bang) {
					fs.chmod(this.activeTextEditor.document.fileName, 666, (e) => {
						if (e) {
							util.showError(e.message);
						} else {
							this.save(this.activeTextEditor);
						}
					});
				} else {
					util.showError(accessErr.message);
				}
			} else {
				this.save(this.activeTextEditor);
			}
		});
	}

	private save(textEditor : vscode.TextEditor) {
		this.activeTextEditor.document.save().then(
			(ok) => {
				if (ok) {
					util.showInfo("File saved.");
				} else {
					util.showError("File not saved.");
				}
			},
			(e) => util.showError(e)
		);
	}	
}
