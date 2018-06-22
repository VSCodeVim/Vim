/* tslint:disable:no-bitwise */

import * as vscode from 'vscode';
import * as node from '../node';
import * as token from '../token';
import { VimState } from '../../state/vimState';
import { VimError, ErrorCode } from '../../error';
import { TextEditor } from '../../textEditor';
import { configuration } from '../../configuration/configuration';
import { Decoration } from '../../configuration/decoration';

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
  UsePreviousPattern = 0x400,
}

export class SubstituteCommand extends node.CommandBase {
  neovimCapable = true;
  protected _arguments: ISubstituteCommandArguments;
  protected _abort: boolean;
  constructor(args: ISubstituteCommandArguments) {
    super();
    this._name = 'search';
    this._arguments = args;
    this._abort = false;
  }

  get arguments(): ISubstituteCommandArguments {
    return this._arguments;
  }

  getRegex(args: ISubstituteCommandArguments, vimState: VimState) {
    let jsRegexFlags = '';

    if (configuration.substituteGlobalFlag === true) {
      // the gdefault flag is on, then /g if on by default and /g negates that
      if (!(args.flags & SubstituteFlags.ReplaceAll)) {
        jsRegexFlags += 'g';
      }
    } else {
      // the gdefault flag is off, then /g means replace all
      if (args.flags & SubstituteFlags.ReplaceAll) {
        jsRegexFlags += 'g';
      }
    }

    if (args.flags & SubstituteFlags.IgnoreCase) {
      jsRegexFlags += 'i';
    }

    // If no pattern is entered, use previous search state (including search with * and #)
    if (args.pattern === '') {
      const prevSearchState = vimState.globalState.searchState;
      if (prevSearchState === undefined || prevSearchState.searchString === '') {
        throw VimError.fromCode(ErrorCode.E35);
      } else {
        args.pattern = prevSearchState.searchString;
      }
    }
    return new RegExp(args.pattern, jsRegexFlags);
  }

  async replaceTextAtLine(line: number, regex: RegExp, vimState: VimState) {
    const originalContent = TextEditor.readLineAt(line);

    if (!regex.test(originalContent)) {
      return;
    }

    if (this._arguments.flags & SubstituteFlags.ConfirmEach) {
      // Loop through each match on this line and get confirmation before replacing
      let newContent = originalContent;
      const matches = newContent.match(regex)!;

      var nonGlobalRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
      let matchPos = 0;

      for (const match of matches) {
        if (this._abort) {
          break;
        }

        matchPos = newContent.indexOf(match, matchPos);

        if (
          !(this._arguments.flags & SubstituteFlags.ConfirmEach) ||
          (await this.confirmReplacement(regex.source, line, vimState, match, matchPos))
        ) {
          newContent = newContent.replace(nonGlobalRegex, this._arguments.replace);
          await TextEditor.replace(new vscode.Range(line, 0, line, newContent.length), newContent);
        }
        matchPos += match.length;
      }
    } else {
      await TextEditor.replace(
        new vscode.Range(line, 0, line, originalContent.length),
        originalContent.replace(regex, this._arguments.replace)
      );
    }
  }

  async confirmReplacement(
    replacement: string,
    line: number,
    vimState: VimState,
    match: string,
    matchIndex: number
  ): Promise<boolean> {
    const cancellationToken = new vscode.CancellationTokenSource();
    let validSelections: string[] = ['y', 'n', 'a', 'q', 'l'];
    let selection: string = '';

    const searchRanges: vscode.Range[] = [
      new vscode.Range(line, matchIndex, line, matchIndex + match.length),
    ];

    vimState.editor.revealRange(new vscode.Range(line, 0, line, 0));
    vimState.editor.setDecorations(Decoration.SearchHighlight, searchRanges);

    const prompt = `Replace with ${replacement} (${validSelections.join('/')})?`;
    await vscode.window.showInputBox(
      {
        ignoreFocusOut: true,
        prompt,
        placeHolder: validSelections.join('/'),
        validateInput: (input: string): string => {
          if (validSelections.indexOf(input) >= 0) {
            selection = input;
            cancellationToken.cancel();
          }
          return prompt;
        },
      },
      cancellationToken.token
    );

    if (selection === 'q' || selection === 'l' || !selection) {
      this._abort = true;
    } else if (selection === 'a') {
      this._arguments.flags = this._arguments.flags & ~SubstituteFlags.ConfirmEach;
    }

    return selection === 'y' || selection === 'a' || selection === 'l';
  }

  async execute(vimState: VimState): Promise<void> {
    const regex = this.getRegex(this._arguments, vimState);
    const selection = vimState.editor.selection;
    const line = selection.start.isBefore(selection.end)
      ? selection.start.line
      : selection.end.line;

    if (!this._abort) {
      await this.replaceTextAtLine(line, regex, vimState);
    }
  }

  async executeWithRange(vimState: VimState, range: node.LineRange) {
    let startLine: vscode.Position;
    let endLine: vscode.Position;

    if (range.left[0].type === token.TokenType.Percent) {
      startLine = new vscode.Position(0, 0);
      endLine = new vscode.Position(TextEditor.getLineCount() - 1, 0);
    } else {
      startLine = range.lineRefToPosition(vimState.editor, range.left, vimState);
      endLine = range.lineRefToPosition(vimState.editor, range.right, vimState);
    }

    if (this._arguments.count && this._arguments.count >= 0) {
      startLine = endLine;
      endLine = new vscode.Position(endLine.line + this._arguments.count - 1, 0);
    }

    // TODO: Global Setting.
    // TODO: There are differencies between Vim Regex and JS Regex.
    let regex = this.getRegex(this._arguments, vimState);
    for (
      let currentLine = startLine.line;
      currentLine <= endLine.line && currentLine < TextEditor.getLineCount();
      currentLine++
    ) {
      if (this._abort) {
        break;
      }
      await this.replaceTextAtLine(currentLine, regex, vimState);
    }
  }
}
