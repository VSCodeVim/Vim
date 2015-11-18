import {window, StatusBarAlignment, StatusBarItem} from 'vscode';
import {Mode, ModeName} from './mode';
import {showCmdLine} from './../cmd_line/main';
import CommandMode from './mode_command';
import InsertMode from './mode_insert';

export default class ModeHandler {
    private modes : Mode[];
    private statusBarItem : StatusBarItem;

    constructor() {
        this.modes = [
            new CommandMode(),
            new InsertMode(),
        ];

        this.SetCurrentModeByName(ModeName.Normal);
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

        this.setupStatusBarItem(ModeName[modeName]);
    }

    public HandleKeyEvent(key : string) : void {
        var isHandled = false;
        var currentModeName = this.CurrentMode.Name;

        switch (currentModeName) {
            case ModeName.Normal:
                if (key === "i" || key === "a" || key === "I" || key === "A" || key === "o" || key === "O") {
                    this.SetCurrentModeByName(ModeName.Insert);
                    isHandled = true;
                } else if (key === ":") {
                    showCmdLine();
                    isHandled = true;
                }
            break;
            case ModeName.Insert:
                if (key === "esc") {
                    this.SetCurrentModeByName(ModeName.Normal);
                    isHandled = true;
                }
            break;
            case ModeName.Visual:
            break;
        }

        if (!isHandled) {
            this.CurrentMode.HandleKeyEvent(key);
        }
    }

    private setupStatusBarItem(text : string) : void {
        if (!this.statusBarItem) {
            this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        }

        this.statusBarItem.text = 'vim: ' + text;
        this.statusBarItem.show();
    }
}