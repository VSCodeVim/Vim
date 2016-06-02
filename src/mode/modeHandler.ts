"use strict";

import * as _ from 'lodash';
import * as vscode from 'vscode';

import { Mode, ModeName } from './mode';
import { Motion, MotionMode } from './../motion/motion';
import { NormalMode } from './modeNormal';
import { InsertMode } from './modeInsert';
import { VisualMode } from './modeVisual';
import {
    BaseMovement, BaseAction, BaseCommand, Actions,
    MoveWordBegin, BaseOperator, DeleteOperator, ChangeOperator,
    PutOperator, YankOperator, KeypressState } from './../actions/actions';
import { Configuration } from '../configuration/configuration';
import { Position } from './../motion/position';
import { TextEditor } from '../../src/textEditor';

// TODO: This is REALLY dumb...
// figure out some way to force include this stuff...
new BaseAction();
new BaseOperator();

new DeleteOperator();
new ChangeOperator();
new PutOperator();
new YankOperator();
// TODO - or maybe just get rid of decorators
// they're nice but introduce a weird class of bugs ;_;

/**
 * The ActionState class represents state relevant to the current
 * action that the user is doing. Example: Imagine that the user types:
 *
 * 5"qdw
 *
 * Then the relevent state would be
 *   * count of 5
 *   * copy into q register
 *   * delete operator
 *   * word movement
 */
export class ActionState {
    /**
     * Keeps track of the most recent keys pressed. Comes in handy when parsing
     * multiple length movements, e.g. gg.
     */
    public keysPressed: string[] = [];

    /**
     * The operator (e.g. d, y, >>) the user wants to run, if there is one.
     */
    public operator: BaseOperator = undefined;

    public command: BaseCommand = undefined;

    public movement: BaseMovement = undefined;

    /**
     * The number of times the user wants to repeat this action.
     */
    public count: number = 1;
}

/**
 * The VimState class holds permanent state that carries over from action
 * to action.
 *
 * TODO: Perhaps this should have ActionState inside it, and be returned from all commands.
 */
export class VimState {
    /**
     * The column the cursor wants to be at.
     *
     * Example: If you go to the end of a 20 character column, this value
     * will be 20, even if you press j and the next column is only 5 characters.
     * This is because if the third column is 25 characters, the cursor will go
     * back to the 20th column.
     */
    public desiredColumn = 0;

    public currentMode = ModeName.Normal;

    public actionState = new ActionState();
}

export class ModeHandler implements vscode.Disposable {
    private __motion: Motion;
    private _modes: Mode[];
    private _statusBarItem: vscode.StatusBarItem;
    private _configuration: Configuration;
    private _vimState: VimState;

    private get _motion(): Motion {
        return this.__motion;
    }
    private set _motion(m: Motion) {
        this.__motion = m;
    }

    constructor() {
        this._configuration = Configuration.fromUserFile();

        this._motion = new Motion(null);
        this._vimState = new VimState();
        this._modes = [
            new NormalMode(this._motion, this),
            new InsertMode(this._motion),
            new VisualMode(this._motion, this),
        ];

        this.setCurrentModeByName(ModeName.Normal);
    }

    /**
     * The active mode.
     */
    get currentMode(): Mode {
        return this._modes.find(mode => mode.isActive);
    }

    setCurrentModeByName(modeName: ModeName) {
        let activeMode: Mode;

        if (this.currentMode) {
            this.currentMode.handleDeactivation();
        }

        // TODO actually making these into functions on modes -
        // like we used to have is a good idea.

        for (let mode of this._modes) {
            if (mode.name === modeName) {
                activeMode = mode;
            }

            mode.isActive = (mode.name === modeName)
        }

        switch (modeName) {
            case ModeName.Insert:
                this._motion = this._motion.changeMode(MotionMode.Cursor);
                break;

            case ModeName.Normal:
                this._motion = this._motion.changeMode(MotionMode.Caret);
                break;

            case ModeName.Visual:
                (activeMode as VisualMode).start();
                break;
        }

        const statusBarText = (this.currentMode.name === ModeName.Normal) ? '' : ModeName[modeName];
        this.setupStatusBarItem(statusBarText ? `-- ${statusBarText.toUpperCase()} --` : '');
    }

