"use strict";

import * as vscode from 'vscode';
import * as _ from 'lodash';

import { getAndUpdateModeHandler } from './../../extension';
import { Mode, ModeName, VSCodeVimCursorType } from './mode';
import { InsertModeRemapper, OtherModesRemapper } from './remapper';
import { NormalMode } from './modeNormal';
import { InsertMode } from './modeInsert';
import { VisualMode } from './modeVisual';
import { SearchInProgressMode } from './modeSearchInProgress';
import { TextEditor } from './../textEditor';
import { VisualLineMode } from './modeVisualLine';
import { HistoryTracker } from './../history/historyTracker';
import {
    BaseMovement, BaseCommand, Actions, BaseAction,
    BaseOperator, isIMovement,
    KeypressState } from './../actions/actions';
import { Configuration } from '../configuration/configuration';
import { Position } from './../motion/position';
import { RegisterMode } from './../register/register';
import { showCmdLine } from '../../src/cmd_line/main';

export enum VimSpecialCommands {
    Nothing,
    ShowCommandLine,
    Dot
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

    public historyTracker: HistoryTracker;

    /**
     * The keystroke sequence that made up our last complete action (that can be
     * repeated with '.').
     */
    public previousFullAction: RecordedState = undefined;

    public alteredHistory = false;

    public focusChanged = false;

    /**
     * The current full action we are building up.
     */
    public currentFullAction: string[] = [];

    /**
     * The position the cursor will be when this action finishes.
     */
    // public cursorPosition = new Position(0, 0);
    private _cursorPosition = new Position(0, 0);
    public get cursorPosition(): Position { return this._cursorPosition; }
    public set cursorPosition(v: Position) {
        this._cursorPosition = v;
    }

    /**
     * The effective starting position of the movement, used along with cursorPosition to determine
     * the range over which to run an Operator. May rarely be different than where the cursor
     * actually starts e.g. if you use the "aw" text motion in the middle of a word.
     */
    public cursorStartPosition = new Position(0, 0);

    public cursorPositionJustBeforeAnythingHappened = new Position(0, 0);

    public searchState: SearchState = undefined;

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
    public commandAction = VimSpecialCommands.Nothing;

    public recordedState = new RecordedState();

    /**
     * Programmatically triggering an edit will unfortunately ALSO trigger our mouse update
     * function. We use this variable to determine if the update function was triggered
     * by us or by a mouse action.
     */
    public whatILastSetTheSelectionTo: vscode.Selection;

    public settings = new VimSettings();
}

export class VimSettings {
    useSolidBlockCursor = false;
}

export class SearchState {
    /**
     * Every range in the document that matches the search string.
     */
    public matchRanges: vscode.Range[] = [];

    private _searchString = "";
    public get searchString(): string {
        return this._searchString;
    }

    public set searchString(search: string){
        this._searchString = search;

        this._recalculateSearchRanges();
    }

    private _recalculateSearchRanges(): void {
        const search = this.searchString;

        if (search === "") { return; }

        // Calculate and store all matching ranges
        this.matchRanges = [];

        for (let lineIdx = 0; lineIdx < TextEditor.getLineCount(); lineIdx++) {
            const line = TextEditor.getLineAt(new Position(lineIdx, 0)).text;

            let i = line.indexOf(search);

            for (; i !== -1; i = line.indexOf(search, i + search.length)) {
                this.matchRanges.push(new vscode.Range(
                    new Position(lineIdx, i),
                    new Position(lineIdx, i + search.length)
                ));
            }
        }
    }

