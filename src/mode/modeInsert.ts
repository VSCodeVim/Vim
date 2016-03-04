"use strict";

import * as vscode from 'vscode';

import {ModeName, Mode} from './mode';
import {TextEditor} from './../textEditor';
import {Motion} from './../motion/motion';
import { ModeHandler } from './modeHandler.ts';
import { Position } from './../motion/position';

export class InsertMode extends Mode {
    private _modeHandler   : ModeHandler;

    protected motions: { [key: string]: (position: Position, count: number, argument: string) => Promise<Position>; } = { };
    protected commands : { [key : string] : (ranger, argument : string) => Promise<{}>; } = {
        "esc" : async () => { this._modeHandler.setCurrentModeByName(ModeName.Normal); return {}; }
    };
    protected suggestWhitelist = /[\w\.]/;

    constructor(motion : Motion, modeHandler: ModeHandler) {
        super(ModeName.Insert, motion);
        this._modeHandler = modeHandler;
    }

    handleActivation() {
        return;
    }

    async handleKeyEvent(key : string) : Promise<boolean> {
        this.keyHistory.push(key);

        const retval = this.findCommandHandler();
        if (typeof retval[0] === 'function') {
            // we can handle this now
            const handler = retval[0];
            await handler(0);
            this.resetState();
            return true;
        } else {
            // handler === false, not valid (we'll insert the key), reset state
            const translatedKey = this.resolveKeyValue(key);
            await TextEditor.insert(translatedKey);
            if (this.suggestWhitelist.test(translatedKey)) {
                await vscode.commands.executeCommand("editor.action.triggerSuggest");
            }

            this.resetState();
            return true;
        }
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
