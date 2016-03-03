"use strict";

import * as _ from 'lodash';
import {Motion} from './../motion/motion';
import {Position} from './../motion/position';

export enum ModeName {
    Normal,
    Insert,
    Visual,
}

enum ParserState {
    CountPending,
    CommandPending,
    OperatorPending  // expects number (for count), or non-number for motion/text-object/argument
}

export abstract class Mode {
    private _isActive : boolean;
    private _name : ModeName;
    private _motion : Motion;
    protected keyHistory : string[];

    private _state: ParserState;
    private _commandCount;
    private _motionCount;

    constructor(name: ModeName, motion: Motion) {
        this._name = name;
        this._motion = motion;
        this._isActive = false;
        this.keyHistory = [];

        this.resetState();
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

    protected motions: { [key: string]: (position: Position, count: number, argument: string) => Promise<Position>; } = {
        "h" : async (p, c) => { return p.getLeft(c); },
        "j" : async (p, c) => { return p.getDown(p.character, c); },
        "k" : async (p, c) => { return p.getUp(p.character, c); },
        "l" : async (p, c) => { return p.getRight(c); },
        // "^" : async () => { return vscode.commands.executeCommand("cursorHome"); },
        "gg" : async (p) => {
            return new Position(0, Position.getFirstNonBlankCharAtLine(0), null); },
        "G" : async (p, c) => {
            const lastLine = p.getDocumentEnd().line;
            if (c === 0) {
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
        "E" : async (p, c) => { return p.getCurrentBigWordEnd(c); },
        "B" : async (p, c) => { return p.getBigWordLeft(c); },
        "}" : async (p, c) => { return p.getCurrentParagraphEnd(c); },
        "{" : async (p, c) => { return p.getCurrentParagraphBeginning(c); },

        // "ctrl+f": async () => { return vscode.commands.executeCommand("cursorPageDown"); },
        // "ctrl+b": async () => { return vscode.commands.executeCommand("cursorPageUp"); },
        // "%" : async () => { return vscode.commands.executeCommand("editor.action.jumpToBracket"); },
        "t{argument}" : async (p, c, argument) => { return p.tilForwards(argument, c); },
        "T{argument}" : async (p, c, argument) => { return p.tilBackwards(argument, c); },
        "f{argument}" : async (p, c, argument) => { return p.findForwards(argument, c); },
        "F{argument}" : async (p, c, argument) => { return p.findBackwards(argument, c); }
    };

    protected commands : { [key : string] : (ranger, argument : string) => Promise<{}>; } = { };

    private static ValidTextObjectPrefixes = ['i', 'a'];
    private static ValidTextObjectSuffixes = ['w', 's', 'p', '"', '\'', '`', ')', ']', '}', 't', '>'];

    abstract handleActivation();

    protected makeMotionHandler(motion, argument) {
        return async (c) => {
            const position = await motion(this.motion.position, c, argument);
            return this.motion.moveTo(position.line, position.character);
        };
    }

    protected makeCommandHandler(command, ranger, argument) {
        return async (c) => {
            for (let i = 0; i < (c || 1); i++) {
                await command(ranger, argument);
            }
        };
    }

    public async handleKeyEvent(key : string): Promise<boolean> {
        if (this._state === ParserState.CountPending) {
            if (key.match(/^\d$/)) {
                this._commandCount = this._commandCount * 10 + parseInt(key, 10);
                return false;
            }
            this._state = ParserState.CommandPending;
            return await this.handleKeyEvent(key);
        } else if (this._state === ParserState.CommandPending) {
            this.keyHistory.push(key);
            this._state = ParserState.OperatorPending;
            return await this.tryToHandleCommand();
        } else if (this._state === ParserState.OperatorPending) {
            if (key.match(/^\d$/)) {
                this._motionCount = this._motionCount * 10 + parseInt(key, 10);
                return;
            }
            this.keyHistory.push(key);
            return await this.tryToHandleCommand();
        }
    }

    resetState() {
        this._state = ParserState.CountPending;
        this._commandCount = 0;
        this._motionCount = 0;
        this.keyHistory = [];
    }

    protected async tryToHandleCommand() : Promise<boolean> {
        // handler will be a function, true or false
        const retval = this.findCommandHandler();
        if (typeof retval[0] === 'function') {
            // we can handle this now
            const handler = retval[0];
            await handler(this._commandCount);
            this.resetState();
            return true;
        } else if (retval === true) {
            // handler === true, valid command prefix
            // can't do anything for now
        } else {
            // handler === false, not valid, reset state
            this.resetState();
        }
        return false;
    }

    protected findCommandHandler() : any {
        // see if it fits a command now, returns handler if found
        for (let window = this.keyHistory.length; window > 0; window--) {
            const command = _.take(this.keyHistory, window).join('');
            const argument = _.takeRight(this.keyHistory, this.keyHistory.length - window).join('');

            // check if motion
            const motion = this.findInCommandMap(command, argument, this.motions);
            if (motion) {
                return [this.makeMotionHandler(motion, argument), null];
            }

            // check if non-motion command
            const handler = this.findInCommandMap(command, argument, this.commands);
            if (handler) {
                const ranger = this.makeRanger(this._motionCount, argument);
                return [this.makeCommandHandler(handler, ranger, argument), argument];
            }
        }

        // no handler found yet, see if it is a valid prefix
        for (let window = this.keyHistory.length; window > 0; window--) {
            const command = _.take(this.keyHistory, window).join('');
            const argument = _.takeRight(this.keyHistory, this.keyHistory.length - window).join('');

            if (this.isValidPrefixInCommandMap(command, argument, this.motions) ||
                this.isValidPrefixInCommandMap(command, argument, this.commands)) {
                return true;
            }
        }

        return false;
    }

    private findInCommandMap(command, argument, map) : any {
        if (argument.length === 0) {
            const handler = map[command];
            if (handler) {
                return handler;
            }
        } else {
            let keys = command + '{argument}';
            let handler = map[keys];
            if (handler) {
                return handler;
            }

            keys = command + '{rangeable}';
            handler = map[keys];
            if (handler) {
                if (this.isValidMotion(argument)) {
                    return handler;
                } else if (this.isValidTextObject(argument)) {
                    return handler;
                }
            }
            return null;
        }
    }

    private isValidPrefixInCommandMap(command, argument, map) : any {
        if (argument.length === 0) {
           return !!_.find(_.keys(map), key => _.startsWith(key, command) );
        } else {
            // no need to test command+{argument} because argument is only single key
            // see if it is a valid motion/text object prefix
            const keys = command + '{rangeable}';
            return map[keys] && (this.isValidMotionPrefix(argument) || this.isValidTextObjectPrefix(argument));
        }
    }

    private isValidMotion(input : string) : boolean {
        for (let window = input.length; window > 0; window--) {
            const command = input.slice(0, window);
            const argument = input.slice(window);

            const handler = this.findInCommandMap(command, argument, this.motions);
            if (handler) {
                return true;
            }
        }
        return false;
    }

    private isValidTextObject(argument : string) : boolean {
        const prefix = argument.slice(0, 1);
        const suffix = argument.slice(1);
        return Mode.ValidTextObjectPrefixes.indexOf(prefix) > -1 &&
               Mode.ValidTextObjectSuffixes.indexOf(suffix) > -1;
    }

    private isValidMotionPrefix(input: string) : boolean {
        return this.isValidPrefixInCommandMap(input, '', this.motions);
    }

    private isValidTextObjectPrefix(argument : string) : boolean {
        return Mode.ValidTextObjectPrefixes.indexOf(argument) > -1;
    }

    // input can be motion or text object, returns a range maker
    private makeRanger(count, input) : any {
        if (!input) {
            return () => [this.motion.position, this.motion.position];
        }

        if (this.isValidTextObject(input)) {
            // TODO make a text object ranger
            return () => [this.motion.position, this.motion.position];
        }

        // make motion ranger
        let command, argument, handler;
        for (let window = input.length; window > 0; window--) {
            command = input.slice(0, window);
            argument = input.slice(window);

            handler = this.findInCommandMap(command, argument, this.motions);
            if (handler) {
                break;
            }
        }

        if (handler) {
            return async () => {
                const position = await handler(this.motion.position, count, argument);
                return [this.motion.position, position];
            };
        }

        return () => [this.motion.position, this.motion.position];
    }
}