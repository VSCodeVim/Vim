import * as _ from 'lodash';

import * as vscode from 'vscode';

import {Mode, ModeName} from './mode';
import CommandMode from './mode_command';
import InsertMode from './mode_insert';
import VisualMode from './mode_visual';
import {Mappings} from '../mapping/main';
import * as util from '../util';

export default class ModeHandler {
    private modes : Mode[];
    private statusBarItem : vscode.StatusBarItem;
    private mappings : Mappings;

    constructor() {
        this.modes = [
            new CommandMode(),
            new InsertMode(),
            new VisualMode(),
        ];

        this.mappings = new Mappings();
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

        try {
            const keys = this.mappings.resolve(key, currentModeName);

            for (var i = 0; i < keys.length; i++) {
                this.currentMode.HandleKeyEvent(keys[i]);
            }
        } catch (e) {
            util.showError(e);
        }
    }
    
    setModeMapping(key : string, mapping : string, modeName : ModeName) {
        this.mappings.setModeMapping(key, mapping, modeName);
    }

    private setupStatusBarItem(text : string) : void {
        if (!this.statusBarItem) {
            this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }

        this.statusBarItem.text = (text) ? '-- ' + text + ' --' : '';
        this.statusBarItem.show();
    }
}