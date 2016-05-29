"use strict";

import * as _ from 'lodash';
import * as vscode from 'vscode';

import {Mode, ModeName} from './mode';
import {Motion, MotionMode} from './../motion/motion';
import {NormalMode} from './modeNormal';
import {InsertMode} from './modeInsert';
import {VisualMode} from './modeVisual';
import {Configuration} from '../configuration/configuration';

export class ModeHandler implements vscode.Disposable {
    private _motion : Motion;
    private _modes : Mode[];
    private _statusBarItem : vscode.StatusBarItem;
    private _configuration : Configuration;

    constructor() {
        this._configuration = Configuration.fromUserFile();

        this._motion = new Motion(null);
        this._modes = [
            new NormalMode(this._motion, this, this._configuration.commandKeyMap.normalModeKeyMap),
            new InsertMode(this._motion, this._configuration.commandKeyMap.insertModeKeyMap),
            new VisualMode(this._motion, this, this._configuration.commandKeyMap.visualModeKeyMap),
        ];

        this.setCurrentModeByName(ModeName.Normal);
    }

    /**
     * The active mode.
     */
    get currentMode() : Mode {
        return this._modes.find(mode => mode.isActive);
    }

    setNormal() {
        this.setCurrentModeByName(ModeName.Normal);
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

    async handleKeyEvent(key : string) : Promise<Boolean> {
        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713
        key = this._configuration.keyboardLayout.translate(key);

        let currentModeName = this.currentMode.name;
        let nextMode : Mode;
        let inactiveModes = _.filter(this._modes, (m) => !m.isActive);

        for (let mode of inactiveModes) {
          if (mode.shouldBeActivated(key, currentModeName)) {
            if (nextMode) {
              console.error("More that one mode matched in handleKeyEvent!");
            }

            nextMode = mode;
          }
        }

        if (nextMode) {
            this.currentMode.handleDeactivation();
            this.setCurrentModeByName(nextMode.name);

            await nextMode.handleActivation(key);

            return true;
        } else {
            return this.currentMode.handleKeyEvent(key);
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