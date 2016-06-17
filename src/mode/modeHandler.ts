"use strict";

import * as vscode from 'vscode';
import * as _ from 'lodash';

import { Mode, ModeName, VSCodeVimCursorType } from './mode';
import { NormalMode } from './modeNormal';
import { InsertMode } from './modeInsert';
import { VisualMode } from './modeVisual';
import { SearchInProgressMode } from './modeSearchInProgress';
import { VisualLineMode } from './modeVisualLine';
import {
    BaseMovement, BaseCommand, Actions, BaseAction,
    BaseOperator, isIMovement,
    CommandSearchForwards, CommandSearchBackwards,
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
    public previousFullAction: RecordedState = undefined;

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

    public searchString = "";

    /**
     * The position of the next search, or undefined if there is no match.
     */
    public nextSearchMatchPosition: Position = undefined;

    public searchCursorStartPosition: Position = undefined;

    /**
     * 1  === forward
     * -1 === backward
     */
    public searchDirection: number = 1;

    /**
     * The mode Vim will be in once this action finishes.
     */
    public currentMode = ModeName.Normal;

    public currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;

    public effectiveRegisterMode(): RegisterMode {
        if (this.currentRegisterMode === RegisterMode.FigureItOutFromCurrentMode) {
            if (this.currentMode === ModeName.VisualLine) {
                return RegisterMode.LineWise;
            } else {
                return RegisterMode.CharacterWise;
            }
        } else {
            return this.currentRegisterMode;
        }
    }

    public registerName = '"';

    /**
     * This is for oddball commands that don't manipulate text in any way.
     */
    public commandAction = VimCommandActions.DoNothing;

    public recordedState = new RecordedState();

    /**
     * Programmatically triggering an edit will unfortunately ALSO trigger our mouse update
     * function. We use this variable to determine if the update function was triggered
     * by us or by a mouse action.
     */
    public justUpdatedState = false;
}

/**
 * The RecordedState class holds the current action that the user is
 * doing. Example: Imagine that the user types:
 *
 * 5"qdw
 *
 * Then the relevent state would be
 *   * count of 5
 *   * copy into q register
 *   * delete operator
 *   * word movement
 *
 *
 * Or imagine the user types:
 *
 * vw$}}d
 *
 * Then the state would be
 *   * Visual mode action
 *   * (a list of all the motions you ran)
 *   * delete operator
 */
export class RecordedState {
    /**
     * Keeps track of keys pressed for the next action. Comes in handy when parsing
     * multiple length movements, e.g. gg.
     */
    public actionKeys: string[] = [];

    public actionsRun: BaseAction[] = [];

    public hasRunOperator = false;

    /**
     * The operator (e.g. d, y, >) the user wants to run, if there is one.
     */
    public get operator(): BaseOperator {
        const list = _.filter(this.actionsRun, a => a instanceof BaseOperator);

        if (list.length > 1) { throw "Too many operators!"; }

        return list[0] as any;
    }

    public get command(): BaseCommand {
        const list = _.filter(this.actionsRun, a => a instanceof BaseCommand);

        // TODO - disregard <esc>, then assert this is of length 1.

        return list[0] as any;
    }

    public get hasRunAMovement(): boolean {
        return _.filter(this.actionsRun, a =>
                  a instanceof BaseMovement ||
                  a instanceof CommandSearchForwards ||
                  a instanceof CommandSearchBackwards).length > 0;
    }

    /**
     * The number of times the user wants to repeat this action.
     */
    public count: number = 1;

    public clone(): RecordedState {
        const res = new RecordedState();

        res.actionKeys = this.actionKeys.slice(0);
        res.actionsRun = this.actionsRun.slice(0);

        return res;
    }

    public readyToExecute(mode: ModeName): boolean {
        // Visual modes do not require a motion -- they ARE the motion.
        return this.operator &&
            !this.hasRunOperator &&
            mode !== ModeName.SearchInProgressMode &&
            (this.hasRunAMovement || (
            mode === ModeName.Visual ||
            mode === ModeName.VisualLine));
    }

    public get isInInitialState(): boolean {
        return this.operator    === undefined &&
               this.actionsRun.length === 0   &&
               this.count       === 1;
    }

