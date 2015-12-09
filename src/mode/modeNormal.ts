import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Caret} from './../motion/motion';

export default class NormalMode extends Mode {
	private _caret : Caret;
	private get caret() : Caret {
		this._caret = this._caret || new Caret();
		return this._caret;
	}

	private keyHandler : { [key : string] : (caret : Caret) => Thenable<{}>; } = {
		":" : () => { return showCmdLine(); },
		"u" : () => { return vscode.commands.executeCommand("undo"); },
		"ctrl+r" : () => { return vscode.commands.executeCommand("redo"); },
		"h" : c => { return Promise.resolve(c.left().move()); },
		"j" : c => { return Promise.resolve(c.down().move()); },
		"k" : c => { return Promise.resolve(c.up().move()); },
		"l" : c => { return Promise.resolve(c.right().move()); },
		"$" : c => { return Promise.resolve(c.lineEnd().move()); },
		"^" : c => { return Promise.resolve(c.lineBegin().move()); },
		"gg" : c => {return Promise.resolve(c.firstLineNonBlankChar().move()); },
		"G" : c => { return Promise.resolve(c.lastLineNonBlankChar().move()); },
		"w" : c => { return Promise.resolve(c.wordRight().move()); },
		"b" : c => { return Promise.resolve(c.wordLeft().move()); },
		">>" : () => { return vscode.commands.executeCommand("editor.action.indentLines"); },
		"<<" : () => { return vscode.commands.executeCommand("editor.action.outdentLines"); },
		"dd" : () => { return vscode.commands.executeCommand("editor.action.deleteLines"); },
		"dw" : () => { return vscode.commands.executeCommand("deleteWordRight"); },
		"db" : () => { return vscode.commands.executeCommand("deleteWordLeft"); },
		// "x" : () => { this.CommandDelete(1); }
		"esc": () => { return vscode.commands.executeCommand("workbench.action.closeMessages"); }
	};

	constructor() {
		super(ModeName.Normal);
	}

	ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
		return (key === 'esc' || key === 'ctrl+[');
	}

	HandleActivation(key : string) : Thenable<{}> {
		return Promise.resolve(this.caret.reset().left().move());
	}

	HandleKeyEvent(key : string) : Thenable<{}>  {
		this.keyHistory.push(key);

		return new Promise(resolve => {
			let keyHandled = false;
			let keysPressed : string;

			for (let window = this.keyHistory.length; window > 0; window--) {
				keysPressed = _.takeRight(this.keyHistory, window).join('');
				if (this.keyHandler[keysPressed] !== undefined) {
					keyHandled = true;
					break;
				}
			}

			if (keyHandled) {
				this.keyHistory = [];
				return this.keyHandler[keysPressed](this.caret);
			}

			resolve();
		});
	}

/*
    private CommandDelete(n: number) : void {
        let pos = Caret.currentPosition();
        let end = pos.translate(0, n);
        let range : vscode.Range = new vscode.Range(pos, end);
        TextEditor.delete(range).then(function() {
			let lineEnd = Caret.lineEnd();

			if (pos.character === lineEnd.character + 1) {
				Caret.move(Caret.left());
			}
		});
    }
*/
}
