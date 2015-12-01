import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import Cursor from './../cursor';
import TextEditor from './../textEditor';
import Repeat from './../repeat';

export default class CommandMode extends Mode {
	private keyHandler : { [key : string] : () => void; } = {};

	constructor() {
		super(ModeName.Normal);

		this.keyHandler = {
			":" : () => { showCmdLine(); },
			"u" : () => { vscode.commands.executeCommand("undo"); },
			"ctrl+r" : () => { vscode.commands.executeCommand("redo"); },
			"h" : () => { Cursor.move(Cursor.left(Repeat.get())); },
			"j" : () => { Cursor.move(Cursor.down(Repeat.get())); },
			"k" : () => { Cursor.move(Cursor.up(Repeat.get())); },
			"l" : () => { Cursor.move(Cursor.right(Repeat.get())); },
			"w" : () => { vscode.commands.executeCommand("cursorWordRight"); },
			"b" : () => { vscode.commands.executeCommand("cursorWordLeft"); },
			">>" : () => { vscode.commands.executeCommand("editor.action.indentLines"); },
			"<<" : () => { vscode.commands.executeCommand("editor.action.outdentLines"); },
			"dd" : () => { vscode.commands.executeCommand("editor.action.deleteLines"); },
			"dw" : () => { vscode.commands.executeCommand("deleteWordRight"); },
			"db" : () => { vscode.commands.executeCommand("deleteWordLeft"); },
			"esc": () => {
				vscode.commands.executeCommand("workbench.action.closeMessages");
				Repeat.reset();
			},
            "x" : () => { this.CommandDelete(Repeat.get()); },
			"0" : () => { if (!Repeat.add(0)) { Cursor.move(Cursor.lineBegin()); } },
			"1" : () => { Repeat.add(1); },
			"2" : () => { Repeat.add(2); },
			"3" : () => { Repeat.add(3); },
			"4" : () => { Repeat.add(4); },
			"5" : () => { Repeat.add(5); },
			"6" : () => { Repeat.add(6); },
			"7" : () => { Repeat.add(7); },
			"8" : () => { Repeat.add(8); },
			"9" : () => { Repeat.add(9); }
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
        var pos : vscode.Position = Cursor.currentPosition();
        var end : vscode.Position = pos.translate(0, n);
        var range : vscode.Range = new vscode.Range(pos, end);
        TextEditor.Delete(range).then(function() {
			Cursor.checkLineEnd();
		});
    }
}
