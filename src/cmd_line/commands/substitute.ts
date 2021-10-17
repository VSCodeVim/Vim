import * as vscode from 'vscode';
import { Jump } from '../../jumps/jump';
import { SearchState } from '../../state/searchState';
import { SubstituteState } from '../../state/substituteState';
import { VimError, ErrorCode } from '../../error';
import { VimState } from '../../state/vimState';
import { configuration } from '../../configuration/configuration';
import { decoration } from '../../configuration/decoration';
import { globalState } from '../../state/globalState';
import { Position } from 'vscode';
import { StatusBar } from '../../statusBar';
import { LineRange } from '../../vimscript/lineRange';
import { ExCommand } from '../../vimscript/exCommand';
import { Pattern, SearchDirection } from '../../vimscript/pattern';
import {
  alt,
  any,
  noneOf,
  oneOf,
  optWhitespace,
  Parser,
  regexp,
  seq,
  string,
  whitespace,
} from 'parsimmon';
import { numberParser } from '../../vimscript/parserUtils';

/**
 * NOTE: for "pattern", undefined is different from an empty string.
 * when it's undefined, it means to repeat the previous REPLACEMENT and ignore "replace".
 * when it's an empty string, it means to use the previous SEARCH (not replacement) state,
 * and replace with whatever's set by "replace" (even an empty string).
 */