    /**
     * The position of the next search, or undefined if there is no match.
     *
     * Pass in -1 as direction to reverse the direction we search.
     */
    public getNextSearchMatchPosition(startPosition: Position, direction = 1): { pos: Position, match: boolean} {
        this._recalculateSearchRanges();

        if (this.matchRanges.length === 0) {
            // TODO(bell)
            return { pos: startPosition, match: false };
        }

        const effectiveDirection = direction * this.searchDirection;

        if (effectiveDirection === 1) {
            for (let matchRange of this.matchRanges) {
                if (matchRange.start.compareTo(startPosition) > 0) {
                    return { pos: Position.FromVSCodePosition(matchRange.start), match: true };
                }
            }

            // Wrap around
            // TODO(bell)
            return { pos: Position.FromVSCodePosition(this.matchRanges[0].start), match: true };
        } else {
            for (let matchRange of this.matchRanges.slice(0).reverse()) {
                if (matchRange.start.compareTo(startPosition) < 0) {
                    return { pos: Position.FromVSCodePosition(matchRange.start), match: true };
                }
            }

            // TODO(bell)
            return {
                pos: Position.FromVSCodePosition(this.matchRanges[this.matchRanges.length - 1].start),
                match: true
            };
        }
    }

    public searchCursorStartPosition: Position = undefined;

    /**
     * 1  === forward
     * -1 === backward
     */
    public searchDirection = 1;

