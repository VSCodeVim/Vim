import * as _ from 'lodash';

import * as vscode from 'vscode';

import {Mode, ModeName} from './mode';
import CommandMode from './mode_command';
import InsertMode from './mode_insert';
import VisualMode from './mode_visual';

export default class ModeHandler {
    private modes : Mode[];
    private statusBarItem : vscode.StatusBarItem;

    constructor() {
        this.modes = [
            new CommandMode(),
            new InsertMode(),
            new VisualMode(),
        ];

        this.setCurrentModeByName(ModeName.Command);
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

        var statusBarText = (this.currentMode.Name === ModeName.Command) ? '' : ModeName[modeName];
        this.setupStatusBarItem(statusBarText.toUpperCase());
    }

    handleKeyEvent(key : string) : void {
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
}