"use strict";

import * as vscode from 'vscode';

import {Command} from './commands';
import {ModeName, Mode} from './mode';
import {TextEditor} from './../textEditor';
import {Motion} from './../motion/motion';

export class InsertMode extends Mode {
    protected handleActivationKey(command : Command) : (motion: Motion) => Promise<{}> {
        switch ( command ) {
            case Command.InsertAtCursor:
                return async (c) => { return c.move(); };
            case Command.InsertAtLineBegin:
                return async (c) => { return c.lineBegin().move(); };
            case Command.InsertAfterCursor:
                return async (c) => { return c.right().move(); };
            case Command.InsertAtLineEnd:
                return async (c) => { return c.lineEnd().move(); };
            case Command.InsertNewLineBelow:
                return async () => {
                    return await vscode.commands.executeCommand("editor.action.insertLineAfter");
                };
            case Command.InsertNewLineAbove:
                return async () => {
                    return await vscode.commands.executeCommand("editor.action.insertLineBefore");
                };
            default:
                return async () => { return {}; };
        }
    }

    constructor(motion : Motion, keymap : {[key: string]: Command}) {
        super(ModeName.Insert, motion, keymap);
    }

    shouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return key in this._keymap && currentMode === ModeName.Normal;
    }

    async handleActivation(key : string): Promise<void> {
        let command : Command = this._keymap[key];
        await this.handleActivationKey(command)(this.motion);
    }

    async handleKeyEvent(key : string) : Promise<boolean> {
        await TextEditor.insert(this.resolveKeyValue(key));
        await vscode.commands.executeCommand("editor.action.triggerSuggest");

        return true;
    }

    // Some keys have names that are different to their value.
    // TODO: we probably need to put this somewhere else.
    private resolveKeyValue(key : string) : string {
        switch (key) {
            case 'space':
                return ' ';
            default:
                return key;
        }
    }
}
