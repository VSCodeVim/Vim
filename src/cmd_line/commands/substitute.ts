"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import { ModeHandler } from "../../mode/modeHandler";
import { TextEditor } from "../../textEditor";

export interface ISubstituteCommandArguments extends node.ICommandArgs {
    pattern?: string,
    replace?: string,
    flags?: number,
    count?: number
}

/**
 * The flags that you can use for the substitute commands:
 * [&] Must be the first one: Keep the flags from the previous substitute command.
 * [c] Confirm each substitution.
 * [e] When the search pattern fails, do not issue an error message and, in
 *     particular, continue in maps as if no error occurred.
 * [g] Replace all occurrences in the line.  Without this argument, replacement
 *     occurs only for the first occurrence in each line.
 * [i] Ignore case for the pattern.
 * [I] Don't ignore case for the pattern.
 * [n] Report the number of matches, do not actually substitute.
 * [p] Print the line containing the last substitute.
 * [#] Like [p] and prepend the line number.
 * [l] Like [p] but print the text like |:list|.
 * [r] When the search pattern is empty, use the previously used search pattern
 *     instead of the search pattern from the last substitute or ":global".
 */
export enum SubstituteFlags {
    None = 0,
    KeepPreviousFlags = 0x1,
    ConfirmEach = 0x2,
    SuppressError = 0x4,
    ReplaceAll = 0x8,
    IgnoreCase = 0x10,
    NoIgnoreCase = 0x20,
    PrintCount = 0x40,
    PrintLastMatchedLine = 0x80,
    PrintLastMatchedLineWithNumber = 0x100,
    PrintLastMatchedLineWithList = 0x200,
    UsePreviousPattern = 0x400
}

export class SubstituteCommand extends node.CommandBase {
    protected _arguments : ISubstituteCommandArguments;

    constructor(args : ISubstituteCommandArguments) {
        super();
        this._name = 'search';
        this._shortName = 's';
        this._arguments = args;
    }

    get arguments() : ISubstituteCommandArguments {
        return this._arguments;
    }

    execute() : void {
    }

    async executeWithRange(modeHandler : ModeHandler, range: node.LineRange) {
        let startLine = range.lineRefToPosition(vscode.window.activeTextEditor, range.left);
        let endLine = range.lineRefToPosition(vscode.window.activeTextEditor, range.right);

        if (this._arguments.count && this._arguments.count >= 0) {
            startLine = endLine;
            endLine = new vscode.Position(endLine.line + this._arguments.count - 1, 0);
        }

        // TODO: Global Setting.
        // TODO: There are differencies between Vim Regex and JS Regex. 

        let jsRegexFlags = "";
        let flags = this._arguments.flags;

        if (flags & SubstituteFlags.ReplaceAll) {
            jsRegexFlags += "g";
        }

        if (flags & SubstituteFlags.IgnoreCase) {
            jsRegexFlags += "i";
        }

        var regex = new RegExp(this._arguments.pattern, jsRegexFlags);
        for (let currentLine = startLine.line; currentLine <= endLine.line; currentLine++) {
            let originalContent = TextEditor.readLineAt(currentLine);
            let content = originalContent.replace(regex, this._arguments.replace);
            await TextEditor.replace(new vscode.Range(currentLine, 0, currentLine, originalContent.length), content);
        }
    }
}
