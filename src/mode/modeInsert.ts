import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import TextEditor from './../textEditor';
import {Cursor} from './../motion/motion';

export default class InsertMode extends Mode {

    private activationKeyHandler : { [ key : string] : (cursor : Cursor) => Thenable<void> | void; };
    private cursor : Cursor = new Cursor();

    constructor() {
        super(ModeName.Insert);

        this.activationKeyHandler = {
            // insert at cursor
            "i" : (cursor) => {
                // nothing
            },

            // insert at the beginning of the line
            "I" : (cursor) => { cursor.lineBegin().move(); },

            // append after the cursor
            "a" : (cursor) => { cursor.right().move(); },

            // append at the end of the line
            "A" : (cursor) => { cursor.lineEnd().move(); },

            // open blank line below current line
            "o" : () => {
                return vscode.commands.executeCommand("editor.action.insertLineAfter");
            },

            // open blank line above current line
            "O" : () => {
                return vscode.commands.executeCommand("editor.action.insertLineBefore");
            }
        };
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return key in this.activationKeyHandler;
    }

    HandleActivation(key : string) : Thenable<void> | void {
        this.cursor.reset();
        return this.activationKeyHandler[key](this.cursor);
    }

    HandleKeyEvent(key : string) : Thenable<boolean> {
        this.keyHistory.push(key);
        TextEditor.insert(this.ResolveKeyValue(key)).then(() => {
			let reg = new RegExp("[a-zA-Z]");
			if (reg.test(key)) {
                let cursor = new Cursor();
				let pos = cursor.reset().position;
				let text = TextEditor.readLine(pos.line);
				if (text.length > 0) {
					let c = text[pos.character - 1];
					if (c !== undefined && reg.test(c)) {
						vscode.commands.executeCommand("editor.action.triggerSuggest");
						return true;
					}
				}
			}
			vscode.commands.executeCommand("hideSuggestWidget");
			return true;
        }, function() {
			vscode.commands.executeCommand("hideSuggestWidget");
			return false;
        });

        return;
    }

    // Some keys have names that are different to their value.
    // TODO: we probably need to put this somewhere else.
    private ResolveKeyValue(key : string) : string {
        switch (key) {
            case 'space':
                return ' ';
            case 'backspace':
                vscode.commands.executeCommand("deleteLeft");
                return '';
            default:
                return key;
        }
    }
}