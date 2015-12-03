import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import TextEditor from './../textEditor';
import Cursor from './../cursor/cursor';
import {KeyState} from './../keyState';

export default class InsertMode extends Mode {

    private activationKeyHandler : { [ key : string] : () => Thenable<void> | void; };

    constructor() {
        super(ModeName.Insert);

        this.activationKeyHandler = {
            // insert at cursor
            "i" : () => { Cursor.move(Cursor.currentPosition()); },

            // insert at the beginning of the line
            "I" : () => { Cursor.move(Cursor.lineBegin()); },

            // append after the cursor
            "a" : () => { Cursor.move(Cursor.right()); },

            // append at the end of the line
            "A" : () => { Cursor.move(Cursor.lineEnd()); },

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
        return this.activationKeyHandler[key]();
    }

    handle(key : KeyState) {
        var c = key.next();
        switch (c) {
            case 'esc':
                key.reset();
                key.mustChangeMode = true;
                break;
            default:
                this.HandleKeyEvent(c);
        }
    }

    HandleKeyEvent(key : string) : Thenable<boolean> {
        this.keyHistory.push(key);
        var thenable = TextEditor.insert(this.ResolveKeyValue(key));

        vscode.commands.executeCommand("editor.action.triggerSuggest");

        return thenable;
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