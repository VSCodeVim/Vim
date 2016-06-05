"use strict";

import * as vscode from 'vscode';

import { Mode, ModeName } from './mode';
import { Motion, MotionMode } from './../motion/motion';
import { NormalMode } from './modeNormal';
import { InsertMode } from './modeInsert';
import { VisualMode } from './modeVisual';
import {
    BaseMovement, BaseCommand, Actions,
    MoveWordBegin, BaseOperator,
    KeypressState } from './../actions/actions';
import { Configuration } from '../configuration/configuration';
import { Position } from './../motion/position';
import { TextEditor } from '../../src/textEditor';
import { showCmdLine } from '../../src/cmd_line/main';

export enum VimCommandActions {
    DoNothing,
    ShowCommandLine,
    Find,
    Fold,
    Unfold,
    FoldAll,
    UnfoldAll,
    Undo,
    Redo,
    MoveFullPageDown,
    MoveFullPageUp
}

/**
 * The VimState class holds permanent state that carries over from action
 * to action.
 *
 * Actions defined in actions.ts are only allowed to mutate a VimState in order to
 * indicate what they want to do.
 */
export class VimState {
    /**
     * The column the cursor wants to be at, or Number.POSITIVE_INFINITY if it should always
     * be the rightmost column.
     *
     * Example: If you go to the end of a 20 character column, this value
     * will be 20, even if you press j and the next column is only 5 characters.
     * This is because if the third column is 25 characters, the cursor will go
     * back to the 20th column.
     */
    public desiredColumn = 0;

    /**
     * The position the cursor will be when this action finishes.
     */
    public cursorPosition = new Position(0, 0);

    /**
     * The effective starting position of the movement, used along with cursorPosition to determine
     * the range over which to run an Operator. May rarely be different than where the cursor
     * actually starts e.g. if you use the "aw" text motion in the middle of a word.
     */
    public cursorStartPosition = new Position(0, 0);

    /**
     * The mode Vim will be in once this action finishes.
     */
    public currentMode = ModeName.Normal;

    /**
     * This is for oddball commands that don't manipulate text in any way.
     */
    public commandAction = VimCommandActions.DoNothing;

