import * as vscode from 'vscode';

import {ModeName, Mode} from './mode';
import TextEditor from './../textEditor';
import {Motion} from './../motion/motion';

export default class InsertMode extends Mode {
    private activationKeyHandler : { [ key : string] : (motion : Motion) => Thenable<{}> } = {
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

    constructor(motion : Motion) {
        super(ModeName.Insert, motion);
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return key in this.activationKeyHandler;
    }

    HandleActivation(key : string) : Thenable<{}> {
        return this.activationKeyHandler[key](this.Motion);
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
