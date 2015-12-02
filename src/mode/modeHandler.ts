import * as _ from 'lodash';
import * as vscode from 'vscode';

import {Mode, ModeName} from './mode';
import NormalMode from './modeNormal';
import InsertMode from './modeInsert';
import VisualMode from './modeVisual';
import Configuration from '../configuration';
import {KeyState} from '../keyState';

export default class ModeHandler {
    modes : Mode[];
    private statusBarItem : vscode.StatusBarItem;
    configuration : Configuration;
    keyState : KeyState; 

    constructor() {
        this.keyState = new KeyState();
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
    
    handleKeyEvents(keys : Array<string>) {
        for (const key of keys) {
            this.handleKeyEvent(key);
        }
    }

    handleKeyEvent(key : string) : void {
        // Due to a limitation in Electron, en-US QWERTY char codes are used in international keyboards.
        // We'll try to mitigate this problem until it's fixed upstream.
        // https://github.com/Microsoft/vscode/issues/713
        key = this.configuration.keyboardLayout.translate(key);
        
        this.keyState.addKey(key);
        this.keyState.handle(this); 
    }

    private setupStatusBarItem(text : string) : void {
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        this.statusBarItem.text = (text) ? '-- ' + text + ' --' : '';
        this.statusBarItem.show();
    }
}