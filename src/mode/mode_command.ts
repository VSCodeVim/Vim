import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import * as vscode from 'vscode';

export default class CommandMode extends Mode {
    private timesEscHandled : number;

    constructor() {
        super(ModeName.Command);
        this.timesEscHandled = 0;
    }

    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc');
    }

    HandleActivation(key : string) : void {
        // do nothing
    }

    handleDeactivation() : void {
        this.timesEscHandled = 0;
    }

    HandleKeyEvent(key : string) : void {
        this.keyHistory.push(key);

        switch (key) {
            case 'esc':
                // If the user presses Esc while in normal mode, close any open messages.
                // XXX: Can/should we use a custom key binding context for this?
                if (++this.timesEscHandled > 1) {
                    vscode.commands.executeCommand("workbench.action.closeMessages");
                }
                break;
            case ':':
                showCmdLine();
                break;
            case 'h':
                vscode.commands.executeCommand("cursorLeft");
                break;
            case 'j':
                vscode.commands.executeCommand("cursorDown");
                break;
            case 'k':
                vscode.commands.executeCommand("cursorUp");
                break;
            case 'l':
                vscode.commands.executeCommand("cursorRight");
                break;
        }
    }
}