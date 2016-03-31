"use strict";

import * as _      from 'lodash';
import * as vscode from 'vscode';

import {KeyParser} from './keyParser';
import {Motion, MotionMode} from './../motion/motion';
import {Position, PositionOptions} from './../motion/position';

export enum ModeName {
    Normal,
    Insert,
    Visual,
}

export abstract class Mode {
    private _isActive : boolean;
    private _name : ModeName;
    private _motion : Motion;
    private _keyParser : KeyParser;

    constructor(name: ModeName, motion: Motion) {
        this._name = name;
        this._motion = motion;
        this._isActive = false;
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

    get keyParser() : KeyParser {
        return this._keyParser;
    }

    get isActive() : boolean {
        return this._isActive;
    }

    set isActive(val : boolean) {
        this._isActive = val;
    }

    public initializeParser() {
        this._keyParser = new KeyParser(_.keys(this.motions), _.keys(this.textObjects), _.keys(this.commands));
    }

    public handleDeactivation() : void {
        return;
    }

    // vscode based motions only partially work (visual and direct cursor movements)
    protected motions : { [key : string] : (position : Position, options) => Promise<Position>; } = {
        "<count>h" : async (p, o) => { return p.getLeft(o.count); },
        "<count>j" : async (p, o) => { return p.getDown(p.character, o.count); },
        "<count>k" : async (p, o) => { return p.getUp(p.character, o.count); },
        "<count>l" : async (p, o) => { return p.getRight(o.count); },
        "$" : async (p, o) => { return p.getLineEnd(); },
        "0" : async (p, o) => { return p.getLineBegin(); },
        "^" : async (p, o) => { await vscode.commands.executeCommand("cursorHome"); return this._motion.position; },
        "gg" : async (p, o) => {
            return new Position(0, Position.getFirstNonBlankCharAtLine(0), p.positionOptions);
        },
        "<count>G" : async (p, o) => {
             const lastLine = p.getDocumentEnd().line;
             if (o.count === 0) {
                 return new Position(lastLine, Position.getFirstNonBlankCharAtLine(lastLine), p.positionOptions);
             } else {
                 const newLine = Math.min(o.count - 1, lastLine);
                 return new Position(newLine, Position.getFirstNonBlankCharAtLine(newLine), p.positionOptions);
             }
         },
        "<count>w" : async (p, o) => {
            return p.getWordRight(o.count); },
        "<count>W" : async (p, o) => { return p.getBigWordRight(o.count); },
        "<count>e" : async (p, o) => { return p.getCurrentWordEnd(o.count); },
        "<count>E" : async (p, o) => { return p.getCurrentBigWordEnd(o.count); },
        "<count>b" : async (p, o) => { return p.getWordLeft(o.count); },
        "<count>B" : async (p, o) => { return p.getBigWordLeft(o.count); },
        "<count>ge" : async (p, o) => { return p.getLastWordEnd(o.count); },
        "<count>gE" : async (p, o) => { return p.getLastBigWordEnd(o.count); },
        "<count>}" : async (p, o) => { return p.getCurrentParagraphEnd(o.count); },
        "<count>{" : async (p, o) => { return p.getCurrentParagraphEnd(o.count); },
        "<count><c-f>": async (p, o) => { await vscode.commands.executeCommand("cursorPageDown"); return this._motion.position; },
        "<count><c-b>": async (p, o) => { await vscode.commands.executeCommand("cursorPageUp"); return this._motion.position; },
        "%" : async (p, o) => {
             const oldPosition = this._motion.position;
             await vscode.commands.executeCommand("editor.action.jumpToBracket");
             if (oldPosition === this._motion.position) {
                 return this._motion.position;
             } else {
                 return this._motion.position.getLeft();
             }
        },

        "<count>t<argument>" : async (p, o) => { return p.tilForwards(o.argument, o.count); },
        "<count>T<argument>" : async (p, o) => { return p.tilBackwards(o.argument, o.count); },
        "<count>f<argument>" : async (p, o) => { return p.findForwards(o.argument, o.count); },
        "<count>F<argument>" : async (p, o) => { return p.findBackwards(o.argument, o.count); }
    };

    protected textObjects : { [key : string] : (postion : Position) => Promise<Array<Position>>; } = {
    };

    protected commands : { [key : string] : (range : Array<Position>) => Promise<{}>; } = {
    };

    abstract shouldBeActivated(key : string, currentMode : ModeName) : boolean;

    abstract handleActivation(key : string) : Promise<void>;

    public async handleKeyEvent(key : string) : Promise<boolean> {
        const retval = this._keyParser.digestKey(key);
        if (retval && retval.command) {
            await this.handleCommand(retval);
        }
        return retval;
    }

    async handleCommand(command) : Promise<void> {
        const commandString = command.command;
        if (this.motions[commandString]) {
            const position = await this.motions[commandString](this.motion.position, command);
            this.motion.moveTo(position.line, position.character);
        } else if (this.commands[commandString]) {
            let range = [];
            if (command.textObject && this.textObjects[command.textObject]) {
                this.motion.changeMode(MotionMode.Cursor);
                range = await this.textObjects[command.textObject](this.motion.position);
            } else if (command.motion && this.motions[command.motion.command]) {
                if (commandString === "<register><count>c<range>") {
                    // cw/cW actually behaves like ce/CE
                    if (command.motion.command === "<count>w") {
                        command.motion.command = "<count>e";
                    } else if (command.motion.command === "<count>W") {
                        command.motion.command = "<count>E";
                    }
                }

                range[0] = this.motion.position;

                const position = new Position(this.motion.position.line, this.motion.position.character,
                                              PositionOptions.CharacterWiseInclusive);
                range[1] = await this.motions[command.motion.command](position, command.motion);
            }
            await this.commands[commandString](range);

        }
    }

}