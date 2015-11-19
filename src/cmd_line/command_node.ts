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
export class WriteCommand implements node.CommandBase {
	name : string;
	shortName : string;
	args : WriteCommandArguments;

	constructor(args : WriteCommandArguments = {}) {
		this.name = 'write';
		this.shortName = 'w';
		this.args = args;
	}

	private doSave(textEditor : vscode.TextEditor) {
		textEditor.document.save().then(
			(ok) => {
				if (ok) {
					util.showInfo("File saved.");
				} else {
					util.showError("File not saved.");
				}
			},
			(e) => util.showError(e)
		);
	};

	runOn(textEditor : vscode.TextEditor) : void {
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

		fs.access(textEditor.document.fileName, fs.W_OK, (accessErr) => {
			if (accessErr) {
				if (this.args.bang) {
					fs.chmod(textEditor.document.fileName, 666, (e) => {
						if (e) {
							util.showError(e.message);
						} else {
							this.doSave(textEditor);
						}
					});
				} else {
					util.showError(accessErr.message);
				}
			} else {
				this.doSave(textEditor);
			}
		});
	}
}
