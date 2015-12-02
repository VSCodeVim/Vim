import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import Cursor from './../cursor';
import TextEditor from './../textEditor';

export default class CommandMode extends Mode {
	private keyHandler : { [key : string] : () => void; } = {};

	constructor() {
		super(ModeName.Normal);

		this.keyHandler = {
			":" : () => { showCmdLine(); },
			"u" : () => { vscode.commands.executeCommand("undo"); },
			"ctrl+r" : () => { vscode.commands.executeCommand("redo"); },
			"h" : () => { Cursor.move(Cursor.left()); },
			"j" : () => { Cursor.move(Cursor.down()); },
			"k" : () => { Cursor.move(Cursor.up()); },
			"l" : () => { Cursor.move(Cursor.right()); },
			"$" : () => { Cursor.move(Cursor.lineEnd()); },
			"^" : () => { Cursor.move(Cursor.lineBegin()); },
			"w" : () => { Cursor.move(Cursor.wordRight()); },
			"b" : () => { Cursor.move(Cursor.wordLeft()); },
			">>" : () => { vscode.commands.executeCommand("editor.action.indentLines"); },
			"<<" : () => { vscode.commands.executeCommand("editor.action.outdentLines"); },
			"dd" : () => { vscode.commands.executeCommand("editor.action.deleteLines"); },
			"dw" : () => { vscode.commands.executeCommand("deleteWordRight"); },
			"db" : () => { vscode.commands.executeCommand("deleteWordLeft"); },
			"esc": () => { vscode.commands.executeCommand("workbench.action.closeMessages"); },
			"x" : () => { this.CommandDelete(1); }
		};
	}

	ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
		if (key === 'esc' || key === 'ctrl+[') {
			Cursor.move(Cursor.left());
			return true;
		}
	}

	HandleActivation(key : string) : void {
		// do nothing
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

    private CommandDelete(n: number) : void {
        let pos = Cursor.currentPosition();
        let end = pos.translate(0, n);
        let range : vscode.Range = new vscode.Range(pos, end);
        TextEditor.delete(range).then(function() {
			let lineEnd = Cursor.lineEnd();
			
			if (pos.character === lineEnd.character) {
				Cursor.move(Cursor.left());
			}
		});
    }
}