import * as _ from 'lodash';
import * as vscode from 'vscode';

import {Mode, ModeName} from './mode';
import {Motion, MotionMode} from './../motion/motion';
import NormalMode from './modeNormal';
import InsertMode from './modeInsert';
import Configuration from '../configuration';

export default class ModeHandler implements vscode.Disposable {
    private _motion : Motion;
    private _modes : Mode[];
    private _statusBarItem : vscode.StatusBarItem;
    private _configuration : Configuration;

    constructor() {
        this._configuration = Configuration.fromUserFile();

        this._motion = new Motion();
        this._modes = [
            new NormalMode(this._motion),
            new InsertMode(this._motion),
        ];

        this.setCurrentModeByName(ModeName.Normal);
    }

    get currentMode() : Mode {
        let currentMode = this._modes.find((mode, index) => {
            return mode.IsActive;
        });

        return currentMode;
    }

    setCurrentModeByName(modeName : ModeName) {
        this._modes.forEach(mode => {
            mode.IsActive = (mode.Name === modeName);
        });

        switch (modeName) {
            case ModeName.Insert:
                this._motion = this._motion.changeMode(MotionMode.Cursor);
                break;

            case ModeName.Normal:
                this._motion = this._motion.changeMode(MotionMode.Caret);
                break;
        }

        let statusBarText = (this.currentMode.Name === ModeName.Normal) ? '' : ModeName[modeName];
        this.setupStatusBarItem(statusBarText.toUpperCase());
    }

    handleKeyEvent(key : string) : void {
        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713
        key = this._configuration.keyboardLayout.translate(key);

        let currentModeName = this.currentMode.Name;
        let nextMode : Mode;
        let inactiveModes = _.filter(this._modes, (m) => !m.IsActive);

        _.forEach(inactiveModes, (m, i) => {
            if (m.ShouldBeActivated(key, currentModeName)) {
                nextMode = m;
            }
        });

        if (nextMode) {
            this.currentMode.HandleDeactivation();
            this.setCurrentModeByName(nextMode.Name);
            nextMode.HandleActivation(key);
            return;
        }

        this.currentMode.HandleKeyEvent(key);
    }

    private setupStatusBarItem(text : string) : void {
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        this._statusBarItem.text = (text) ? '-- ' + text + ' --' : '';
        this._statusBarItem.show();
    }

    dispose() {
        this._statusBarItem.dispose();
        this._motion.dispose();
    }
}