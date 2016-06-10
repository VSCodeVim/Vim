"use strict";

import * as vscode from 'vscode';

import { Mode, ModeName } from './mode';
import { NormalMode } from './modeNormal';
import { InsertMode } from './modeInsert';
import { VisualMode } from './modeVisual';
import { VisualLineMode } from './modeVisualLine';
import {
    BaseMovement, BaseCommand, Actions,
    BaseOperator, PutCommand,
    KeypressState } from './../actions/actions';
import { Configuration } from '../configuration/configuration';
import { Position } from './../motion/position';
import { RegisterMode } from './../register/register';
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
    MoveFullPageUp,
    Dot,
    ScrollCursorToCenter
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
     * The keystroke sequence that made up our last complete action (that can be
     * repeated with '.').
     */
    public previousFullAction = [];

    /**
     * The current full action we are building up.
     */
    public currentFullAction = [];

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

    public currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;

    public registerName = '"';

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

    public isFullDotAction(): boolean {
        const isInNormalMode = this.currentMode === ModeName.Normal;
        const justFinishedOperation = this.actionState.operator !== undefined;
        const justFinishedPut = this.actionState.command instanceof PutCommand;

        const justReturnedToNormalMode =
            this.actionState.actionKeys[0] === "<esc>" ||
            this.actionState.actionKeys[0] === "<ctrl-[>";

        return isInNormalMode && (justFinishedOperation || justReturnedToNormalMode || justFinishedPut);
    }

    public shouldResetCurrentDotKeys(): boolean {
        const isBareMovement =
            (this.currentMode === ModeName.Normal && this.actionState.isOnlyAMovement());

        return isBareMovement || this.isFullDotAction();
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
     * Keeps track of keys pressed for the next action. Comes in handy when parsing
     * multiple length movements, e.g. gg.
     */
    private _actionKeys: string[] = [];

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

    public get actionKeys(): string[] { return this._actionKeys; }
    public set actionKeys(val: string[]) {
        this._actionKeys = val;
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

    public isOnlyAMovement(): boolean {
        return this._operator    === undefined &&
               this._command     === undefined;
    }

    constructor(vimState: VimState) {
        this.vimState = vimState;
    }
}

interface IViewState {
    selectionStart: Position;
    selectionStop : Position;
    currentMode   : ModeName;
}

export class ModeHandler implements vscode.Disposable {
    private _modes: Mode[];
    private _statusBarItem: vscode.StatusBarItem;
    private _configuration: Configuration;
    private _vimState: VimState;

    private get currentModeName(): ModeName {
        return this.currentMode.name;
    }

    constructor() {
        this._configuration = Configuration.fromUserFile();

        this._vimState = new VimState();
        this._modes = [
            new NormalMode(this),
            new InsertMode(),
            new VisualMode(this),
            new VisualLineMode(),
        ];

        this._vimState.currentMode = ModeName.Normal;

        this.setCurrentModeByName(this._vimState);

        // handle scenarios where mouse used to change current position
        vscode.window.onDidChangeTextEditorSelection(e => {
            let selection = e.selections[0];

            // Programmatically triggering an edit will unfortunately ALSO trigger this
            // function. We make sure that the vim state is actually out of state from the
            // actual position of the cursor before correcting it.
            if (selection.start.isEqual(this._vimState.cursorPosition) ||
                selection.end.isEqual(this._vimState.cursorStartPosition) ||
                selection.start.isEqual(this._vimState.cursorPosition) ||
                selection.end.isEqual(this._vimState.cursorStartPosition)) {

                return;
            }

            if (selection) {
                let line = selection.active.line;
                let char = selection.active.character;

                var newPosition = new Position(line, char);

                if (char > newPosition.getLineEnd().character) {
                   newPosition = new Position(newPosition.line, newPosition.getLineEnd().character);
                }

                this._vimState.cursorPosition = newPosition;
                this._vimState.desiredColumn = newPosition.character;
            }
        });
    }

    /**
     * The active mode.
     */
    get currentMode(): Mode {
        return this._modes.find(mode => mode.isActive);
    }

    setCurrentModeByName(vimState: VimState) {
        let activeMode: Mode;

        this._vimState.currentMode = vimState.currentMode;

        // TODO actually making these into functions on modes -
        // like we used to have is a good idea.

        for (let mode of this._modes) {
            if (mode.name === vimState.currentMode) {
                activeMode = mode;
            }

            mode.isActive = (mode.name === vimState.currentMode);
        }

        // Draw block cursor.
        // The reason we make a copy of options is because it's a
        // getter/setter and it won't trigger it's event if we modify
        // the object in place
        const options = vscode.window.activeTextEditor.options;
        (options as any).cursorStyle = vimState.currentMode === ModeName.Insert ?
            (vscode as any).TextEditorCursorStyle.Line :
            (vscode as any).TextEditorCursorStyle.Block;
        vscode.window.activeTextEditor.options = options;

        const statusBarText = (this.currentMode.name === ModeName.Normal) ? '' : ModeName[vimState.currentMode];
        this.setupStatusBarItem(statusBarText ? `-- ${statusBarText.toUpperCase()} --` : '');
    }

    /**
     * Along with executeState(), one of the core processing functions of VSCVim.
     */
    async handleKeyEvent(key: string): Promise<Boolean> {
        this._vimState = await this.handleKeyEventHelper(key, this._vimState);

        return true;
    }

    async handleKeyEventHelper(key: string, vimState: VimState): Promise<VimState> {
        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713

        key = this._configuration.keyboardLayout.translate(key);

        let actionState = vimState.actionState;

        actionState.actionKeys.push(key);
        vimState.currentFullAction.push(key);

        let action = Actions.getRelevantAction(actionState.actionKeys, vimState);

        if (action === KeypressState.NoPossibleMatch) {
            console.log("Nothing matched!");

            vimState.actionState = new ActionState(vimState);
            return vimState;
        } else if (action === KeypressState.WaitingOnKeys) {
            return vimState;
        }

        if (action instanceof BaseMovement) {
            actionState.movement = action;
        } else if (action instanceof BaseOperator) {
            actionState.operator = action;
        } else if (action instanceof BaseCommand) {
            actionState.command = action;
        }

        if (actionState.readyToExecute) {
            if (this.currentMode.name !== ModeName.Visual &&
                this.currentMode.name !== ModeName.VisualLine) {
                vimState.cursorStartPosition = vimState.cursorPosition;
            }

            vimState = await this.executeState(vimState);

            if (vimState.commandAction !== VimCommandActions.DoNothing) {
                vimState = await this.handleCommand(vimState);
            }

            // Update mode

            if (vimState.currentMode !== this.currentModeName) {
                this.setCurrentModeByName(vimState);
            }

            await this.updateView(vimState, {
                selectionStart: vimState.cursorStartPosition,
                selectionStop : vimState.cursorPosition,
                currentMode   : vimState.currentMode,
            });

            // Updated desired column

            const movement = actionState.movement, command = actionState.command;
            if ((movement && !movement.doesntChangeDesiredColumn) || command) {
                if (movement && movement.setsDesiredColumnToEOL) {
                    vimState.desiredColumn = Number.POSITIVE_INFINITY;
                } else {
                    vimState.desiredColumn = vimState.cursorPosition.character;
                }
            }

            // Update dot keys

            if (vimState.isFullDotAction()) {
                vimState.previousFullAction = vimState.currentFullAction;
            }

            if (vimState.shouldResetCurrentDotKeys()) {
                vimState.currentFullAction = [];
            }

            // Scroll to position of cursor

            vscode.window.activeTextEditor.revealRange(new vscode.Range(vimState.cursorPosition, vimState.cursorPosition));

            // Reset state

            vimState.actionState = new ActionState(vimState);
            vimState.currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;
        }

        actionState.actionKeys = [];

        return vimState;
    }

    private async executeState(vimState: VimState): Promise<VimState> {
        let start = vimState.cursorStartPosition;
        let stop = vimState.cursorPosition;
        let actionState = vimState.actionState;

        if (actionState.command) {
            return await actionState.command.exec(stop, vimState);
        }

        if (actionState.movement) {
            vimState = actionState.operator ?
                await actionState.movement.execActionForOperator(stop, vimState) :
                await actionState.movement.execAction           (stop, vimState);

            actionState = vimState.actionState;
            start       = vimState.cursorStartPosition;
            stop        = vimState.cursorPosition;
        }

        if (actionState.operator) {
            if (actionState.movement) {
                if (Position.EarlierOf(start, stop) === start) {
                    stop = stop.getLeft();
                } else {
                    start = start.getLeft();
                }
            }

            if (this.currentModeName === ModeName.VisualLine) {
                start = Position.EarlierOf(start, stop).getLineBegin();
                stop  = Position.LaterOf(start, stop).getLineEnd();
            }

            return await actionState.operator.run(vimState, start, stop);
        } else {
            return vimState;
        }
    }

    private async handleCommand(vimState: VimState): Promise<VimState> {
        const command = vimState.commandAction;

        vimState.commandAction = VimCommandActions.DoNothing;

        switch (command) {
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
            case VimCommandActions.ScrollCursorToCenter:
                vscode.window.activeTextEditor.revealRange(new vscode.Range(vimState.cursorPosition, vimState.cursorPosition),
                                                           vscode.TextEditorRevealType.InCenter);
            break;
            case VimCommandActions.Dot:
                const oldDotKeysCopy = vimState.previousFullAction.slice(0);

                vimState.actionState = new ActionState(vimState);
                vimState.currentFullAction = [];

                for (let key of oldDotKeysCopy) {
                    vimState = await this.handleKeyEventHelper(key, vimState);
                }
            break;
        }

        return vimState;
    }

    private async updateView(vimState: VimState, viewState: IViewState): Promise<void> {
        // Update cursor position

        let start = viewState.selectionStart;
        let stop  = viewState.selectionStop;

        // Keep the cursor within bounds

        if (viewState.currentMode === ModeName.Normal) {
            if (stop.character >= Position.getLineLength(stop.line)) {
                stop = stop.getLineEnd().getLeft();
                vimState.cursorPosition = stop;
            }
        } else if (viewState.currentMode === ModeName.Visual ||
                    viewState.currentMode === ModeName.VisualLine) {

            // Vim does this weird thing where it allows you to select and delete
            // the newline character, which it places 1 past the last character
            // in the line. This is why we use > instead of >=.

            if (stop.character > Position.getLineLength(stop.line)) {
                stop = stop.getLineEnd();
                vimState.cursorPosition = stop;
            }

            /**
             * Always select the letter that we started visual mode on, no matter
             * if we are in front or behind it. Imagine that we started visual mode
             * with some text like this:
             *
             *   abc|def
             *
             * (The | represents the cursor.) If we now press w, we'll select def,
             * but if we hit b we expect to select abcd, so we need to getRight() on the
             * start of the selection when it precedes where we started visual mode.
             */

            if (start.compareTo(stop) > 0) {
                start = start.getRight();
            }
        }

        // Draw selection (or cursor)

        if (viewState.currentMode === ModeName.Visual) {
            vscode.window.activeTextEditor.selection = new vscode.Selection(start, stop);
        } else if (viewState.currentMode === ModeName.VisualLine) {
            vscode.window.activeTextEditor.selection = new vscode.Selection(
                Position.EarlierOf(start, stop).getLineBegin(),
                Position.LaterOf(start, stop).getLineEnd());
        } else {
            vscode.window.activeTextEditor.selection = new vscode.Selection(stop, stop);
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
    }
}