    public toString(): string {
        let res = "";

        for (const action of this.actionsRun) {
            res += action.toString();
        }

        return res;
    }
}

interface IViewState {
    selectionStart: Position;
    selectionStop : Position;
    currentMode   : ModeName;
}

export class ModeHandler implements vscode.Disposable {
    public static IsTesting = false;

    private _modes: Mode[];
    private _statusBarItem: vscode.StatusBarItem;
    private _configuration: Configuration;
    private _vimState: VimState;

    private _caretDecoration = vscode.window.createTextEditorDecorationType(
    {
        dark: {
            // used for dark colored themes
            backgroundColor: 'rgba(224, 224, 224, 0.4)',
            borderColor: 'rgba(224, 224, 224, 0.4)'
        },
        light: {
            // used for light colored themes
            backgroundColor: 'rgba(32, 32, 32, 0.4)',
            borderColor: 'rgba(32, 32, 32, 0.4)'
        },
        borderStyle: 'solid',
        borderWidth: '1px'
    });

    private get currentModeName(): ModeName {
        return this.currentMode.name;
    }

    /**
     * isTesting does not affect functionality, but speeds up tests drastically.
     */
    constructor(isTesting = true) {
        ModeHandler.IsTesting = isTesting;

        this._configuration = Configuration.fromUserFile();

        this._vimState = new VimState();
        this._modes = [
            new NormalMode(this),
            new InsertMode(),
            new VisualMode(),
            new VisualLineMode(),
            new SearchInProgressMode(),
        ];

        this._vimState.currentMode = ModeName.Normal;

        this.setCurrentModeByName(this._vimState);

        // handle scenarios where mouse used to change current position
        vscode.window.onDidChangeTextEditorSelection(async (e) => {
            let selection = e.selections[0];

            if (isTesting) {
                return;
            }

            // See comment about justUpdatedState.
            if (this._vimState.justUpdatedState) {
                this._vimState.justUpdatedState = false;

                return;
            }

            if (selection) {
                var newPosition = new Position(selection.active.line, selection.active.character);

                if (newPosition.character > newPosition.getLineEnd().character) {
                   newPosition = new Position(newPosition.line, newPosition.getLineEnd().character);
                }

                this._vimState.cursorPosition = newPosition;
                this._vimState.desiredColumn  = newPosition.character;

                // start visual mode?

                if (!selection.anchor.isEqual(selection.active)) {
                    var selectionStart = new Position(selection.anchor.line, selection.anchor.character);

                    if (selectionStart.character > selectionStart.getLineEnd().character) {
                        selectionStart = new Position(selectionStart.line, selectionStart.getLineEnd().character);
                    }

                    this._vimState.cursorStartPosition = selectionStart;

                    if (selectionStart.compareTo(newPosition) > 0) {
                        this._vimState.cursorStartPosition = this._vimState.cursorStartPosition.getLeft();
                    }

                    if (this._vimState.currentMode !== ModeName.Visual &&
                        this._vimState.currentMode !== ModeName.VisualLine) {

                        this._vimState.currentMode = ModeName.Visual;
                        this.setCurrentModeByName(this._vimState);
                    }
                } else {
                    if (this._vimState.currentMode !== ModeName.Insert) {
                        this._vimState.currentMode = ModeName.Normal;
                        this.setCurrentModeByName(this._vimState);
                    }
                }

                await this.updateView(this._vimState);
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

        this.setupStatusBarItem(`-- ${ this.currentMode.text.toUpperCase() } --`);
    }

    async handleKeyEvent(key: string): Promise<Boolean> {
        this._vimState = await this.handleKeyEventHelper(key, this._vimState);

        return true;
    }

    async handleKeyEventHelper(key: string, vimState: VimState): Promise<VimState> {
        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713

        key = this._configuration.keyboardLayout.translate(key);

        let recordedState = vimState.recordedState;

        recordedState.actionKeys.push(key);
        vimState.currentFullAction.push(key);

        let result = Actions.getRelevantAction(recordedState.actionKeys, vimState);

        if (result === KeypressState.NoPossibleMatch) {
            console.log("Nothing matched!");

            vimState.recordedState = new RecordedState();
            return vimState;
        } else if (result === KeypressState.WaitingOnKeys) {
            return vimState;
        }

        let action = result as BaseAction;

        recordedState.actionsRun.push(action);

        vimState = await this.runAction(vimState, recordedState, action);

        // Updated desired column

        const movement = action instanceof BaseMovement ? action : undefined;

        if ((movement && !movement.doesntChangeDesiredColumn) || recordedState.command) {
            // We check !operator here because e.g. d$ should NOT set the desired column to EOL.

            if (movement && movement.setsDesiredColumnToEOL && !recordedState.operator) {
                vimState.desiredColumn = Number.POSITIVE_INFINITY;
            } else {
                vimState.desiredColumn = vimState.cursorPosition.character;
            }
        }

        // Update view

        await this.updateView(vimState);

        vimState.justUpdatedState = true;

        return vimState;
    }

    async runAction(vimState: VimState, recordedState: RecordedState, action: BaseAction): Promise<VimState> {
        let ranRepeatableAction = false;
        let ranAction = false;

        if (action instanceof BaseMovement) {
            vimState = await this.executeMovement(vimState, action);

            ranAction = true;
        }

        if (action instanceof BaseCommand) {
            vimState = await action.exec(vimState.cursorPosition, vimState);

            if (vimState.commandAction !== VimCommandActions.DoNothing) {
                vimState = await this.handleCommand(vimState);
            }

            ranAction = true;
        }

        // Update mode (note the ordering allows you to go into search mode,
        // then return and have the motion immediately applied to an operator).

        if (vimState.currentMode !== this.currentModeName) {
            this.setCurrentModeByName(vimState);

            if (vimState.currentMode === ModeName.Normal) {
                ranRepeatableAction = true;
            }
        }

        if (recordedState.readyToExecute(vimState.currentMode)) {
            vimState = await this.executeOperator(vimState);

            vimState.recordedState.hasRunOperator = true;
            ranRepeatableAction = true;
            ranAction = true;
        }

        // And then we have to do it again because an operator could
        // have changed it as well. (TODO: do you even decomposition bro)

        if (vimState.currentMode !== this.currentModeName) {
            this.setCurrentModeByName(vimState);

            if (vimState.currentMode === ModeName.Normal) {
                ranRepeatableAction = true;
            }
        }

        if (vimState.currentMode === ModeName.Normal) {
            if (ranRepeatableAction) {
                vimState.previousFullAction = vimState.recordedState;
            }

            if (ranAction) {
                vimState.recordedState = new RecordedState();
            }
        }

        recordedState.actionKeys = [];
        vimState.currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;

        if (this.currentModeName === ModeName.Normal) {
            vimState.cursorStartPosition = vimState.cursorPosition;
        }

        return vimState;
    }

    private async executeMovement(vimState: VimState, movement: BaseMovement): Promise<VimState> {
        let recordedState = vimState.recordedState;

        const result = recordedState.operator ?
            await movement.execActionForOperator(vimState.cursorPosition, vimState) :
            await movement.execAction           (vimState.cursorPosition, vimState);

        if (result instanceof Position) {
            vimState.cursorPosition = result;
        } else if (isIMovement(result)) {
            vimState.cursorPosition      = result.stop;
            vimState.cursorStartPosition = result.start;
            vimState.currentRegisterMode = result.registerMode;
        }

        let stop = vimState.cursorPosition;

        // Keep the cursor within bounds

        if (vimState.currentMode === ModeName.Normal && !recordedState.operator) {
            if (stop.character >= Position.getLineLength(stop.line)) {
                vimState.cursorPosition = stop.getLineEnd().getLeft();
            }
        } else {

            // Vim does this weird thing where it allows you to select and delete
            // the newline character, which it places 1 past the last character
            // in the line. This is why we use > instead of >=.

            if (stop.character > Position.getLineLength(stop.line)) {
                vimState.cursorPosition = stop.getLineEnd();
            }
        }

        return vimState;
    }

    private async executeOperator(vimState: VimState): Promise<VimState> {
        let start         = vimState.cursorStartPosition;
        let stop          = vimState.cursorPosition;
        let recordedState = vimState.recordedState;

        if (recordedState.operator) {
            if (vimState.currentMode !== ModeName.Visual &&
                vimState.currentMode !== ModeName.VisualLine &&
                vimState.currentRegisterMode !== RegisterMode.LineWise) {
                if (Position.EarlierOf(start, stop) === start) {
                    stop = stop.getLeft();
                } else {
                    stop = stop.getRight();
                }
            }

            if (this.currentModeName === ModeName.VisualLine) {
                if (Position.EarlierOf(start, stop) === stop) {
                    [start, stop] = [stop, start];
                }

                start = start.getLineBegin();
                stop  = stop.getLineEnd();

                vimState.currentRegisterMode = RegisterMode.LineWise;
            }

            return await recordedState.operator.run(vimState, start, stop);
        }

        console.log("This is bad! Execution should never get here.");
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
                console.log("Running: ", vimState.previousFullAction.toString());

                const clonedAction = vimState.previousFullAction.clone();

                await this.rerunRecordedState(vimState, vimState.previousFullAction);

                vimState.previousFullAction = clonedAction;
            break;
        }

        return vimState;
    }

    async rerunRecordedState(vimState: VimState, recordedState: RecordedState): Promise<VimState> {
        const actions = recordedState.actionsRun.slice(0);

        recordedState = new RecordedState();
        vimState.recordedState = recordedState;

        let i = 0;

        for (let action of actions) {
            recordedState.actionsRun = actions.slice(0, ++i);
            vimState = await this.runAction(vimState, recordedState, action);
        }

        recordedState.actionsRun = actions;

        return vimState;
    }

    // TODO: this method signature is totally nonsensical!!!!
    private async updateView(vimState: VimState): Promise<void> {
        // Update cursor position

        let start = vimState.cursorStartPosition;
        let stop  = vimState.cursorPosition;

        if (vimState.currentMode === ModeName.Visual) {

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

        if (vimState.currentMode === ModeName.Visual) {
            vscode.window.activeTextEditor.selection = new vscode.Selection(start, stop);
        } else if (vimState.currentMode === ModeName.VisualLine) {
            vscode.window.activeTextEditor.selection = new vscode.Selection(
                Position.EarlierOf(start, stop).getLineBegin(),
                Position.LaterOf(start, stop).getLineEnd());
        } else {
            vscode.window.activeTextEditor.selection = new vscode.Selection(stop, stop);
        }

        // Scroll to position of cursor

        vscode.window.activeTextEditor.revealRange(new vscode.Range(vimState.cursorPosition, vimState.cursorPosition));

        let rangesToDraw: vscode.Range[] = [];

        // Draw block cursor.

        // Use native block cursor if possible.
        const options = vscode.window.activeTextEditor.options;

        options.cursorStyle = this.currentMode.cursorType === VSCodeVimCursorType.Native &&
                              this.currentMode.name       !== ModeName.Insert ?
            vscode.TextEditorCursorStyle.Block : vscode.TextEditorCursorStyle.Line;
        vscode.window.activeTextEditor.options = options;

        if (this.currentMode.cursorType === VSCodeVimCursorType.TextDecoration &&
                   this.currentMode.name !== ModeName.Insert) {

            // Fake block cursor with text decoration. Unfortunately we can't have a cursor
            // in the middle of a selection natively, which is what we need for Visual Mode.

            rangesToDraw.push(new vscode.Range(stop, stop.getRight()));
        }

        // Draw search highlight

        if (this.currentMode.name === ModeName.SearchInProgressMode &&
            vimState.nextSearchMatchPosition !== undefined) {

            rangesToDraw.push(new vscode.Range(
                vimState.nextSearchMatchPosition,
                vimState.nextSearchMatchPosition.getRight(vimState.searchString.length)));
        }

        vscode.window.activeTextEditor.setDecorations(this._caretDecoration, rangesToDraw);

        if (this.currentMode.name === ModeName.Visual || this.currentMode.name === ModeName.VisualLine) {
            this._vimState.justUpdatedState = true;
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