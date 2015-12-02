import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import Caret from './../cursor/caret';
import TextEditor from './../textEditor';
import {KeyState} from '../keyState';

export default class CommandMode extends Mode {
	private keyHandler : { [key : string] : () => void; } = {};
	private incomplete : Array<string>;

	constructor() {
		super(ModeName.Normal);
		this.incomplete = ['d'];
		this.keyHandler = {
			":" : () => { showCmdLine(); },
			"u" : () => { vscode.commands.executeCommand("undo"); },
			"ctrl+r" : () => { vscode.commands.executeCommand("redo"); },
			"h" : () => { Caret.move(Caret.left()); },
			"j" : () => { Caret.move(Caret.down()); },
			"k" : () => { Caret.move(Caret.up()); },
			"l" : () => { Caret.move(Caret.right()); },
			"$" : () => { Caret.move(Caret.lineEnd()); },
			"^" : () => { Caret.move(Caret.lineBegin()); },
			"gg" : () => { Caret.move(Caret.firstLineNonBlankChar()); },
			"G" : () => { Caret.move(Caret.lastLineNonBlankChar()); },
			"w" : () => { Caret.move(Caret.wordRight()); },
			"b" : () => { Caret.move(Caret.wordLeft()); },
			">>" : () => { vscode.commands.executeCommand("editor.action.indentLines"); },
			"<<" : () => { vscode.commands.executeCommand("editor.action.outdentLines"); },
			"dd" : () => { vscode.commands.executeCommand("editor.action.deleteLines"); },
			"dw" : () => { vscode.commands.executeCommand("deleteWordRight"); },
			"db" : () => { vscode.commands.executeCommand("deleteWordLeft"); },
			"esc": () => { vscode.commands.executeCommand("workbench.action.closeMessages"); },
			"x" : () => { this.CommandDelete(1); }
		};
	}
	
	// eventually, most of this would be handled by KeyState.handleInMode().
	handle(state : KeyState) {
		while (!state.isAtEof) {
			var keys = state.next();
			
			if (this.keyHandler[keys]) {
				this.keyHandler[keys]();
				state.ignore();
				return;
			}
		}
		
		if (state.isAtEof) {
			if (this.ShouldRequestModeChange(keys)) {
				state.mustChangeMode = true;
				state.reset();
			} else if (this.IsSequencePartial(keys)) {
				state.requestMoreUserInput = true;
			}
		}
	}
	
	IsSequencePartial(keys : string) {
		return _.any(this.incomplete, x => x === keys)
	}
	
	ShouldRequestModeChange(key : string) {
		return key === 'i' || key === 'a' || key === 'A' || key === 'I' || key === 'o' || key === 'O';
	}

	ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
		if (key === 'esc' || key === 'ctrl+[') {
			Caret.move(Caret.left());
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
}