    private _actionState = new ActionState(this);
    public get actionState(): ActionState { return this._actionState; }
    public set actionState(a: ActionState) {
        a.vimState = this;
        this._actionState = a;
    }
}

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
    private _keysPressed: string[] = [];

    /**
     * The operator (e.g. d, y, >>) the user wants to run, if there is one.
     */
    private _operator: BaseOperator = undefined;

    private _command: BaseCommand   = undefined;

    private _movement: BaseMovement = undefined;

    /**
     * The number of times the user wants to repeat this action.
     */
    private _count: number = 1;

    public vimState: VimState;

    public readyToExecute = false;

    public get keysPressed(): string[] { return this._keysPressed; }
    public set keysPressed(val: string[]) {
        this._keysPressed = val;
        this.actionStateChanged();
    }

    public get operator(): BaseOperator { return this._operator; }
    public set operator(op: BaseOperator) {
        this._operator = op;
        this.actionStateChanged();
    }

    public get command(): BaseCommand { return this._command; }
    public set command(command: BaseCommand) {
        this._command = command;
        this.actionStateChanged();
    }

    public get movement(): BaseMovement { return this._movement; }
    public set movement(movement: BaseMovement) {
        this._movement = movement;
        this.actionStateChanged();
    }

    public get count(): number { return this._count; }
    public set count(count: number) {
        this._count = count;
        this.actionStateChanged();
    }

    /**
     * This function is called whenever a property on ActionState is changed.
     * It determines if the state is ready to run - that is, if the user
     * has typed in a fully formed command.
     */
    private actionStateChanged(): void {
        if (this.movement) {
            this.readyToExecute = true;
        }

        // Visual modes do not require a motion. They ARE the motion.
        if (this.operator && (
            this.vimState.currentMode === ModeName.Visual ||
            this.vimState.currentMode === ModeName.VisualLine)) {

            this.readyToExecute = true;
        }

        if (this.command) {
            this.readyToExecute = true;
        }
    }

    public get isInInitialState(): boolean {
        return this._operator    === undefined &&
               this._command     === undefined &&
               this._movement    === undefined &&
               this._count       === 1;
    }

    constructor(vimState: VimState) {
        this.vimState = vimState;
    }
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

    private get currentModeName(): ModeName {
        return this.currentMode.name;
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

        this._vimState.currentMode = modeName;

        // TODO actually making these into functions on modes -
        // like we used to have is a good idea.

        for (let mode of this._modes) {
            if (mode.name === modeName) {
                activeMode = mode;
            }

            mode.isActive = (mode.name === modeName);
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

        let actionState = this._vimState.actionState;

        actionState.keysPressed.push(key);

        let action = Actions.getRelevantAction(actionState.keysPressed.join(""), this._vimState);

        if (action === KeypressState.NoPossibleMatch) {
            // TODO: Slightly janky, for reasons that are hard to describe.

            if (this.currentModeName === ModeName.Insert) {
                await (this.currentMode as any).handleAction(actionState);
                this._vimState.actionState = new ActionState(this._vimState);

                this._vimState.cursorPosition = this._motion.position.getRight();

                return true;
            } else {
                // This is the ultimate failure case. Just insert the key into the document. This is
                // never truly the right thing to do, and should indicate to everyone
                // that something horrible has gone wrong.
                console.log("Nothing could match!");

                this._vimState.actionState = new ActionState(this._vimState);
                return false;
            }
        } else if (action === KeypressState.WaitingOnKeys) {
            return true;
        } else {
            actionState.keysPressed = [];
        }

        if (action) {
            if (action instanceof BaseMovement) {
                actionState.movement = action;
            } else if (action instanceof BaseOperator) {
                actionState.operator = action;
            } else if (action instanceof BaseCommand) {
                actionState.command = action;
            }
        }

        if (actionState.readyToExecute) {
            if (this.currentMode.name !== ModeName.Visual &&
                this.currentMode.name !== ModeName.VisualLine) {
                this._vimState.cursorStartPosition = this._motion.position;
            }

            this._vimState = await this.executeState();

            if (this._vimState.commandAction !== VimCommandActions.DoNothing) {
                switch (this._vimState.commandAction) {
                    case VimCommandActions.ShowCommandLine: await showCmdLine("", this); break;
                    case VimCommandActions.Find: await vscode.commands.executeCommand("actions.find"); break;
                    case VimCommandActions.Fold: await vscode.commands.executeCommand("editor.fold"); break;
                    case VimCommandActions.Unfold: await vscode.commands.executeCommand("editor.unfold"); break;
                    case VimCommandActions.FoldAll: await vscode.commands.executeCommand("editor.foldAll"); break;
                    case VimCommandActions.UnfoldAll: await vscode.commands.executeCommand("editor.unfoldAll"); break;
                    case VimCommandActions.Undo: await vscode.commands.executeCommand("undo"); break;
                    case VimCommandActions.Redo: await vscode.commands.executeCommand("redo"); break;
                    case VimCommandActions.MoveFullPageDown: await vscode.commands.executeCommand("cursorPageUp"); break;
                    case VimCommandActions.MoveFullPageUp: await vscode.commands.executeCommand("cursorPageDown"); break;
                }

                this._vimState.commandAction = VimCommandActions.DoNothing;
            }

            // Update mode

            if (this._vimState.currentMode !== this.currentModeName) {
                this.setCurrentModeByName(this._vimState.currentMode);
            }

            // Update cursor position

            let stop = this._vimState.cursorPosition;

            if (!(this.currentMode instanceof InsertMode)) {
                if (stop.character >= TextEditor.getLineAt(stop).text.length) {
                    stop = new Position(stop.line, TextEditor.getLineAt(stop).text.length);
                }
            }

            if (this.currentMode instanceof NormalMode) {
                if (stop.character >= Position.getLineLength(stop.line)) {
                    stop = stop.getLineEnd().getLeft();
                    this._vimState.cursorPosition = stop;
                }

                this._motion.moveTo(stop.line, stop.character);
            } else if (this.currentMode instanceof VisualMode) {
                if (stop.character >= Position.getLineLength(stop.line)) {
                    stop = stop.getLineEnd().getLeft();
                    this._vimState.cursorPosition = stop;
                }

                await (this.currentMode as VisualMode).handleMotion(this._vimState.cursorStartPosition, stop);
            } else if (this.currentMode instanceof InsertMode) {
                this._motion.moveTo(stop.line, stop.character);
            } else {
                console.log("TODO: My janky thing doesn't handle this case!");

                return;
            }

            // Updated desired column

            const movement = actionState.movement, command = actionState.command;
            if ((movement && !movement.doesntChangeDesiredColumn) || command) {
                if (movement && movement.setsDesiredColumnToEOL) {
                    this._vimState.desiredColumn = Number.POSITIVE_INFINITY;
                } else {
                    this._vimState.desiredColumn = this._motion.position.character;
                }
            }

            this._vimState.actionState = new ActionState(this._vimState);
        }

        return !!action;
    }

    private async executeState(): Promise<VimState> {
        let start = this._vimState.cursorStartPosition;
        let stop = this._vimState.cursorPosition;
        let actionState = this._vimState.actionState;
        let newState: VimState;

        if (actionState.command) {
            return await actionState.command.exec(stop, this._vimState);
        }

        if (actionState.movement) {
            newState = actionState.operator ?
                await actionState.movement.execActionForOperator(stop, this._vimState) :
                await actionState.movement.execAction           (stop, this._vimState);

            actionState = newState.actionState;
            start       = newState.cursorStartPosition;
            stop        = newState.cursorPosition;
        }

        if (actionState.operator) {
            if (this.currentModeName === ModeName.Visual ||
                this.currentModeName === ModeName.VisualLine) {

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
                    stop = new Position(stop.line, stop.character + 1);
                }
            }

            if (actionState.movement) {
                if (Position.EarlierOf(start, stop) === start) {
                    stop = stop.getLeft();
                } else {
                    start = start.getLeft();
                }
            }

            return await actionState.operator.run(this._vimState, start, stop);
        } else {
            return newState;
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