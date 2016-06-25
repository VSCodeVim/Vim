"use strict";

import * as vscode from "vscode";
import * as fs from 'fs';
import * as path from 'path';
import * as node from "../node";
import * as util from "../../util";
import * as error from "../../error";
import {ModeHandler} from "../../mode/modeHandler";

//
// Implements :writequit
// http://vimdoc.sourceforge.net/htmldoc/editing.html#write-quit
//
export interface IWriteQuitCommandArguments extends node.ICommandArgs {
    // arguments
    // [++opt]
    opt? : string;
    optValue? : string;
    // wq! [++opt]
    bang? : boolean;
    // wq [++opt] {file}
    file? : string;
    // wq! [++opt] {file}
    // [range]wq[!] [++opt] [file]
    range?: node.LineRange;
}

export class WriteQuitCommand extends node.CommandBase {
    protected _arguments : IWriteQuitCommandArguments;

    constructor(args : IWriteQuitCommandArguments) {
        super();
        this._name = "writequit";
        this._shortName = "wq";
        this._arguments = args;
    }

    get arguments() : IWriteQuitCommandArguments {
        return this._arguments;
    }

    // Writing command. Taken as a basis from the "write.ts" file.
    execute(modeHandler : ModeHandler) : void {
        // Writing
        if (this.arguments.opt) {
            util.showError("Not implemented.");
            return;
        } else if (this.arguments.file) {
            util.showError("Not implemented.");
            return;
        } else if (this.arguments.range) {
            util.showError("Not implemented.");
        }
        // Check if the document has been edited
        if (this.activeTextEditor.document.isUntitled) {
            throw error.VimError.fromCode(error.ErrorCode.E32);
        }

        fs.access(this.activeTextEditor.document.fileName, fs.W_OK, (accessErr) => {
            if (accessErr) {
                if (this.arguments.bang) {
                    // What is 666?
                    fs.chmod(this.activeTextEditor.document.fileName, 666, (e) => {
                        if (e) {
                            modeHandler.setupStatusBarItem(e.message);
                        } else {
                            this.Save(modeHandler);
                            this.Quit();
                        }
                    });
                } else {
                    modeHandler.setupStatusBarItem(accessErr.message);
                }
            } else {
                this.Save(modeHandler);
                this.Quit();
            }
        });
    }

    private Save(modeHandler : ModeHandler) {
        this.activeTextEditor.document.save().then(
            (ok) => {
                modeHandler.setupStatusBarItem('"' + path.basename(this.activeTextEditor.document.fileName) +
                '" ' + this.activeTextEditor.document.lineCount + 'L ' +
                this.activeTextEditor.document.getText().length + 'C written');
            },
            (e) => modeHandler.setupStatusBarItem(e)
        );
    }

    // Quitting command. Taken as a basis from the "quit.ts" file.
    private Quit() : void {
        // Quitting
        // This will never occur after writing
        // if (this.activeTextEditor.document.isDirty && !this.arguments.bang) { // is 'bang' the '!'?
        //     throw error.VimError.fromCode(error.ErrorCode.E37); // TODO Check that this is the right error code
        // }

        // Closes the active text editor
        vscode.commands.executeCommand('workbench.action.closeActiveEditor'); // This is the close command
    }
}