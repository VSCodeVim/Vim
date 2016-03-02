"use strict";

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
    protected keyHistory : string[];

    constructor(name: ModeName, motion: Motion) {
        this._name = name;
        this._motion = motion;
        this._isActive = false;
        this.keyHistory = [];
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

    public handleDeactivation() : void {
        this.keyHistory = [];
    }

    protected keyToNewPosition: { [key: string]: (position: Position, count: number, argument: string) => Promise<Position>; } = {
        "h" : async (p, c) => { return p.getLeft(c); },
        "j" : async (p, c) => { return p.getDown(p.character, c); },
        "k" : async (p, c) => { return p.getUp(p.character, c); },
        "l" : async (p, c) => { return p.getRight(c); },
        // "^" : async () => { return vscode.commands.executeCommand("cursorHome"); },
        "gg" : async (p) => {
            return new Position(0, Position.getFirstNonBlankCharAtLine(0), null); },
        "G" : async (p, c) => {
            const lastLine = p.getDocumentEnd().line;
            if (c == 0) {
                return new Position(lastLine, Position.getFirstNonBlankCharAtLine(lastLine), null);
            } else {
                const newLine = Math.min(c - 1, lastLine);
                return new Position(newLine, Position.getFirstNonBlankCharAtLine(newLine), null);
            }
        },
        "$" : async (p) => { return p.getLineEnd(); },
        "0" : async (p) => { return p.getLineBegin(); },
        "w" : async (p, c) => { return p.getWordRight(c); },
        "e" : async (p, c) => { return p.getCurrentWordEnd(c); },
        "b" : async (p, c) => { return p.getWordLeft(c); },
        "W" : async (p, c) => { return p.getBigWordRight(c); },
        "B" : async (p, c) => { return p.getBigWordLeft(c); },
        "}" : async (p, c) => { return p.getCurrentParagraphEnd(c); },
        "{" : async (p, c) => { return p.getCurrentParagraphBeginning(c); },

        // "ctrl+f": async () => { return vscode.commands.executeCommand("cursorPageDown"); },
        // "ctrl+b": async () => { return vscode.commands.executeCommand("cursorPageUp"); },
        // "%" : async () => { return vscode.commands.executeCommand("editor.action.jumpToBracket"); },
        "t{argument}" : async (p, c, argument) => { return p.tilForwards(argument, c); },
        "T{argument}" : async (p, c, argument) => { return p.tilBackwards(argument, c); },
        "f{argument}" : async (p, c, argument) => { return p.findForwards(argument, c); },
        "F{argument}" : async (p, c, argument) => { return p.findBackwards(argument, c); },
    };

    abstract shouldBeActivated(key : string, currentMode : ModeName) : boolean;

    abstract handleActivation(key : string) : Promise<void>;

    abstract handleKeyEvent(key : string) : Promise<void>;
}