"use strict";

import * as vscode from "vscode";
import * as node from "../node";

export interface ISearchCommandArguments extends node.ICommandArgs {
}

//
//  Implements tab
//  http://vimdoc.sourceforge.net/htmldoc/tabpage.html
//
export class SearchCommand extends node.CommandBase {
    protected _arguments : ISearchCommandArguments;

    constructor(args : ISearchCommandArguments) {
        super();
        this._name = 'search';
        this._shortName = 's';
        this._arguments = args;
    }

    get arguments() : ISearchCommandArguments {
        return this._arguments;
    }

    execute() : void {
   }
}