    constructor(direction: number, startPosition: Position, searchString = "") {
        this.searchDirection = direction;
        this.searchCursorStartPosition = startPosition;
        this.searchString = searchString;
    }
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
        return _.filter(this.actionsRun, a => a.isMotion).length > 0;
    }

    /**
     * The number of times the user wants to repeat this action.
     */
    public count: number = 0;

    public clone(): RecordedState {
        const res = new RecordedState();

        // TODO: Actual clone.

        res.actionKeys          = this.actionKeys.slice(0);
        res.actionsRun          = this.actionsRun.slice(0);
        res.hasRunOperator      = this.hasRunOperator;

        return res;
    }

    public operatorReadyToExecute(mode: ModeName): boolean {
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
    private _insertModeRemapper: InsertModeRemapper;
    private _otherModesRemapper: OtherModesRemapper;

    public get vimState(): VimState {
        return this._vimState;
    }

    /**
     * Filename associated with this ModeHandler. Only used for debugging.
     */
    public filename: string;

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
     * isTesting speeds up tests drastically by turning off our checks for
     * mouse events.
     */
    constructor(isTesting = true, filename = "") {
        ModeHandler.IsTesting = isTesting;

        this.filename = filename;
        this._configuration = Configuration.fromUserFile();

        this._vimState = new VimState();
        this._insertModeRemapper = new InsertModeRemapper();
        this._otherModesRemapper = new OtherModesRemapper();
        this._modes = [
            new NormalMode(this),
            new InsertMode(),
            new VisualMode(),
            new VisualLineMode(),
            new SearchInProgressMode(),
        ];
        this.vimState.historyTracker = new HistoryTracker();

        this._vimState.currentMode = ModeName.Normal;

        this.setCurrentModeByName(this._vimState);

        // Sometimes, Visual Studio Code will start the cursor in a position which
        // is not (0, 0) - e.g., if you previously edited the file and left the cursor
        // somewhere else when you closed it. This will set our cursor's position to the position
        // that VSC set it to.
        if (vscode.window.activeTextEditor) {
            this._vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
            this._vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
        }

        this.loadSettings();

        // Handle scenarios where mouse used to change current position.
        vscode.window.onDidChangeTextEditorSelection(async (e) => {
            let selection = e.selections[0];

            if (isTesting) {
                return;
            }

            if (e.textEditor.document.fileName !== this.filename) {
                return;
            }

            if (this._vimState.focusChanged) {
                this._vimState.focusChanged = false;
                return;
            }

            // See comment about whatILastSetTheSelectionTo.
            if (this._vimState.whatILastSetTheSelectionTo.isEqual(selection)) {
                return;
            }

            if (this._vimState.currentMode === ModeName.SearchInProgressMode) {
                return;
            }

            if (selection) {
                var newPosition = new Position(selection.active.line, selection.active.character);

                if (newPosition.character >= newPosition.getLineEnd().character) {
                   newPosition = new Position(newPosition.line, Math.max(newPosition.getLineEnd().character, 0));
                }

                this._vimState.cursorPosition      = newPosition;
                this._vimState.cursorStartPosition = newPosition;

                this._vimState.desiredColumn       = newPosition.character;

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

                await this.updateView(this._vimState, false);
            }
        });
    }

    private loadSettings(): void {
        this._vimState.settings.useSolidBlockCursor = vscode.workspace.getConfiguration("vim")
            .get("useSolidBlockCursor", false);
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

        for (let mode of this._modes) {
            if (mode.name === vimState.currentMode) {
                activeMode = mode;
            }

            mode.isActive = (mode.name === vimState.currentMode);
        }

        this.setupStatusBarItem(`-- ${ this.currentMode.text.toUpperCase() } --`);
    }

    async handleKeyEvent(key: string): Promise<Boolean> {
        if (key === "<c-r>") { key = "ctrl+r"; } // TODO - temporary hack for tests only!

        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713

        key = this._configuration.keyboardLayout.translate(key);

        this._vimState.cursorPositionJustBeforeAnythingHappened = this._vimState.cursorPosition;

        try {
            let handled = false;

            handled = handled || await this._insertModeRemapper.sendKey(key, this, this.vimState);
            handled = handled || await this._otherModesRemapper.sendKey(key, this, this.vimState);

            if (!handled) {
                this._vimState = await this.handleKeyEventHelper(key, this._vimState);
            }
        } catch (e) {
            console.log('error.stack');
            console.log(e);
            console.log(e.stack);
        }

        if (this._vimState.focusChanged) {
            await getAndUpdateModeHandler();
        }

        return true;
    }

    async handleKeyEventHelper(key: string, vimState: VimState): Promise<VimState> {
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
            vimState = await action.execCount(vimState.cursorPosition, vimState);

            if (vimState.commandAction !== VimSpecialCommands.Nothing) {
                await this.executeCommand(vimState);
            }

            if (action.isCompleteAction) {
                ranAction = true;
            }

            if (action.canBeRepeatedWithDot) {
                ranRepeatableAction = true;
            }
        }

        // Update mode (note the ordering allows you to go into search mode,
        // then return and have the motion immediately applied to an operator).

        if (vimState.currentMode !== this.currentModeName) {
            this.setCurrentModeByName(vimState);

            if (vimState.currentMode === ModeName.Normal) {
                ranRepeatableAction = true;
            }
        }

        if (recordedState.operatorReadyToExecute(vimState.currentMode)) {
            vimState = await this.executeOperator(vimState);

            vimState.recordedState.hasRunOperator = true;
            ranRepeatableAction = vimState.recordedState.operator.canBeRepeatedWithDot;
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

        ranRepeatableAction = ranRepeatableAction && vimState.currentMode === ModeName.Normal;
        ranAction           = ranAction           && vimState.currentMode === ModeName.Normal;

        // Record down previous action and flush temporary state

        if (ranRepeatableAction) {
            vimState.previousFullAction = vimState.recordedState;
        }

        if (ranAction) {
            vimState.recordedState = new RecordedState();
        }

        // track undo history

        if (this._vimState.alteredHistory) {
            this._vimState.alteredHistory = false;
            vimState.historyTracker.ignoreChange();
        } else {
            vimState.historyTracker.addChange(this._vimState.cursorPositionJustBeforeAnythingHappened);
        }

        if (ranRepeatableAction) {
            vimState.historyTracker.finishCurrentStep();
        }

        // console.log(vimState.historyTracker.toString());

        recordedState.actionKeys = [];
        vimState.currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;

        if (this.currentModeName === ModeName.Normal) {
            vimState.cursorStartPosition = vimState.cursorPosition;
        }

        // Ensure cursor is within bounds

        if (vimState.cursorPosition.line >= TextEditor.getLineCount()) {
            vimState.cursorPosition = vimState.cursorPosition.getDocumentEnd();
        }

        const currentLineLength = TextEditor.getLineAt(vimState.cursorPosition).text.length;

        if (vimState.currentMode === ModeName.Normal &&
            vimState.cursorPosition.character >= currentLineLength &&
            currentLineLength > 0) {
            vimState.cursorPosition = new Position(
                vimState.cursorPosition.line,
                currentLineLength - 1
            );
        }

        return vimState;
    }

    private async executeMovement(vimState: VimState, movement: BaseMovement): Promise<VimState> {
        let recordedState = vimState.recordedState;

        const result = await movement.execActionWithCount(vimState.cursorPosition, vimState, recordedState.count);

        if (result instanceof Position) {
            vimState.cursorPosition = result;
        } else if (isIMovement(result)) {
            vimState.cursorPosition      = result.stop;
            vimState.cursorStartPosition = result.start;
            vimState.currentRegisterMode = result.registerMode;
        }

        vimState.recordedState.count = 0;

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

            if (start.compareTo(stop) > 0) {
                [start, stop] = [stop, start];
            }

            if (this.currentModeName === ModeName.VisualLine) {
                start = start.getLineBegin();
                stop  = stop.getLineEnd();

                vimState.currentRegisterMode = RegisterMode.LineWise;
            }

            return await recordedState.operator.run(vimState, start, stop);
        }

        console.log("This is bad! Execution should never get here.");
    }

    private async executeCommand(vimState: VimState): Promise<VimState> {
        const command = vimState.commandAction;

        vimState.commandAction = VimSpecialCommands.Nothing;

        switch (command) {
            case VimSpecialCommands.ShowCommandLine:
                await showCmdLine("", this);
            break;
            case VimSpecialCommands.Dot:
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

    public async updateView(vimState: VimState, drawSelection = true): Promise<void> {
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

        if (drawSelection) {
            let selection: vscode.Selection;

            if (vimState.currentMode === ModeName.Visual) {
                selection = new vscode.Selection(start, stop);
            } else if (vimState.currentMode === ModeName.VisualLine) {
                selection = new vscode.Selection(
                    Position.EarlierOf(start, stop).getLineBegin(),
                    Position.LaterOf(start, stop).getLineEnd());
            } else {
                selection = new vscode.Selection(stop, stop);
            }

            this._vimState.whatILastSetTheSelectionTo = selection;
            vscode.window.activeTextEditor.selection = selection;
        }

        // Scroll to position of cursor

        vscode.window.activeTextEditor.revealRange(new vscode.Range(vimState.cursorPosition, vimState.cursorPosition));

        let rangesToDraw: vscode.Range[] = [];

        // Draw block cursor.

        if (vimState.settings.useSolidBlockCursor) {
            if (this.currentMode.name !== ModeName.Insert) {
                rangesToDraw.push(new vscode.Range(
                    vimState.cursorPosition,
                    vimState.cursorPosition.getRight()
                ));
            }
        } else {
            // Use native block cursor if possible.

            const options = vscode.window.activeTextEditor.options;

            options.cursorStyle = this.currentMode.cursorType === VSCodeVimCursorType.Native &&
                                  this.currentMode.name       !== ModeName.Insert ?
                vscode.TextEditorCursorStyle.Block : vscode.TextEditorCursorStyle.Line;
            vscode.window.activeTextEditor.options = options;
        }

        if (this.currentMode.cursorType === VSCodeVimCursorType.TextDecoration &&
            this.currentMode.name !== ModeName.Insert) {

            // Fake block cursor with text decoration. Unfortunately we can't have a cursor
            // in the middle of a selection natively, which is what we need for Visual Mode.

            rangesToDraw.push(new vscode.Range(stop, stop.getRight()));
        }

        for (const mark of this.vimState.historyTracker.getMarks()) {
            rangesToDraw.push(new vscode.Range(mark.position, mark.position.getRight()));
        }

        // Draw search highlight

        const searchState = vimState.searchState;

        if (this.currentMode.name === ModeName.SearchInProgressMode) {
            rangesToDraw.push.apply(rangesToDraw, searchState.matchRanges);

            const { pos, match } =  searchState.getNextSearchMatchPosition(vimState.cursorPosition);

            if (match) {
                rangesToDraw.push(new vscode.Range(
                    pos,
                    pos.getRight(searchState.searchString.length)));
            }
        }

        vscode.window.activeTextEditor.setDecorations(this._caretDecoration, rangesToDraw);
    }

    async handleMultipleKeyEvents(keys: string[]): Promise<void> {
        for (const key of keys) {
            await this.handleKeyEvent(key);
        }
    }

    setupStatusBarItem(text: string): void {
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