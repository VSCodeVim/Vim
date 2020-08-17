/* tslint:disable:no-bitwise */

import * as vscode from 'vscode';
import * as node from '../node';
import * as token from '../token';
import { Jump } from '../../jumps/jump';
import { Position } from '../../common/motion/position';
import { SearchState, SearchDirection } from '../../state/searchState';
import { SubstituteState } from '../../state/substituteState';
import { TextEditor } from '../../textEditor';
import { VimError, ErrorCode } from '../../error';
import { VimState } from '../../state/vimState';
import { configuration } from '../../configuration/configuration';
import { decoration } from '../../configuration/decoration';
import { globalState } from '../../state/globalState';

/**
 * NOTE: for "pattern", undefined is different from an empty string.
 * when it's undefined, it means to repeat the previous REPLACEMENT and ignore "replace".
 * when it's an empty string, it means to use the previous SEARCH (not replacement) state,
 * and replace with whatever's set by "replace" (even an empty string).
 */
export interface ISubstituteCommandArguments extends node.ICommandArgs {
  pattern: string | undefined;
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

/**
 * vim has a distinctly different state for previous search and for previous substitute.  However, in SOME
 * cases a substitution will also update the search state along with the substitute state.
 *
 * Also, the substitute command itself will sometimes use the search state, and other times it will use the
 * substitute state.
 *
 * These are the following cases and how vim handles them:
 * 1. :s/this/that
 *   - standard search/replace
 *   - update substitution state
 *   - update search state too!
 * 2. :s or :s [flags]
 *   - use previous SUBSTITUTION state, and repeat previous substitution pattern and replace.
 *   - do not touch search state!
 *   - changing substitution state is dont-care cause we're repeating it ;)
 * 3. :s/ or :s// or :s///
 *   - use previous SEARCH state (not substitution), and DELETE the string matching the pattern (replace with nothing)
 *   - update substitution state
 *   - updating search state is dont-care cause we're repeating it ;)
 * 4. :s/this or :s/this/ or :s/this//
 *   - input is pattern - replacement is empty (delete)
 *   - update replacement state
 *   - update search state too!
 */
export class SubstituteCommand extends node.CommandBase {
  protected _arguments: ISubstituteCommandArguments;
  protected _abort: boolean;
  constructor(args: ISubstituteCommandArguments) {
    super();
    this._arguments = args;
    this._abort = false;
  }

  get arguments(): ISubstituteCommandArguments {
    return this._arguments;
  }

  public neovimCapable(): boolean {
    // We need to use VSCode's quickpick capabilities to do confirmation
    return (this._arguments.flags & SubstituteFlags.ConfirmEach) === 0;
  }

