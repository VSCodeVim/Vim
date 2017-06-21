/* tslint:disable:no-bitwise */
"use strict";

import * as vscode from "vscode";
import * as node from "../node";
import * as token from '../token';
import { ModeHandler } from "../../mode/modeHandler";
import { TextEditor } from "../../textEditor";

export interface ISubstituteCommandArguments extends node.ICommandArgs {
  pattern: string;
  replace: string;
  flags: number;
  count?: number;
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
  neovimCapable = true;
  protected _arguments : ISubstituteCommandArguments;

  constructor(args : ISubstituteCommandArguments) {
    super();
    this._name = 'search';
    this._arguments = args;
  }

  get arguments() : ISubstituteCommandArguments {
    return this._arguments;
  }

  getRegex(args: ISubstituteCommandArguments, modeHandler: ModeHandler) {
    let jsRegexFlags = "";

    if (args.flags & SubstituteFlags.ReplaceAll) {
      jsRegexFlags += "g";
    }

    if (args.flags & SubstituteFlags.IgnoreCase) {
      jsRegexFlags += "i";
    }

    // If no pattern is entered, use previous search state
    if (args.pattern === "") {
      const prevSearchState = modeHandler.vimState.globalState.searchStatePrevious;
      if (prevSearchState) {
        const prevSearchString = prevSearchState[prevSearchState.length - 1].searchString;
        args.pattern = prevSearchString;
      }
    }

    return new RegExp(args.pattern, jsRegexFlags);
  }

  async replaceTextAtLine(line: number, regex: RegExp) {
    const originalContent = TextEditor.readLineAt(line);
    const newContent = originalContent.replace(regex, this._arguments.replace);

    if (originalContent !== newContent) {
      await TextEditor.replace(new vscode.Range(line, 0, line, originalContent.length), newContent);
    }
  }

  async execute(modeHandler : ModeHandler): Promise<void> {
    const regex = this.getRegex(this._arguments, modeHandler);
    const selection = modeHandler.vimState.editor.selection;
    const line = selection.start.isBefore(selection.end) ? selection.start.line : selection.end.line;

    await this.replaceTextAtLine(line, regex);
  }

  async executeWithRange(modeHandler : ModeHandler, range: node.LineRange) {
    let startLine: vscode.Position;
    let endLine: vscode.Position;

    if (range.left[0].type === token.TokenType.Percent) {
      startLine = new vscode.Position(0, 0);
      endLine = new vscode.Position(TextEditor.getLineCount() - 1, 0);
    } else {
      startLine = range.lineRefToPosition(modeHandler.vimState.editor, range.left, modeHandler);
      endLine = range.lineRefToPosition(modeHandler.vimState.editor, range.right, modeHandler);
    }

    if (this._arguments.count && this._arguments.count >= 0) {
      startLine = endLine;
      endLine = new vscode.Position(endLine.line + this._arguments.count - 1, 0);
    }

    // TODO: Global Setting.
    // TODO: There are differencies between Vim Regex and JS Regex.

    let regex = this.getRegex(this._arguments, modeHandler);
    for (let currentLine = startLine.line; currentLine <= endLine.line && currentLine < TextEditor.getLineCount(); currentLine++) {
      await this.replaceTextAtLine(currentLine, regex);
    }
  }
}
