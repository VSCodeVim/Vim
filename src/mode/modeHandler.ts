"use strict";

import * as _ from 'lodash';
import * as vscode from 'vscode';

import * as cmds from './commands';
import {Mode, ModeName} from './mode';
import {Motion, MotionMode} from './../motion/motion';
import {NormalMode} from './modeNormal';
import {InsertMode} from './modeInsert';
import {VisualMode} from './modeVisual';
import {Configuration} from '../configuration';

export class ModeHandler implements vscode.Disposable {
    private _motion : Motion;
    private _modes : Mode[];
    private _statusBarItem : vscode.StatusBarItem;
    private _configuration : Configuration;

    constructor() {
        this._configuration = Configuration.fromUserFile();

        // This probably should be somewhere else but will work for now.
        // TODO: Only override default settings specified instead of all of them
        let normalKeymap = vscode.workspace.getConfiguration("vim")
            .get("normalModeKeybindings", cmds.newDefaultNormalKeymap());
        let insertKeymap = vscode.workspace.getConfiguration("vim")
            .get("insertModeKeybindings", cmds.newDefaultInsertKeymap());
        let visualKeymap = vscode.workspace.getConfiguration("vim")
            .get("visualModeKeybindings", cmds.newDefaultVisualKeymap());

        this._motion = new Motion(null);
        this._modes = [
            new NormalMode(this._motion, this, normalKeymap),
            new InsertMode(this._motion, insertKeymap),
            new VisualMode(this._motion, this, visualKeymap),
        ];

        this.setCurrentModeByName(ModeName.Normal);
    }

    get currentMode() : Mode {
        return this._modes.find(mode => mode.isActive);
    }

    setCurrentModeByName(modeName : ModeName) {
        for (let mode of this._modes) {
            mode.isActive = (mode.name === modeName);
        }

        switch (modeName) {
            case ModeName.Insert:
                this._motion = this._motion.changeMode(MotionMode.Cursor);
                break;

            case ModeName.Normal:
                this._motion = this._motion.changeMode(MotionMode.Caret);
                break;
        }

        const statusBarText = (this.currentMode.name === ModeName.Normal) ? '' : ModeName[modeName];
        this.setupStatusBarItem(statusBarText ? `-- ${statusBarText.toUpperCase()} --` : '');
    }

    handleKeyEvent(key : string) : void {
        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713
        key = this._configuration.keyboardLayout.translate(key);

        let currentModeName = this.currentMode.name;
        let keysPressed = this.currentMode.keyHistory.join('') + key;
        let nextMode : Mode;
        let inactiveModes = _.filter(this._modes, (m) => !m.isActive);

        for (let mode of inactiveModes) {
          if (mode.shouldBeActivated(keysPressed, currentModeName)) {
            if (nextMode) {
              console.error("More that one mode matched in handleKeyEvent!");
            }

            nextMode = mode;
          }
        }

        if (nextMode) {
            this.currentMode.handleDeactivation();
            this.setCurrentModeByName(nextMode.name);
            nextMode.handleActivation(key);
        } else {
            this.currentMode.handleKeyEvent(key);
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
        this._statusBarItem.dispose();
        this._motion.dispose();
    }
}