export interface ISubstituteCommandArguments {
  pattern: Pattern | undefined;
  replace: string;
  flags: SubstituteFlags;
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
export interface SubstituteFlags {
  keepPreviousFlags?: true; // TODO: use this flag
  confirmEach?: true;
  suppressError?: true; // TODO: use this flag
  replaceAll?: true;
  ignoreCase?: true;
  noIgnoreCase?: true; // TODO: use this flag
  printCount?: true;
  // TODO: use the following flags:
  printLastMatchedLine?: true;
  printLastMatchedLineWithNumber?: true;
  printLastMatchedLineWithList?: true;
  usePreviousPattern?: true;
}

// TODO: `:help sub-replace-special`
// TODO: `:help sub-replace-expression`
const replaceStringParser = (delimiter: string): Parser<string> =>
  alt(
    string('\\').then(
      any.fallback(undefined).map((escaped) => {
        if (escaped === undefined || escaped === '\\') {
          return '\\';
        } else if (escaped === '/') {
          return '/';
        } else if (escaped === 'b') {
          return '\b';
        } else if (escaped === 'r') {
          return '\r';
        } else if (escaped === 'n') {
          return '\n';
        } else if (escaped === 't') {
          return '\t';
        } else if (/[&0-9]/.test(escaped)) {
          return `$${escaped}`;
        } else {
          return `\\${escaped}`;
        }
      })
    ),
    noneOf(delimiter)
  )
    .many()
    .map((chars) => chars.join(''));

const substituteFlagsParser: Parser<SubstituteFlags> = seq(
  string('&').fallback(undefined),
  oneOf('cegiInp#lr').many()
).map(([amp, flagChars]) => {
  const flags: SubstituteFlags = {};
  if (amp === '&') {
    flags.keepPreviousFlags = true;
  }
  for (const flag of flagChars) {
    switch (flag) {
      case 'c':
        flags.confirmEach = true;
        break;
      case 'e':
        flags.suppressError = true;
        break;
      case 'g':
        flags.replaceAll = true;
        break;
      case 'i':
        flags.ignoreCase = true;
        break;
      case 'I':
        flags.noIgnoreCase = true;
        break;
      case 'n':
        flags.printCount = true;
        break;
      case 'p':
        flags.printLastMatchedLine = true;
        break;
      case '#':
        flags.printLastMatchedLineWithNumber = true;
        break;
      case 'l':
        flags.printLastMatchedLineWithList = true;
        break;
      case 'r':
        flags.usePreviousPattern = true;
        break;
    }
  }
  return flags;
});

const countParser: Parser<number | undefined> = whitespace.then(numberParser).fallback(undefined);

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
export class SubstituteCommand extends ExCommand {
  public static readonly argParser: Parser<SubstituteCommand> = optWhitespace.then(
    alt(
      // :s[ubstitute]/{pattern}/{string}/[flags] [count]
      regexp(/[^\w\s\\|"]{1}/).chain((delimiter) =>
        seq(
          Pattern.parser({ direction: SearchDirection.Forward, delimiter }),
          replaceStringParser(delimiter),
          string(delimiter).then(substituteFlagsParser).fallback({}),
          countParser
        ).map(
          ([pattern, replace, flags, count]) =>
            new SubstituteCommand({ pattern, replace, flags, count })
        )
      ),

      // :s[ubstitute] [flags] [count]
      seq(substituteFlagsParser, countParser).map(
        ([flags, count]) =>
          new SubstituteCommand({
            pattern: undefined,
            replace: '',
            flags,
            count,
          })
      )
    )
  );

  public readonly arguments: ISubstituteCommandArguments;
  protected abort: boolean;
  constructor(args: ISubstituteCommandArguments) {
    super();
    this.arguments = args;
    this.abort = false;
  }

  public override neovimCapable(): boolean {
    // We need to use VSCode's quickpick capabilities to do confirmation
    return !this.arguments.flags.confirmEach;
  }

  private getRegex(args: ISubstituteCommandArguments, vimState: VimState): RegExp | undefined {
    let jsRegexFlags = '';
    if (configuration.gdefault || configuration.substituteGlobalFlag) {
      // the gdefault flag is on, then /g if on by default and /g negates that
      if (!args.flags.replaceAll) {
        jsRegexFlags += 'g';
      }
    } else {
      // the gdefault flag is off, then /g means replace all
      if (args.flags.replaceAll) {
        jsRegexFlags += 'g';
      }
    }

    if (args.flags.ignoreCase) {
      jsRegexFlags += 'i';
    }

    if (args.pattern === undefined) {
      // If no pattern is entered, use previous SUBSTITUTION state and don't update search state
      // i.e. :s
      const prevSubstituteState = globalState.substituteState;
      if (
        prevSubstituteState?.searchPattern === undefined ||
        prevSubstituteState.searchPattern.patternString === ''
      ) {
        throw VimError.fromCode(ErrorCode.NoPreviousSubstituteRegularExpression);
      } else {
        args.pattern = prevSubstituteState.searchPattern;
        args.replace = prevSubstituteState.replaceString;
      }
    } else {
      if (args.pattern.patternString === '') {
        // If an explicitly empty pattern is entered, use previous search state (including search with * and #) and update both states
        // e.g :s/ or :s///
        const prevSearchState = globalState.searchState;
        if (prevSearchState === undefined || prevSearchState.searchString === '') {
          throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
        } else {
          args.pattern = prevSearchState.pattern;
        }
      }
      globalState.substituteState = new SubstituteState(args.pattern, args.replace);
      globalState.searchState = new SearchState(
        SearchDirection.Forward,
        vimState.cursorStopPosition,
        args.pattern?.patternString,
        {},
        vimState.currentMode
      );
    }
    return args.pattern ? new RegExp(args.pattern.regex.source, jsRegexFlags) : undefined;
  }

  /**
   * @returns the number of substitutions made on the given line
   */
  async replaceTextAtLine(line: number, regex: RegExp, vimState: VimState): Promise<number> {
    const originalContent = vimState.document.lineAt(line).text;

    const matches = originalContent.match(regex);
    if (!matches) {
      return 0;
    }

    let count = 0;

    if (this.arguments.flags.printCount) {
      return matches.length;
    } else if (this.arguments.flags.confirmEach) {
      // Loop through each match on this line and get confirmation before replacing
      let newContent = originalContent;

      const nonGlobalRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
      let matchPos = 0;

      for (const match of matches) {
        if (this.abort) {
          break;
        }

        matchPos = newContent.indexOf(match, matchPos);

        if (
          await this.confirmReplacement(this.arguments.replace, line, vimState, match, matchPos)
        ) {
          count++;

          const rangeEnd = newContent.length;
          newContent =
            newContent.slice(0, matchPos) +
            newContent.slice(matchPos).replace(nonGlobalRegex, this.arguments.replace);

          vimState.recordedState.transformer.addTransformation({
            type: 'replaceText',
            text: newContent,
            range: new vscode.Range(new Position(line, 0), new Position(line, rangeEnd)),
            cursorIndex: 0,
          });

          globalState.jumpTracker.recordJump(
            new Jump({
              document: vimState.document,
              position: new Position(line, 0),
            }),
            Jump.fromStateNow(vimState)
          );
        }
        matchPos += this.arguments.replace.length;
      }
    } else {
      count = matches.length;

      const newContent = originalContent.replace(regex, this.arguments.replace);
      vimState.recordedState.transformer.addTransformation({
        type: 'replaceText',
        text: newContent,
        range: new vscode.Range(new Position(line, 0), new Position(line, originalContent.length)),
        // move cursor to BOL
        diff: new Position(line, 0).subtract(new Position(line, newContent.length)),
        cursorIndex: 0,
      });

      globalState.jumpTracker.recordJump(
        new Jump({
          document: vimState.document,
          position: new Position(line, 0),
        }),
        Jump.fromStateNow(vimState)
      );
    }

    return count;
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
      this.abort = true;
    } else if (selection === 'a') {
      this.arguments.flags.confirmEach = undefined;
    }

    return selection === 'y' || selection === 'a' || selection === 'l';
  }

