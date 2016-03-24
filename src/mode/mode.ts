"use strict";

import {Command} from './commands';
import {Motion} from './../motion/motion';
import {Position} from './../motion/position';

export enum ModeName {
    Normal,
    Insert,
    Visual,
}

export abstract class Mode {
    private _isActive : boolean;
    private _name : ModeName;
    private _motion : Motion;
    protected _keyHistory : string[];
    protected _keymap : {[key: string]: Command};

    constructor(name: ModeName, motion: Motion, keymap: {[key: string]: Command}) {
        this._name = name;
        this._motion = motion;
        this._isActive = false;
        this._keyHistory = [];
        this._keymap = keymap;
    }

    get name(): ModeName {
        return this._name;
    }

    get motion() : Motion {
        return this._motion;
    }

    set motion(val : Motion) {
        this._motion = val;
    }

    get isActive() : boolean {
        return this._isActive;
    }

    set isActive(val : boolean) {
        this._isActive = val;
    }

    get keyHistory() : string[] {
        return this._keyHistory;
    }

    public handleDeactivation() : void {
        this._keyHistory = [];
    }

    protected keyToNewPosition: { [key: string]: (motion: Position) => Promise<Position>; } = {
        "h" : async (c) => { return c.getLeft(); },
        "j" : async (c) => { return c.getDown(0); },
        "k" : async (c) => { return c.getUp(0); },
        "l" : async (c) => { return c.getRight(); },
        // "^" : async () => { return vscode.commands.executeCommand("cursorHome"); },
        "gg" : async (c) => {
            return new Position(0, Position.getFirstNonBlankCharAtLine(0), null); },
        "G" : async (c) => {
            const lastLine = c.getDocumentEnd().line;

            return new Position(lastLine, Position.getFirstNonBlankCharAtLine(lastLine), null);
        },
        "$" : async (c) => { return c.getLineEnd(); },
        "0" : async (c) => { return c.getLineBegin(); },
        "w" : async (c) => { return c.getWordRight(); },
        "e" : async (c) => { return c.getCurrentWordEnd(); },
        "b" : async (c) => { return c.getWordLeft(); },
        "}" : async (c) => { return c.getCurrentParagraphEnd(); },
        "{" : async (c) => { return c.getCurrentParagraphBeginning(); }
    };

    abstract shouldBeActivated(key : string, currentMode : ModeName) : boolean;

    abstract handleActivation(key : string) : Promise<void>;

    abstract handleKeyEvent(key : string) : Promise<Boolean>;
}