    /**
     * Along with executeState(), one of the core processing functions of VSCVim.
     */
    async handleKeyEvent(key: string): Promise<Boolean> {
        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713

        key = this._configuration.keyboardLayout.translate(key);

        let currentModeName = this.currentMode.name;
        let actionState = this._vimState.actionState;

        actionState.keysPressed.push(key);

        let action = Actions.getRelevantAction(actionState.keysPressed.join(""), currentModeName);

        let readyToExecute = false;

        if (action === KeypressState.NoPossibleMatch) {
            // TODO: Slightly janky, for reasons that are hard to describe.

            if (currentModeName === ModeName.Insert) {
                await (this.currentMode as any).handleAction(actionState);
                this._vimState.actionState = new ActionState();

                return true;
            } else {
                // This is the ultimate failure case. Just insert the key into the document. This is
                // never truly the right thing to do, and should indicate to everyone
                // that something horrible has gone wrong.
                console.log("Nothing could match!");

                this._vimState.actionState = new ActionState();
                return false;
            }
        } else if (action === KeypressState.WaitingOnKeys) {
            return true;
        } else {
            actionState.keysPressed = [];
        }

        // update our state appropriately. If the action is complete, flag that
        // we are ready to transform the document.
        // TODO - shouldn't readyToExecute be tracked on the action itself? (yes)
        if (action) {
            if (action instanceof BaseMovement) {
                actionState.movement = action;

                readyToExecute = true;
            }

            if (action instanceof BaseOperator) {
                // Visual modes do not require a motion action.

                if (currentModeName === ModeName.Visual ||
                    currentModeName === ModeName.VisualLine) {
                    readyToExecute = true;
                }

                actionState.operator = action;
            }

            if (action instanceof BaseCommand) {
                actionState.command = action;

                readyToExecute = true;
            }
        }

        if (readyToExecute) {
            await this.executeState();

            if ((actionState.movement && !actionState.movement.doesntChangeDesiredColumn) ||
                actionState.command) {
                this._vimState.desiredColumn = this._motion.position.character;
            }

            this._vimState.actionState = new ActionState();
        }

        return !!action;
    }

    private async executeState(): Promise<void> {
        let start: Position, stop: Position;
        let currentModeName = this.currentMode.name;
        let actionState = this._vimState.actionState;

        if (actionState.command) {
            let newPosition = await actionState.command.exec(this, this._motion.position, actionState, this._vimState);

            this._motion.moveTo(newPosition.line, newPosition.character);

            return;
        }

        start = this._motion.position;
        if (actionState.movement) {
            stop = actionState.operator ?
                await actionState.movement.execActionForOperator(this, start, actionState, this._vimState) :
                await actionState.movement.execAction           (this, start, actionState, this._vimState);
        }

        if (actionState.operator) {
            if (currentModeName === ModeName.Visual ||
                currentModeName === ModeName.VisualLine) {

                start = (this.currentMode as VisualMode).selectionStart;
                stop  = (this.currentMode as VisualMode).selectionStop;
            }

            this._motion.changeMode(MotionMode.Cursor);

            /*
                From the Vim documentation:

                Another special case: When using the "w" motion in combination with an
                operator and the last word moved over is at the end of a line, the end of
                that word becomes the end of the operated text, not the first word in the
                next line.

                TODO - move this into actions.ts, add test.
            */

            if (actionState.movement instanceof MoveWordBegin) {
                if (stop.isLineBeginning()) {
                    stop = stop.getLeftThroughLineBreaks();
                }

                if (stop.isLineEnd()) {
                    // Yes... we actually push the position OFF THE EDGE OF THE DOCUMENT.

                    // Why, Vim? WHY?
                    stop = new Position(stop.line, stop.character + 1, stop.positionOptions);
                }
            }

            if (actionState.movement) {
                if (Position.EarlierOf(start, stop) === start) {
                    stop = stop.getLeft();
                } else {
                    start = start.getLeft();
                }
            }

            const pos = await actionState.operator.run(this, this._vimState, start, stop);
            this._motion.moveTo(pos.line, pos.character);
        } else {
            if (this.currentMode instanceof NormalMode) {
                this._motion.moveTo(stop.line, stop.character);
            } else if (this.currentMode instanceof VisualMode) {
                await (this.currentMode as VisualMode).handleMotion(stop);
            } else {
                console.log("TODO: My janky thing doesn't handle this case!");

                return;
            }
        }
    }

    async handleMultipleKeyEvents(keys: string[]): Promise<void> {
        for (const key of keys) {
            await this.handleKeyEvent(key);
        }
    }

    setupStatusBarItem(text : string) : void {
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        this._statusBarItem.text = text || '';
        this._statusBarItem.show();
    }

    dispose() {
        this._statusBarItem.hide();
        this._statusBarItem.dispose();
        this._motion.dispose();
    }
}