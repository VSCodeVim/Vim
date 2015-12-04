import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import TextEditor from './../textEditor';
import {Cursor} from './../motion/motion';
import {KeyState} from '../keyState';

export default class InsertMode extends Mode {
    private cursor : Cursor;
    private activationKeyHandler : { [ key : string] : (cursor : Cursor) => Thenable<{}> } = {
        "i" : () => {
            // insert at cursor
            return Promise.resolve({});
        },
        "I" : c => {
            // insert at line beginning
            return Promise.resolve(c.lineBegin().move());
        },
        "a" : c => {
            // append after the cursor
            return Promise.resolve(c.right().move());
        },
        "A" : c => {
            // append at the end of the line
	       return Promise.resolve(c.lineEnd().move());
        },
        "o" : () => {
            // open blank line below current line
	       return vscode.commands.executeCommand("editor.action.insertLineAfter");
        },
        "O" : () => {
            // open blank line above current line
	       return vscode.commands.executeCommand("editor.action.insertLineBefore");
        }
    };

    constructor() {
        super(ModeName.Insert);
        this.cursor = new Cursor();
    }

    handleKeys(state : KeyState) {
        while (!state.isAtEof) {
            const c = state.next();
            if (this.shouldRequestModeChange(c)) {
                state.nextMode = c;
                return null;
            }
            this.HandleKeyEvent(c);
            // console.warn("insert: " + c);
        }
    }
    
	private shouldRequestModeChange(key : string) : boolean {
		return (key === 'esc');
	}	    

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return key in this.activationKeyHandler;
    }

    HandleActivation(key : string) : Thenable<{}> {
        this.cursor.reset();
        return this.activationKeyHandler[key](this.cursor);
    }

    HandleKeyEvent(key : string) : Thenable<{}> {
        this.keyHistory.push(key);

        return TextEditor
                .insert(this.ResolveKeyValue(key))
                .then(() => {
                    return vscode.commands.executeCommand("editor.action.triggerSuggest");
                });
    }

    // Some keys have names that are different to their value.
    // TODO: we probably need to put this somewhere else.
    private ResolveKeyValue(key : string) : string {
        switch (key) {
            case 'space':
                return ' ';
            default:
                return key;
        }
    }
}