  getRegex(args: ISubstituteCommandArguments, vimState: VimState) {
    let jsRegexFlags = '';

    if (configuration.gdefault || configuration.substituteGlobalFlag) {
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

    if (args.pattern === undefined) {
      // If no pattern is entered, use previous SUBSTITUTION state and don't update search state
      // i.e. :s
      const prevSubstituteState = globalState.substituteState;
      if (prevSubstituteState === undefined || prevSubstituteState.searchPattern === '') {
        throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
      } else {
        args.pattern = prevSubstituteState.searchPattern;
        args.replace = prevSubstituteState.replaceString;
      }
    } else {
      if (args.pattern === '') {
        // If an explicitly empty pattern is entered, use previous search state (including search with * and #) and update both states
        // e.g :s/ or :s///
        const prevSearchState = globalState.searchState;
        if (prevSearchState === undefined || prevSearchState.searchString === '') {
          throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
        } else {
          args.pattern = prevSearchState.searchString;
        }
      }
      globalState.substituteState = new SubstituteState(args.pattern, args.replace);
      globalState.searchState = new SearchState(
        SearchDirection.Forward,
        vimState.cursorStopPosition,
        args.pattern,
        { isRegex: true },
        vimState.currentMode
      );
    }
    return new RegExp(args.pattern, jsRegexFlags);
  }

  /**
   * @returns whether the search pattern existed on the line
   */
  async replaceTextAtLine(line: number, regex: RegExp, vimState: VimState): Promise<boolean> {
    const originalContent = TextEditor.readLineAt(line);

    if (!regex.test(originalContent)) {
      return false;
    }

    if (this._arguments.flags & SubstituteFlags.ConfirmEach) {
      // Loop through each match on this line and get confirmation before replacing
      let newContent = originalContent;
      const matches = newContent.match(regex)!;

      const nonGlobalRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
      let matchPos = 0;

      for (const match of matches) {
        if (this._abort) {
          break;
        }

        matchPos = newContent.indexOf(match, matchPos);

        if (
          !(this._arguments.flags & SubstituteFlags.ConfirmEach) ||
          (await this.confirmReplacement(this._arguments.replace, line, vimState, match, matchPos))
        ) {
          const rangeEnd = newContent.length;
          newContent =
            newContent.slice(0, matchPos) +
            newContent.slice(matchPos).replace(nonGlobalRegex, this._arguments.replace);
          await TextEditor.replace(new vscode.Range(line, 0, line, rangeEnd), newContent);

          globalState.jumpTracker.recordJump(
            new Jump({
              editor: vimState.editor,
              fileName: vimState.editor.document.fileName,
              position: new Position(line, 0),
            }),
            Jump.fromStateNow(vimState)
          );
        }
        matchPos += this._arguments.replace.length;
      }
    } else {
      await TextEditor.replace(
        new vscode.Range(line, 0, line, originalContent.length),
        originalContent.replace(regex, this._arguments.replace)
      );

      globalState.jumpTracker.recordJump(
        new Jump({
          editor: vimState.editor,
          fileName: vimState.editor.document.fileName,
          position: new Position(line, 0),
        }),
        Jump.fromStateNow(vimState)
      );
    }

    return true;
  }

  async confirmReplacement(
    replacement: string,
    line: number,
    vimState: VimState,
    match: string,
    matchIndex: number
  ): Promise<boolean> {
    const cancellationToken = new vscode.CancellationTokenSource();
    const validSelections: string[] = ['y', 'n', 'a', 'q', 'l'];
    let selection: string = '';

    const searchRanges: vscode.Range[] = [
      new vscode.Range(line, matchIndex, line, matchIndex + match.length),
    ];

    vimState.editor.revealRange(new vscode.Range(line, 0, line, 0));
    vimState.editor.setDecorations(decoration.searchHighlight, searchRanges);

    const prompt = `Replace with ${replacement} (${validSelections.join('/')})?`;
    await vscode.window.showInputBox(
      {
        ignoreFocusOut: true,
        prompt,
        placeHolder: validSelections.join('/'),
        validateInput: (input: string): string => {
          if (validSelections.includes(input)) {
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
      const foundPattern = await this.replaceTextAtLine(line, regex, vimState);
      if (!foundPattern) {
        throw VimError.fromCode(ErrorCode.PatternNotFound);
      }
    }
  }

  async executeWithRange(vimState: VimState, range: node.LineRange): Promise<void> {
    let [startLine, endLine] = range.resolve(vimState);

    if (this._arguments.count && this._arguments.count >= 0) {
      startLine = endLine;
      endLine = endLine + this._arguments.count - 1;
    }

    // TODO: Global Setting.
    // TODO: There are differencies between Vim Regex and JS Regex.
    let regex = this.getRegex(this._arguments, vimState);
    let foundPattern = false;
    for (
      let currentLine = startLine;
      currentLine <= endLine && currentLine < TextEditor.getLineCount();
      currentLine++
    ) {
      if (this._abort) {
        break;
      }
      foundPattern = (await this.replaceTextAtLine(currentLine, regex, vimState)) || foundPattern;
    }
    if (!foundPattern) {
      throw VimError.fromCode(ErrorCode.PatternNotFound);
    }
  }
}
