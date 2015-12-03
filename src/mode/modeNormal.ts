import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Caret} from './../motion/motion';

export default class CommandMode extends Mode {
	private keyHandler : { [key : string] : () => void; } = {};
    private caret : Caret = new Caret();

	constructor() {
		super(ModeName.Normal);

		this.keyHandler = {
			":" : () => { showCmdLine(); },
			"u" : () => { vscode.commands.executeCommand("undo"); },
			"ctrl+r" : () => { vscode.commands.executeCommand("redo"); },
			"h" : () => { this.caret.left().move(); },
			"j" : () => { this.caret.down().move(); },
			"k" : () => { this.caret.up().move(); },
			"l" : () => { this.caret.right().move(); },
			"$" : () => { this.caret.lineEnd().move(); },
			"^" : () => { this.caret.lineBegin().move(); },
			"gg" : () => {this.caret.firstLineNonBlankChar().move(); },
			"G" : () => { this.caret.lastLineNonBlankChar().move(); },
			"w" : () => { this.caret.wordRight().move(); },
			"b" : () => { this.caret.wordLeft().move(); },
			">>" : () => { vscode.commands.executeCommand("editor.action.indentLines"); },
			"<<" : () => { vscode.commands.executeCommand("editor.action.outdentLines"); },
			"dd" : () => { vscode.commands.executeCommand("editor.action.deleteLines"); },
			"dw" : () => { vscode.commands.executeCommand("deleteWordRight"); },
			"db" : () => { vscode.commands.executeCommand("deleteWordLeft"); },
			// "x" : () => { this.CommandDelete(1); }
			"esc": () => { vscode.commands.executeCommand("workbench.action.closeMessages"); }
		};
	}

	ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
		return (key === 'esc' || key === 'ctrl+[');
	}

	HandleActivation(key : string) : void {
		this.caret.reset().left().move();
	}

	HandleKeyEvent(key : string) : void {
		this.keyHistory.push(key);

		let keyHandled = false;

		for (let window = this.keyHistory.length; window > 0; window--) {
			let keysPressed = _.takeRight(this.keyHistory, window).join('');
			if (this.keyHandler[keysPressed] !== undefined) {
				keyHandled = true;
				this.keyHandler[keysPressed]();
				break;
			}
		}

		if (keyHandled) {
			this.keyHistory = [];
		}
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
