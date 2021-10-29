import { CancellationTokenSource, Position, Range, window } from 'vscode';
import { Jump } from '../../jumps/jump';
import { SearchState } from '../../state/searchState';
import { SubstituteState } from '../../state/substituteState';
import { VimError, ErrorCode } from '../../error';
import { VimState } from '../../state/vimState';
import { configuration } from '../../configuration/configuration';
import { decoration } from '../../configuration/decoration';
import { globalState } from '../../state/globalState';
import { StatusBar } from '../../statusBar';
import { Address, LineRange } from '../../vimscript/lineRange';
import { ExCommand } from '../../vimscript/exCommand';
import { Pattern, PatternMatch, SearchDirection } from '../../vimscript/pattern';
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
import { PositionDiff } from '../../common/motion/position';

type ReplaceStringComponent =
  | { type: 'string'; value: string }
  | { type: 'capture_group'; group: number };

export class ReplaceString {
  private components: ReplaceStringComponent[];
  constructor(components: ReplaceStringComponent[]) {
    this.components = components;
  }

  public resolve(matches: RegExpMatchArray): string {
    return this.components
      .map((component) => {
        if (component.type === 'string') {
          return component.value;
        } else if (component.type === 'capture_group') {
          return matches?.[component.group] ?? '';
        } else {
          const guard: unknown = component;
          return '';
        }
      })
      .join('');
  }
}

/**
 * NOTE: for "pattern", undefined is different from an empty string.
 * when it's undefined, it means to repeat the previous REPLACEMENT and ignore "replace".
 * when it's an empty string, it means to use the previous SEARCH (not replacement) state,
 * and replace with whatever's set by "replace" (even an empty string).
 */
export interface ISubstituteCommandArguments {
  pattern: Pattern | undefined;
  replace: ReplaceString;
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
  ignoreCase?: true; // TODO: use this flag
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
const replaceStringParser = (delimiter: string): Parser<ReplaceString> =>
  alt<ReplaceStringComponent>(
    string('\\').then(
      any.fallback(undefined).map((escaped) => {
        if (escaped === undefined || escaped === '\\') {
          return { type: 'string' as const, value: '\\' };
        } else if (escaped === '/') {
          return { type: 'string' as const, value: '/' };
        } else if (escaped === 'b') {
          return { type: 'string' as const, value: '\b' };
        } else if (escaped === 'r') {
          return { type: 'string' as const, value: '\r' };
        } else if (escaped === 'n') {
          return { type: 'string' as const, value: '\n' };
        } else if (escaped === 't') {
          return { type: 'string' as const, value: '\t' };
        } else if (escaped === '&') {
          return { type: 'capture_group' as const, group: 0 };
        } else if (/[0-9]/.test(escaped)) {
          return { type: 'capture_group' as const, group: Number.parseInt(escaped, 10) };
        } else {
          return { type: 'string' as const, value: `\\${escaped}` };
        }
      })
    ),
    noneOf(delimiter).map((value) => ({ type: 'string', value }))
  )
    .many()
    .map((components) => new ReplaceString(components));

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

const countParser: Parser<number | undefined> = optWhitespace
  .then(numberParser)
  .fallback(undefined);

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
            replace: new ReplaceString([]),
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

  /**
   * @returns If match, (# newlines added) - (# newlines removed)
   *          Else, undefined
   */
  private async replaceMatchRange(
    vimState: VimState,
    match: PatternMatch
  ): Promise<number | undefined> {
    if (this.arguments.flags.printCount) {
      return 0;
    }

    const replaceText = this.arguments.replace.resolve(match.groups);

    if (this.arguments.flags.confirmEach) {
      if (await this.confirmReplacement(vimState, match, replaceText)) {
        vimState.recordedState.transformer.replace(match.range, replaceText);
      } else {
        return undefined;
      }
    } else {
      vimState.recordedState.transformer.replace(match.range, replaceText);
    }

    const addedNewlines = replaceText.split('\n').length - 1;
    const removedNewlines = match.groups[0].split('\n').length - 1;
    return addedNewlines - removedNewlines;
  }

