"use strict";

import * as _ from 'lodash';
import * as vscode from 'vscode';

import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Motion} from './../motion/motion';
import {ModeHandler} from './modeHandler';
import {DeleteOperator} from './../operator/delete';

enum ParserState {
    CountPending,
    CommandPending,
    OperatorPending  // expects number (for count), or non-number for motion/text-object/argument
}

export class NormalMode extends Mode {
    protected keyHandler : { [key : string] : (count : Number) => Promise<{}>; } = {
        ":" : async () => { return showCmdLine(""); },
        "u" : async (c) => { return vscode.commands.executeCommand("undo"); },
        "ctrl+r" : async (c) => { return vscode.commands.executeCommand("redo"); },
        "h" : async (c) => { return this.motion.left().move(); },
        "j" : async (c) => { return this.motion.down().move(); },
        "k" : async (c) => { return this.motion.up().move(); },
        "l" : async (c) => { return this.motion.right().move(); },
        "$" : async (c) => { return this.motion.lineEnd().move(); },
        "0" : async (c) => { return this.motion.lineBegin().move(); },
        "^" : async () => { return vscode.commands.executeCommand("cursorHome"); },
        "gg" : async (c) => { return this.motion.firstLineNonBlankChar().move(); },
        "G" : async (c) => { return this.motion.lastLineNonBlankChar().move(); },
        "w" : async (c) => { return this.motion.wordRight().move(); },
        "W" : async (c) => { return this.motion.bigWordRight().move(); },
        "e" : async (c) => { return this.motion.goToEndOfCurrentWord().move(); },
        "b" : async (c) => { return this.motion.wordLeft().move(); },
        "B" : async (c) => { return this.motion.bigWordLeft().move(); },
        "}" : async (c) => { return this.motion.goToEndOfCurrentParagraph().move(); },
        "{" : async (c) => { return this.motion.goToBeginningOfCurrentParagraph().move(); },
        "ctrl+f": async (c) => { return vscode.commands.executeCommand("cursorPageDown"); },
        "ctrl+b": async (c) => { return vscode.commands.executeCommand("cursorPageUp"); },
        "%" : async () => { return vscode.commands.executeCommand("editor.action.jumpToBracket"); },
        ">>" : async () => { return vscode.commands.executeCommand("editor.action.indentLines"); },
        "<<" : async () => { return vscode.commands.executeCommand("editor.action.outdentLines"); },
        "dd" : async () => { return vscode.commands.executeCommand("editor.action.deleteLines"); },
        "d{rangeable}" : async () => { return vscode.commands.executeCommand("deleteWordRight"); },
        "t{argument}" : async () => { return showCmdLine(""); },
        "T{argument}" : async () => { return showCmdLine(""); },
        "f{argument}" : async () => { return showCmdLine(""); },
        "F{argument}" : async () => { return showCmdLine(""); },
        "x" : async (c) => { await new DeleteOperator(this._modeHandler).run(this.motion.position, this.motion.position.getRight()); return {}; },
        "X" : async (c) => { return vscode.commands.executeCommand("deleteLeft"); },
        "esc": async () => { return vscode.commands.executeCommand("workbench.action.closeMessages"); }
    };
    // TODO: motion => ctX, cfX

    private static ValidMotions = ['h', 'j', 'k', 'l', '$', '0', '^', 'gg', 'G', 'w', 'W', 'e', 'E', 'b', 'B', '}', '{', '%', 't{rangeable}', 'f{rangeable}'];
    private static ValidTextObjectPrefixes = ['i', 'a'];
    private static ValidTextObjectSuffixes = ['w', 's', 'p', '"', '\'', '`', ')', ']', '}', 't', '>'];

    private _modeHandler: ModeHandler;

    private _state: ParserState;
    private _commandCount;
    private _motionCount;

    constructor(motion : Motion, modeHandler: ModeHandler) {
        super(ModeName.Normal, motion);

        this._modeHandler = modeHandler;
        this.resetState();
    }

    shouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc' || key === 'ctrl+[' || key === "ctrl+c");
    }

    async handleActivation(key : string): Promise<void> {
        this.motion.left().move();
        this.resetState();
    }

    async oldhandleKeyEvent(key : string): Promise<void>  {
        this.keyHistory.push(key);

        let keyHandled = false;
        let keysPressed: string;

        for (let window = this.keyHistory.length; window > 0; window--) {
            keysPressed = _.takeRight(this.keyHistory, window).join('');
            if (this.keyHandler[keysPressed] !== undefined) {
                keyHandled = true;
                break;
            }
        }

        if (keyHandled) {
            this.keyHistory = [];
            await this.keyHandler[keysPressed](this._commandCount);
        }
    }

    async handleKeyEvent(key : string): Promise<void> {
        if (this._state === ParserState.CountPending) {
            if (key.match(/^\d$/)) {
                this._commandCount = this._commandCount * 10 + key;
                return;
            }
            this._state = ParserState.CommandPending;
            return this.handleKeyEvent(key);
        } else if (this._state === ParserState.CommandPending) {
            this.keyHistory.push(key);
            return this.tryToHandleCommand();
        } else if (this._state === ParserState.OperatorPending) {
            if (key.match(/^\d$/)) {
                this._motionCount = this._motionCount * 10 + key;
                return;
            }
            this.keyHistory.push(key);
            return this.tryToHandleCommand();
        }
    }

    private resetState() {
        this._state = ParserState.CountPending;
        this._commandCount = 0;
        this._motionCount = 0;
        this.keyHistory = [];
    }

    private async tryToHandleCommand() : Promise<void> {
        // handler will be a function, true or false
        let handler = this.findCommandHandler();
        if (typeof handler === 'function') {
            // we can handle this now
            // TODO convert motion into range
            // TODO convert text object into range
            await handler(this.motion);
            this.resetState();
        } else if (handler === true) {
            // handler === true, valid command prefix
            // can't do anything for now
        } else {
            // handler === false, not valid, reset state
            this.resetState();
        }
    }

    private findCommandHandler() : any {
        // try to find an exact match handler first
        let keys = this.keyHistory.join('');
        let handler = this.keyHandler[keys];
        if (handler) {
            return handler;
        } else if (this.keyHistory.length == 2) {
            // see if it is a valid argument type command (t/f/r)
            // search for command{argument}
            keys = this.keyHistory[0] + '{argument}';
            handler = this.keyHandler[keys];
            if (handler) {
                return handler;
            }

            keys = this.keyHistory[0] + '{rangeable}';
            let currKey = this.keyHistory[1];
            // else if valid motion search for {rangeable}
            if (NormalMode.ValidMotions.indexOf(currKey) > -1) {
                handler = this.keyHandler[keys];
                if (handler) {
                    return handler;
                }
            }

            // else if valid motion prefix (like gg), search for {rangeable}
            // else if valid text-object prefix search for {rangeable}
            if (this.isValidMotionPrefix(currKey) ||
                NormalMode.ValidTextObjectPrefixes.indexOf(currKey) > -1) {
                if (this.keyHandler[keys]) {
                    return true;
                }
            }
        } else if (this.keyHistory.length == 3) {
            // see if it is a valid text object, search for {rangeable}
            let prefix = this.keyHistory[1];
            let suffix = this.keyHistory[2];
            if (NormalMode.ValidTextObjectPrefixes.indexOf(prefix) > -1 &&
                NormalMode.ValidTextObjectSuffixes.indexOf(suffix) > -1) {
                keys = this.keyHistory[0] + '{rangeable}';

                handler = this.keyHandler[keys];
                if (handler) {
                    return handler;
                }
            }
        }
        return false;
    }

    private isValidMotionPrefix(input : string) : boolean {
        return _.find(NormalMode.ValidMotions, (key) => {
           return key.indexOf(input) === 0;
        })
    }

}