  async execute(vimState: VimState): Promise<void> {
    const regex = this.getRegex(this.arguments, vimState);
    if (regex === undefined) {
      return;
    }

    const selection = vimState.editor.selection;
    const line = selection.start.isBefore(selection.end)
      ? selection.start.line
      : selection.end.line;

    if (!this.abort) {
      const substitutions = await this.replaceTextAtLine(line, regex, vimState);
      this.setStatusBarText(vimState, substitutions, 1, regex);
    }
  }

  override async executeWithRange(vimState: VimState, range: LineRange): Promise<void> {
    let { start, end } = range.resolve(vimState);

    if (this.arguments.count && this.arguments.count >= 0) {
      start = end;
      end = end + this.arguments.count - 1;
    }

    // TODO: Global Setting.
    // TODO: There are differencies between Vim Regex and JS Regex.
    const regex = this.getRegex(this.arguments, vimState);
    if (regex === undefined) {
      return;
    }

    let lines = 0;
    let substitutions = 0;
    for (
      let currentLine = start;
      currentLine <= end && currentLine < vimState.document.lineCount;
      currentLine++
    ) {
      if (this.abort) {
        break;
      }
      const count = await this.replaceTextAtLine(currentLine, regex, vimState);
      if (count > 0) {
        substitutions += count;
        lines++;
      }
    }

    this.setStatusBarText(vimState, substitutions, lines, regex);
  }

  private setStatusBarText(
    vimState: VimState,
    substitutions: number,
    lines: number,
    regex: RegExp
  ) {
    if (substitutions === 0) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.PatternNotFound, regex.source));
    } else if (this.arguments.flags.printCount) {
      StatusBar.setText(
        vimState,
        `${substitutions} match${substitutions > 1 ? 'es' : ''} on ${lines} line${
          lines > 1 ? 's' : ''
        }`
      );
    } else if (substitutions > configuration.report) {
      StatusBar.setText(
        vimState,
        `${substitutions} substitution${substitutions > 1 ? 's' : ''} on ${lines} line${
          lines > 1 ? 's' : ''
        }`
      );
    }
  }
}
