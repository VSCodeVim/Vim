import * as _ from 'lodash';
import * as vscode from 'vscode';
import {ModeName, Mode} from './mode';
import {showCmdLine} from './../cmd_line/main';
import * as Motions from '../motions/motions';
import * as Operations from '../operations/operations';

export default class CommandMode extends Mode {
    private keyHandler: { [key: string]: () => void; } = {};
    
    constructor() {
        super(ModeName.Normal);
        
        this.registerKeyHandler(":", () => showCmdLine());
        this.registerKeyHandler("h", new Motions.MoveLeft());
        this.registerKeyHandler("j", new Motions.MoveDown());
        this.registerKeyHandler("k", new Motions.MoveUp());
        this.registerKeyHandler("l", new Motions.MoveRight());
        this.registerKeyHandler("w", new Motions.MoveWordRight());
        this.registerKeyHandler("b", new Motions.MoveWordLeft());
        this.registerKeyHandler(">>", () => vscode.commands.executeCommand("editor.action.indentLines"));
        this.registerKeyHandler("<<", () => vscode.commands.executeCommand("editor.action.outdentLines"));
        this.registerKeyHandler("dd", new Operations.OperationDeleteLine());
        
    }

    private registerKeyHandler(key: string, fn: () => void): void;
    private registerKeyHandler(key: string, motion: Motions.Motion): void;
    private registerKeyHandler(key: string, operator: Operations.OperationDeleteLine): void;
    private registerKeyHandler(key: string, handler): any {
        if (typeof handler === "function") {
            this.keyHandler[key] = handler;
        } else if (handler.execute !== undefined) {
            this.keyHandler[key] = () => handler.execute();
        }
    }
    
    ShouldBeActivated(key : string, currentMode : ModeName) : boolean {
        return (key === 'esc' || key === 'ctrl+[');
    }

    HandleActivation(key : string) : void {
        // do nothing
    }

    HandleKeyEvent(key: string): void {
        console.log(this.Name);
        console.log(this.IsActive);
        let keyHandled = false;
        for (let window = 0; window <= this.keyHistory.length; window++) {
            var keysPressed = key + _.takeRight(this.keyHistory, window).join('');
            
            if (this.keyHandler[keysPressed] !== undefined) {
                keyHandled = true;
                this.keyHandler[keysPressed]();
                break;
            }
        }
        
        if (keyHandled) {
            this.keyHistory = [];
        } else {
            this.keyHistory.push(key);
        }
    }
}