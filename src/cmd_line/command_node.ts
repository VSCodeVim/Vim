import fs = require('fs');

import vscode = require('vscode');

import node = require('./node');
import util = require('../util');

export interface WriteCommandArguments {
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
	name : string;
	shortName : string;
	args : WriteCommandArguments;

	constructor(args : WriteCommandArguments = {}) {
		super();
		this.name = 'write';
		this.shortName = 'w';
		this.args = args;
	}

	private doSave(textEditor : vscode.TextEditor) {
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

	execute() : void {
		if (this.args.opt) {
			util.showError("Not implemented.");
			return;
		} else if (this.args.file) {
			util.showError("Not implemented.");
			return;
		} else if (this.args.append) {
			util.showError("Not implemented.");
			return;
		} else if (this.args.cmd) {
			util.showError("Not implemented.");
			return;
		}

		fs.access(this.activeTextEditor.document.fileName, fs.W_OK, (accessErr) => {
			if (accessErr) {
				if (this.args.bang) {
					fs.chmod(this.activeTextEditor.document.fileName, 666, (e) => {
						if (e) {
							util.showError(e.message);
						} else {
							this.doSave(this.activeTextEditor);
						}
					});
				} else {
					util.showError(accessErr.message);
				}
			} else {
				this.doSave(this.activeTextEditor);
			}
		});
	}
}
