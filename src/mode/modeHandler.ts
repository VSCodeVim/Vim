"use strict";

import * as _ from 'lodash';
import * as vscode from 'vscode';

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

        this._motion = new Motion(null);
        this._modes = [
            new NormalMode(this._motion, this),
            new InsertMode(this._motion, this),
            new VisualMode(this._motion, this),
        ];

        this.setCurrentModeByName(ModeName.Normal);
    }

    get currentMode() : Mode {
        return this._modes.find(mode => mode.isActive);
    }

    setCurrentModeByName(modeName : ModeName, activate? : boolean) {
        if (this.currentMode && activate !== false) {
            this.currentMode.handleDeactivation();
        }

        let nextMode : Mode;
        for (let mode of this._modes) {
            mode.isActive = (mode.name === modeName);
            if (mode.isActive) {
                nextMode = mode;
            }
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
        this.setupStatusBarItem(statusBarText.toUpperCase());

        if (activate !== false) {
            nextMode.handleActivation();
        }
    }

    async handleKeyEvent(key : string) : Promise<void> {
        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713
        key = this._configuration.keyboardLayout.translate(key);

        await this.currentMode.handleKeyEvent(key);
    }

    private setupStatusBarItem(text : string) : void {
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        this._statusBarItem.text = text ? `--${text}--` : '';
        this._statusBarItem.show();
    }

    dispose() {
        this._statusBarItem.dispose();
        this._motion.dispose();
    }
}