import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import Cursor from './../cursor';

export default class CommandMode extends Mode {
	private keyHandler : { [key : string] : () => void; } = {};
	private duoKeyHandler : { [key : string] : (string) => void; } = {};

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
			"0" : () => { Cursor.move(Cursor.lineBegin()); },
			"^" : () => { Cursor.move(Cursor.nonBlankLineBegin()); },						
			"w" : () => { vscode.commands.executeCommand("cursorWordRight"); },
			"b" : () => { vscode.commands.executeCommand("cursorWordLeft"); },			
			">>" : () => { vscode.commands.executeCommand("editor.action.indentLines"); },
			"<<" : () => { vscode.commands.executeCommand("editor.action.outdentLines"); },
			"dd" : () => { vscode.commands.executeCommand("editor.action.deleteLines"); },
			"dw" : () => { vscode.commands.executeCommand("deleteWordRight"); },
			"db" : () => { vscode.commands.executeCommand("deleteWordLeft"); },
			"gg" : () => { vscode.commands.executeCommand("cursorTop"); },
			"G" : () => { vscode.commands.executeCommand("cursorBottom"); },			
			"esc": () => { vscode.commands.executeCommand("workbench.action.closeMessages"); }
		};	
				
		this.duoKeyHandler = {
			"f" : (schar) => { Cursor.move(Cursor.searchLineForward(schar)); },
			"F" : (schar) => { Cursor.move(Cursor.searchLineBackward(schar)); }
		}				
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
			if (this.duoKeyHandler[keysPressed[0]] !== undefined && keysPressed.length == 2) {
				keyHandled = true;
				this.duoKeyHandler[keysPressed[0]](keysPressed[1]);
				break;
			} else {							
				if (this.keyHandler[keysPressed] !== undefined) {
					keyHandled = true;
					this.keyHandler[keysPressed]();
					break;
				}
			}
		}
		
		if (keyHandled) {
			this.keyHistory = [];
		}
	}
}
