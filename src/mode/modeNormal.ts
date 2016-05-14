"use strict";

import * as _ from 'lodash';
import * as vscode from 'vscode';

import {Command} from './commands';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import {Motion, MotionMode} from './../motion/motion';
import {ModeHandler} from './modeHandler';
import {DeleteOperator} from './../operator/delete';
import {ChangeOperator} from './../operator/change';
import {PutOperator} from './../operator/put';
import {TextEditor} from './../textEditor';

export class NormalMode extends Mode {
    protected handleKey(command : Command) : (motion: Motion) => Promise<{}> {
        switch ( command ) {
            case Command.EnterCommand:
                return async () => { return showCmdLine("", this._modeHandler); };
            case Command.Find:
                return async () => { return vscode.commands.executeCommand("actions.find"); };
            case Command.Undo:
                return async () => { return vscode.commands.executeCommand("undo"); };
            case Command.Redo :
                return async () => { return vscode.commands.executeCommand("redo"); };
            case Command.MoveLeft:
                return async (c) => { return c.left().move(); };
            case Command.MoveDown:
                return async (c) => { return c.down().move(); };
            case Command.MoveUp:
                return async (c) => { return c.up().move(); };
            case Command.MoveRight:
                return async (c) => { return c.right().move(); };
            case Command.MoveLineEnd:
                return async (c) => { return c.lineEnd().move(); };
            case Command.MoveLineBegin:
                return async (c) => { return c.lineBegin().move(); };
            case Command.MoveNonBlank:
                return async () => { return vscode.commands.executeCommand("cursorHome"); };
            case Command.MoveNonBlankFirst:
                return async (c) => { return c.firstLineNonBlankChar().move(); };
            case Command.MoveNonBlankLast:
                return async (c) => { return c.lastLineNonBlankChar().move(); };
            case Command.MoveWordBegin:
                return async (c) => { return c.wordRight().move(); };
            case Command.MoveFullWordBegin:
                return async (c) => { return c.bigWordRight().move(); };
            case Command.MoveWordEnd:
                return async (c) => { return c.goToEndOfCurrentWord().move(); };
            case Command.MoveFullWordEnd:
                return async (c) => { return c.goToEndOfCurrentBigWord().move(); };
            case Command.MoveLastWordEnd :
                return async (c) => { return c.goToEndOfLastWord().move(); };
            case Command.MoveLastFullWordEnd:
                return async (c) => { return c.goToEndOfLastWord().move(); };
            case Command.MoveLastWord:
                return async (c) => { return c.wordLeft().move(); };
            case Command.MoveLastWordEnd:
                return async (c) => { return c.bigWordLeft().move(); };
            case Command.MoveParagraphEnd:
                return async (c) => { return c.goToEndOfCurrentParagraph().move(); };
            case Command.MoveParagraphBegin:
                return async (c) => { return c.goToBeginningOfCurrentParagraph().move(); };
            case Command.MoveFullPageDown:
                return async (c) => { return vscode.commands.executeCommand("cursorPageDown"); };
            case Command.MoveFullPageUp:
                return async (c) => { return vscode.commands.executeCommand("cursorPageUp"); };
            case Command.MoveMatchingBracket:
                return async () => { return vscode.commands.executeCommand("editor.action.jumpToBracket"); };
            case Command.Indent:
                return async () => { return vscode.commands.executeCommand("editor.action.indentLines"); };
            case Command.Outdent:
                return async () => { return vscode.commands.executeCommand("editor.action.outdentLines"); };
            case Command.ChangeWord:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    let currentChar = TextEditor.getLineAt(m.position).text[m.position.character];
                    if (currentChar === ' ' || currentChar === '\t') {
                        await new ChangeOperator(this._modeHandler).run(m.position, m.position.getWordRight());
                    } else {
                        await new ChangeOperator(this._modeHandler).run(m.position, m.position.getCurrentWordEnd());
                    }
                    return {};
                };
            case Command.ChangeFullWord:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    let currentChar = TextEditor.getLineAt(m.position).text[m.position.character];
                    if (currentChar === ' ' || currentChar === '\t') {
                        await new ChangeOperator(this._modeHandler).run(m.position, m.position.getWordRight());
                    } else {
                        await new ChangeOperator(this._modeHandler).run(m.position, m.position.getCurrentBigWordEnd());
                    }
                    return {};
                };
            case Command.ChangeCurrentWord:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    let currentChar = TextEditor.getLineAt(m.position).text[m.position.character];
                    if (currentChar === ' ' || currentChar === '\t') {
                        await new ChangeOperator(this._modeHandler).run(m.position.getLastWordEnd(), m.position.getWordRight());
                    } else {
                        await new ChangeOperator(this._modeHandler).run(m.position.getWordLeft(), m.position.getCurrentWordEnd());
                    }
                    this._modeHandler.setCurrentModeByName(ModeName.Insert);
                    return {};
                };
            case Command.ChangeCurrentWordToNext:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    let currentChar = TextEditor.getLineAt(m.position).text[m.position.character];
                    if (currentChar === ' ' || currentChar === '\t') {
                        await new ChangeOperator(this._modeHandler).run(m.position.getLastWordEnd(), m.position.getCurrentWordEnd());
                    } else {
                        await new ChangeOperator(this._modeHandler).run(m.position.getWordLeft(), m.position.getWordRight());
                    }
                    return {};
                };
            case Command.ChangeToLineEnd:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    await new ChangeOperator(this._modeHandler).run(m.position, m.position.getLineEnd());
                    return {};
                };
            case Command.DeleteLine:
                return async () => { return vscode.commands.executeCommand("editor.action.deleteLines"); };
            case Command.DeleteToNextWord:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    await new DeleteOperator(this._modeHandler).run(m.position, m.position.getWordRight());

                    if (m.position.character >= m.position.getLineEnd().character) {
                        m.left().move();
                    }

                    return {};
                };
            case Command.DeleteToFullNextWord :
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    await new DeleteOperator(this._modeHandler).run(m.position, m.position.getBigWordRight());
                    return {};
                };
            case Command.DeleteToWordBegin:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    await new DeleteOperator(this._modeHandler).run(m.position, m.position.getWordLeft());
                    return {};
                };
            case Command.DeleteToFullWordBegin:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    await new DeleteOperator(this._modeHandler).run(m.position, m.position.getBigWordLeft());
                    return {};
                };
            case Command.DeleteToWordEnd:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    await new DeleteOperator(this._modeHandler).run(m.position, m.position.getCurrentWordEnd());
                    return {};
                };
            case Command.DeleteToFullWordEnd:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    await new DeleteOperator(this._modeHandler).run(m.position, m.position.getCurrentBigWordEnd());
                    this.motion.left().move();
                    return {};
                };
            case Command.DeleteToLineEnd:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    await new DeleteOperator(this._modeHandler).run(m.position, m.position.getLineEnd());
                    this.motion.left().move();
                    return {};
                };
            case Command.DeleteChar:
                return async (m) => {
                    m.changeMode(MotionMode.Cursor);
                    await new DeleteOperator(this._modeHandler).run(m.position, m.position.getRight());
                    return {};
                };
            case Command.DeleteLastChar:
                return async (m) => { return vscode.commands.executeCommand("deleteLeft"); };
            case Command.Paste:
                return async (m) => {
                    await new PutOperator(this._modeHandler).run(m.position, null);
                    return {};
                };
            case Command.ExitMessages:
                return async () => { return vscode.commands.executeCommand("workbench.action.closeMessages"); };
            default:
                return async () => {return {}; };
        }
    }

    private _modeHandler: ModeHandler;

    constructor(motion : Motion, modeHandler: ModeHandler, keymap: {[key: string]: Command}) {
        super(ModeName.Normal, motion, keymap);

        this._modeHandler = modeHandler;
    }

    shouldBeActivated(key : string, currentMode : ModeName) : boolean {
        // TODO: Have these keybinds configurable
        return (key === 'esc' || key === 'ctrl+[' || (key === "v" && currentMode === ModeName.Visual));
    }

    async handleActivation(key : string): Promise<void> {
        this.motion.left().move();
    }

    async handleKeyEvent(key : string): Promise<boolean>  {
        this._keyHistory.push(key);

        let keyHandled = false;
        let keysPressed: string;
        let command: Command;

        for (let window = this._keyHistory.length; window > 0; window--) {
            keysPressed = _.takeRight(this._keyHistory, window).join('');
            command = this._keymap[keysPressed];
            if (command !== undefined) {
                keyHandled = true;
                break;
            }
        }

        if (keyHandled) {
            this._keyHistory = [];
            await this.handleKey(command)(this.motion);
        }

        return keyHandled;
    }
}
