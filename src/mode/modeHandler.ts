import * as _ from 'lodash';
import * as vscode from 'vscode';

import {Mode, ModeName} from './mode';
import NormalMode from './modeNormal';
import InsertMode from './modeInsert';
import VisualMode from './modeVisual';
import Configuration from '../configuration';

export default class ModeHandler {
    private modes : Mode[];
    private statusBarItem : vscode.StatusBarItem;
    configuration : Configuration;

    constructor() {
        this.configuration = Configuration.fromUserFile();

        this.modes = [
            new NormalMode(),
            new InsertMode(),
            new VisualMode(),
        ];

        this.setCurrentModeByName(ModeName.Normal);
    }

    get currentMode() : Mode {
        var currentMode = this.modes.find((mode, index) => {
            return mode.IsActive;
        });

        return currentMode;
    }

    setCurrentModeByName(modeName : ModeName) {
        this.modes.forEach(mode => {
            mode.IsActive = (mode.Name === modeName);
        });

        var statusBarText = (this.currentMode.Name === ModeName.Normal) ? '' : ModeName[modeName];
        this.setupStatusBarItem(statusBarText.toUpperCase());
    }

    handleKeyEvent(key : string) : void {
        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713
        key = this.configuration.keyboardLayout.translate(key);

        var currentModeName = this.currentMode.Name;
        var nextMode : Mode;
        var inactiveModes = _.filter(this.modes, (m) => !m.IsActive);

        _.forEach(inactiveModes, (m, i) => {
            if (m.ShouldBeActivated(key, currentModeName)) {
                nextMode = m;
            }
        });

        if (nextMode) {
            this.currentMode.HandleDeactivation();

            nextMode.HandleActivation(key);
            this.setCurrentModeByName(nextMode.Name);
            return;
        }

        this.currentMode.HandleKeyEvent(key);
    }

    private setupStatusBarItem(text : string) : void {
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        this.statusBarItem.text = (text) ? '-- ' + text + ' --' : '';
        this.statusBarItem.show();
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}