  private async confirmReplacement(
    vimState: VimState,
    match: PatternMatch,
    replaceText: string
  ): Promise<boolean> {
    const cancellationToken = new CancellationTokenSource();
    const validSelections: readonly string[] = ['y', 'n', 'a', 'q', 'l'];
    let selection: string = '';

    vimState.editor.revealRange(new Range(match.range.start.line, 0, match.range.start.line, 0));
    vimState.editor.setDecorations(decoration.searchHighlight, [match.range]);

    const prompt = `Replace with ${replaceText} (${validSelections.join('/')})?`;
    await window.showInputBox(
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
    await this.executeWithRange(vimState, new LineRange(new Address({ type: 'current_line' })));
  }

  override async executeWithRange(vimState: VimState, lineRange: LineRange): Promise<void> {
    let { start, end } = lineRange.resolve(vimState);

    if (this.arguments.count && this.arguments.count >= 0) {
      start = end;
      end = end + this.arguments.count - 1;
    }

    if (this.arguments.pattern === undefined) {
      // If no pattern is entered, use previous SUBSTITUTION state and don't update search state
      // i.e. :s
      const prevSubstituteState = globalState.substituteState;
      if (
        prevSubstituteState?.searchPattern === undefined ||
        prevSubstituteState.searchPattern.patternString === ''
      ) {
        throw VimError.fromCode(ErrorCode.NoPreviousSubstituteRegularExpression);
      } else {
        this.arguments.pattern = prevSubstituteState.searchPattern;
        this.arguments.replace = prevSubstituteState.replaceString;
      }
    } else {
      if (this.arguments.pattern.patternString === '') {
        // If an explicitly empty pattern is entered, use previous search state (including search with * and #) and update both states
        // e.g :s/ or :s///
        const prevSearchState = globalState.searchState;
        if (prevSearchState === undefined || prevSearchState.searchString === '') {
          throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
        } else {
          this.arguments.pattern = prevSearchState.pattern;
        }
      }
      globalState.substituteState = new SubstituteState(
        this.arguments.pattern,
        this.arguments.replace
      );
      globalState.searchState = new SearchState(
        SearchDirection.Forward,
        vimState.cursorStopPosition,
        this.arguments.pattern?.patternString,
        {}
      );
    }

    // `/g` flag inverts the default behavior (from `gdefault`)
    const global =
      (configuration.gdefault || configuration.substituteGlobalFlag) !==
      (this.arguments.flags.replaceAll ?? false);

    const matches =
      this.arguments.pattern?.allMatches(vimState, {
        // TODO: This method should probably take start/end lines as numbers
        lineRange: new LineRange(
          new Address({ type: 'number', num: start + 1 }),
          ',',
          new Address({ type: 'number', num: end + 1 })
        ),
      }) ?? [];

    const lines = new Set<number>();
    let substitutions = 0;
    let netNewLines = 0;
    for (const match of matches) {
      if (this.abort) {
        break;
      }

      if (!global && lines.has(match.range.start.line)) {
        // If not global, only replace one match per line
        continue;
      }

      const newLines = await this.replaceMatchRange(vimState, match);
      if (newLines !== undefined) {
        substitutions++;
        lines.add(match.range.start.line);
        netNewLines += newLines;
      }
    }

    const cursor = new Position(Math.max(...lines.values()) + netNewLines, 0);
    globalState.jumpTracker.recordJump(
      new Jump({
        document: vimState.document,
        position: cursor,
      }),
      Jump.fromStateNow(vimState)
    );
    vimState.recordedState.transformer.addTransformation({
      type: 'moveCursor',
      diff: PositionDiff.exactPosition(cursor),
      cursorIndex: 0,
    });

    this.setStatusBarText(vimState, substitutions, lines.size);
  }

  private setStatusBarText(vimState: VimState, substitutions: number, lines: number) {
    if (substitutions === 0) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.PatternNotFound, this.arguments.pattern?.patternString)
      );
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
