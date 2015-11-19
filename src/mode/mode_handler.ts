import * as vscode from 'vscode';
import {Mode, ModeName} from './mode';

import CommandMode from './mode_command';
import InsertMode from './mode_insert';
import VisualMode from './mode_visual';

import * as _ from 'lodash';

export default class ModeHandler {
    private modes : Mode[];
    private statusBarItem : vscode.StatusBarItem;

    constructor() {
        this.modes = [
            new CommandMode(),
            new InsertMode(),
            new VisualMode(),
        ];

        this.SetCurrentModeByName(ModeName.Command);
    }

    public get CurrentMode() : Mode {
        var currentMode = this.modes.find((mode, index) => {
            return mode.IsActive;
        });

        return currentMode;
    }

    public SetCurrentModeByName(modeName : ModeName) {
        this.modes.forEach(mode => {
            mode.IsActive = (mode.Name === modeName);
        });

        this.setupStatusBarItem(ModeName[modeName].toUpperCase());
    }

    public HandleKeyEvent(key : string) : void {
        var currentModeName = this.CurrentMode.Name;
    
        var nextMode : Mode;
        var inactiveModes = _.filter(this.modes, (m) => !m.IsActive);
        
        _.forEach(inactiveModes, (m, i) => {
            if (m.ShouldBeActivated(key, currentModeName)) {
                nextMode = m;
            }  
        });
        
        if (nextMode) {
            this.CurrentMode.HandleDeactivation();
            
            nextMode.HandleActivation(key);
            this.SetCurrentModeByName(nextMode.Name);
            return;
        }

        this.CurrentMode.HandleKeyEvent(key);
    }

    private setupStatusBarItem(text : string) : void {
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        this.statusBarItem.text = '-- ' + text + ' --';
        this.statusBarItem.show();
    }
}