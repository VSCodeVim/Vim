"use strict";

// XXX: use graceful-fs ??
import * as fs from 'fs';
import * as path from 'path';

import * as node from '../node';
import * as util from '../../util';
import * as error from '../../error';
import {ModeHandler} from "../../mode/modeHandler";

export interface IWriteCommandArguments extends node.ICommandArgs {
    opt? : string;
    optValue? : string;
    bang? : boolean;
    range? : node.LineRange;
    file? : string;
    append? : boolean;
    cmd? : string;
}

//
//  Implements :write
//  http://vimdoc.sourceforge.net/htmldoc/editing.html#:write
//
export class WriteCommand extends node.CommandBase {
    protected _arguments : IWriteCommandArguments;

    constructor(args : IWriteCommandArguments) {
        super();
        this._name = 'write';
        this._shortName = 'w';
        this._arguments = args;
    }

    get arguments() : IWriteCommandArguments {
        return this._arguments;
    }

    execute(modeHandler : ModeHandler) : void {
        if (this.arguments.opt) {
            util.showError("Not implemented.");
            return;
        } else if (this.arguments.file) {
            util.showError("Not implemented.");
            return;
        } else if (this.arguments.append) {
            util.showError("Not implemented.");
            return;
        } else if (this.arguments.cmd) {
            util.showError("Not implemented.");
            return;
        }

        if (this.activeTextEditor.document.isUntitled) {
            throw error.VimError.fromCode(error.ErrorCode.E32);
        }

        fs.access(this.activeTextEditor.document.fileName, fs.W_OK, (accessErr) => {
            if (accessErr) {
                if (this.arguments.bang) {
                    fs.chmod(this.activeTextEditor.document.fileName, 666, (e) => {
                        if (e) {
                            modeHandler.setupStatusBarItem(e.message);
                        } else {
                            this.save(modeHandler);
                        }
                    });
                } else {
                    modeHandler.setupStatusBarItem(accessErr.message);
                }
            } else {
                this.save(modeHandler);
            }
        });
    }

    private save(modeHandler : ModeHandler) {
        this.activeTextEditor.document.save().then(
            (ok) => {
                modeHandler.setupStatusBarItem('"' + path.basename(this.activeTextEditor.document.fileName) +
                '" ' + this.activeTextEditor.document.lineCount + 'L ' +
                this.activeTextEditor.document.getText().length + 'C written');
            },
            (e) => modeHandler.setupStatusBarItem(e)
        );
    }
}
