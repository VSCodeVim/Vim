"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import * as error from '../../error';

export enum Tab {
    Next,
    Previous,
    First,
    Last
}

export interface ITabCommandArguments extends node.ICommandArgs {
    tab: Tab;
    range?: node.LineRange;
}

//
//  Implements tab
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:quit
//
export class TabCommand extends node.CommandBase {
    protected _arguments : ITabCommandArguments;

    constructor(args : ITabCommandArguments) {
        super();
        this._name = 'tab';
        this._shortName = 'tab';
        this._arguments = args;
    }

    get arguments() : ITabCommandArguments {
        return this._arguments;
    }

    execute() : void {
        switch (this._arguments.tab) {
            case Tab.Next:
                vscode.commands.executeCommand("workbench.action.nextEditor");
                break;
            case Tab.Previous:
                vscode.commands.executeCommand("workbench.action.previousEditor");
                break;
            case Tab.First:
                vscode.commands.executeCommand("workbench.action.openEditorAtIndex1");
                break;
            case Tab.Last:
                vscode.commands.executeCommand("workbench.action.openLastEditorInGroup");
                break;
        
            default:
                break;
        }
    }
}
