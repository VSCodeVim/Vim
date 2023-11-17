import { CancellationTokenSource, DecorationOptions, Position, Range, window } from 'vscode';
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
import { alt, any, noneOf, oneOf, optWhitespace, Parser, regexp, seq, string } from 'parsimmon';
import { numberParser } from '../../vimscript/parserUtils';
import { PositionDiff } from '../../common/motion/position';
import { escapeCSSIcons } from '../../util/statusBarTextUtils';
import { SearchDecorations, ensureVisible, formatDecorationText } from '../../util/decorationUtils';

type ReplaceStringComponent =
  | { type: 'string'; value: string }
  | { type: 'capture_group'; group: number | '&' }
  | { type: 'prev_replace_string' }
  | { type: 'change_case'; case: 'upper' | 'lower'; duration: 'char' | 'until_end' }
  | { type: 'change_case_end' };

export class ReplaceString {
  private components: ReplaceStringComponent[];
  constructor(components: ReplaceStringComponent[]) {
    this.components = components;
  }

  public toString(): string {
    return this.components
      .map((component) => {
        if (component.type === 'string') {
          return component.value;
        } else if (component.type === 'capture_group') {
          return component.group === '&' ? '&' : `\\${component.group}`;
        } else if (component.type === 'prev_replace_string') {
          return '~';
        } else if (component.type === 'change_case') {
          if (component.case === 'upper') {
            return component.duration === 'char' ? '\\u' : '\\U';
          } else {
            return component.duration === 'char' ? '\\l' : '\\L';
          }
        } else if (component.type === 'change_case_end') {
          return '\\E';
        } else {
          const guard: never = component;
          return '';
        }
      })
      .join('');
  }

  public resolve(matches: string[]): string {
    let result = '';
    let changeCase: 'upper' | 'lower' | undefined;
    let changeCaseChar: 'upper' | 'lower' | undefined;
    for (const component of this.components) {
      let newChangeCaseChar: 'upper' | 'lower' | undefined;
      let _result: string = '';
      if (component.type === 'string') {
        _result = component.value;
      } else if (component.type === 'capture_group') {
        const group: number = component.group === '&' ? 0 : component.group;
        _result = matches[group] ?? '';
      } else if (component.type === 'prev_replace_string') {
        _result = globalState.substituteState?.replaceString.toString() ?? '';
      } else if (component.type === 'change_case') {
        if (component.duration === 'until_end') {
          changeCase = component.case;
        } else {
          newChangeCaseChar = component.case;
        }
      } else if (component.type === 'change_case_end') {
        changeCase = undefined;
      } else {
        const guard: never = component;
      }

      if (_result) {
        if (changeCase) {
          _result =
            changeCase === 'upper' ? _result.toLocaleUpperCase() : _result.toLocaleLowerCase();
        }
        if (changeCaseChar) {
          _result =
            (changeCaseChar === 'upper'
              ? _result[0].toLocaleUpperCase()
              : _result[0].toLocaleLowerCase()) + _result.slice(1);
        }
        result += _result;
      }

      changeCaseChar = newChangeCaseChar;
    }
    return result;
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
      any.fallback(undefined).map<ReplaceStringComponent>((escaped) => {
        if (escaped === undefined || escaped === '\\') {
          return { type: 'string', value: '\\' };
        } else if (escaped === '/') {
          return { type: 'string', value: '/' };
        } else if (escaped === 'b') {
          return { type: 'string', value: '\b' };
        } else if (escaped === 'r') {
          return { type: 'string', value: '\r' };
        } else if (escaped === 'n') {
          return { type: 'string', value: '\n' };
        } else if (escaped === 't') {
          return { type: 'string', value: '\t' };
        } else if (escaped === '&') {
          return { type: 'string', value: '&' };
        } else if (escaped === '~') {
          return { type: 'string', value: '~' };
        } else if (/[0-9]/.test(escaped)) {
          return { type: 'capture_group', group: Number.parseInt(escaped, 10) };
        } else if (escaped === 'u') {
          return { type: 'change_case', case: 'upper', duration: 'char' };
        } else if (escaped === 'l') {
          return { type: 'change_case', case: 'lower', duration: 'char' };
        } else if (escaped === 'U') {
          return { type: 'change_case', case: 'upper', duration: 'until_end' };
        } else if (escaped === 'L') {
          return { type: 'change_case', case: 'lower', duration: 'until_end' };
        } else if (escaped === 'e' || escaped === 'E') {
          return { type: 'change_case_end' };
        } else {
          return { type: 'string', value: `\\${escaped}` };
        }
      }),
    ),
    string('&').result({ type: 'capture_group', group: '&' }),
    string('~').result({ type: 'prev_replace_string' }),
    noneOf(delimiter).map((value) => ({ type: 'string', value })),
  )
    .many()
    .map((components) => new ReplaceString(components));

const substituteFlagsParser: Parser<SubstituteFlags> = seq(
  string('&').fallback(undefined),
  oneOf('cegiInp#lr').many(),
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
          countParser,
        ).map(
          ([pattern, replace, flags, count]) =>
            new SubstituteCommand({ pattern, replace, flags, count }),
        ),
      ),

      // :s[ubstitute] [flags] [count]
      seq(substituteFlagsParser, countParser).map(
        ([flags, count]) =>
          new SubstituteCommand({
            pattern: undefined,
            replace: new ReplaceString([]),
            flags,
            count,
          }),
      ),
    ),
  );

  public readonly arguments: ISubstituteCommandArguments;
  protected abort: boolean;
  private cSearchHighlights?: DecorationOptions[];
  private confirmedSubstitutions?: DecorationOptions[];
  constructor(args: ISubstituteCommandArguments) {
    super();
    this.arguments = args;
    this.abort = false;
  }

  public override neovimCapable(): boolean {
    // We need to use VSCode's quickpick capabilities to do confirmation
    return !this.arguments.flags.confirmEach;
  }

  public getSubstitutionDecorations(
    vimState: VimState,
    lineRange = new LineRange(new Address({ type: 'current_line' })),
  ): SearchDecorations {
    const substitutionAppend: DecorationOptions[] = [];
    const substitutionReplace: DecorationOptions[] = [];
    const searchHighlight: DecorationOptions[] = [];

    const subsArr: DecorationOptions[] =
      configuration.inccommand === 'replace' ? substitutionReplace : substitutionAppend;

    const { pattern, replace } = this.resolvePatterns(false);

    const showReplacements = this.arguments.pattern?.closed && configuration.inccommand;

    let matches: PatternMatch[] = [];
    if (pattern?.patternString) {
      matches = pattern.allMatches(vimState, { lineRange });
    }

    const global =
      (configuration.gdefault || configuration.substituteGlobalFlag) !==
      (this.arguments.flags.replaceAll ?? false);
    const lines = new Set<number>();

    for (const match of matches) {
      if (!global && lines.has(match.range.start.line)) {
        // If not global, only replace one match per line
        continue;
      }

      lines.add(match.range.start.line);
      if (showReplacements) {
        const contentText = formatDecorationText(
          replace.resolve(match.groups),
          vimState.editor.options.tabSize as number,
        );

        subsArr.push({
          range: match.range,
          renderOptions: {
            [configuration.inccommand === 'append' ? 'after' : 'before']: { contentText },
          },
        });
      } else {
        searchHighlight.push(ensureVisible(match.range));
      }
    }
    return { substitutionAppend, substitutionReplace, searchHighlight };
  }

  /**
   * @returns If match, (# newlines added) - (# newlines removed)
   *          Else, undefined
   */
  private async replaceMatchRange(
    vimState: VimState,
    match: PatternMatch,
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
    replaceText: string,
  ): Promise<boolean> {
    const cancellationToken = new CancellationTokenSource();
    const validSelections: readonly string[] = ['y', 'n', 'a', 'q', 'l'];
    let selection: string = '';
    const prompt = escapeCSSIcons(
      `Replace with ${formatDecorationText(
        replaceText,
        vimState.editor.options.tabSize as number,
        '\\n',
      )} (${validSelections.join('/')})?`,
    );

    const newConfirmationSearchHighlights =
      this.cSearchHighlights?.filter((d) => !d.range.isEqual(match.range)) ?? [];

    vimState.editor.revealRange(new Range(match.range.start.line, 0, match.range.start.line, 0));
    vimState.editor.setDecorations(decoration.searchHighlight, newConfirmationSearchHighlights);
    vimState.editor.setDecorations(decoration.searchMatch, [ensureVisible(match.range)]);
    vimState.editor.setDecorations(
      decoration.confirmedSubstitution,
      this.confirmedSubstitutions ?? [],
    );
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
      cancellationToken.token,
    );

    if (selection === 'q' || selection === 'l' || !selection) {
      this.abort = true;
    } else if (selection === 'a') {
      this.arguments.flags.confirmEach = undefined;
    }

    if (selection === 'y' || selection === 'a' || selection === 'l') {
      if (this.cSearchHighlights) {
        this.cSearchHighlights = newConfirmationSearchHighlights;
      }

      this.confirmedSubstitutions?.push({
        range: match.range,
        renderOptions: {
          before: {
            contentText: formatDecorationText(
              replaceText,
              vimState.editor.options.tabSize as number,
            ),
          },
        },
      });
      return true;
    }
    return false;
  }

  /**
   * @returns the concrete Pattern and ReplaceString to be used for this substitution.
   * If throwErrors is true, errors will be thrown :)
   */
  private resolvePatterns(throwErrors: boolean): {
    pattern: Pattern | undefined;
    replace: ReplaceString;
  } {
    let { pattern, replace } = this.arguments;
    if (pattern === undefined) {
      // If no pattern is entered, use previous SUBSTITUTION state and don't update search state
      // i.e. :s
      const prevSubstituteState = globalState.substituteState;
      if (
        prevSubstituteState?.searchPattern === undefined ||
        prevSubstituteState.searchPattern.patternString === ''
      ) {
        if (throwErrors) {
          throw VimError.fromCode(ErrorCode.NoPreviousSubstituteRegularExpression);
        }
      } else {
        pattern = prevSubstituteState.searchPattern;
        replace = prevSubstituteState.replaceString;
      }
    } else {
      if (pattern.patternString === '') {
        // If an explicitly empty pattern is entered, use previous search state (including search with * and #) and update both states
        // e.g :s/ or :s///
        const prevSearchState = globalState.searchState;
        if (prevSearchState === undefined || prevSearchState.searchString === '') {
          if (throwErrors) {
            throw VimError.fromCode(ErrorCode.NoPreviousRegularExpression);
          }
        } else {
          pattern = prevSearchState.pattern;
        }
      }
    }
    return { pattern, replace };
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

    // TODO: this is all a bit gross
    const { pattern, replace } = this.resolvePatterns(true);
    this.arguments.replace = replace;

    // `/g` flag inverts the default behavior (from `gdefault`)
    const global =
      (configuration.gdefault || configuration.substituteGlobalFlag) !==
      (this.arguments.flags.replaceAll ?? false);

    // TODO: `allMatches` lies for patterns with empty branches, which makes this wrong (not that anyone cares)
    const allMatches =
      pattern?.allMatches(vimState, {
        // TODO: This method should probably take start/end lines as numbers
        lineRange: new LineRange(
          new Address({ type: 'number', num: start + 1 }),
          ',',
          new Address({ type: 'number', num: end + 1 }),
        ),
      }) ?? [];

    let replaceableMatches;
    if (global) {
      // every match is replaceable
      replaceableMatches = allMatches;
    } else {
      // only the first match on a line is replaceable
      const replaceableLines = new Set<number>();
      replaceableMatches = allMatches.filter((match) => {
        if (replaceableLines.has(match.range.start.line)) {
          return false;
        }
        replaceableLines.add(match.range.start.line);
        return true;
      });
    }

    if (this.arguments.flags.confirmEach) {
      vimState.editor.setDecorations(decoration.substitutionAppend, []);
      vimState.editor.setDecorations(decoration.substitutionReplace, []);

      if (configuration.inccommand) {
        this.confirmedSubstitutions = [];
      }
      if (configuration.incsearch) {
        this.cSearchHighlights = replaceableMatches.map((match) => ensureVisible(match.range));
      }
    }

    const substitutionLines = new Set<number>();
    let substitutions = 0;
    let netNewLines = 0;

    for (const match of replaceableMatches) {
      if (this.abort) {
        break;
      }

      const newLines = await this.replaceMatchRange(vimState, match);
      if (newLines !== undefined) {
        substitutions++;
        substitutionLines.add(match.range.start.line);
        netNewLines += newLines;
      }
    }

    if (substitutions > 0) {
      // if any substitutions were made, jump to latest one
      const lastLine = Math.max(...substitutionLines.values()) + netNewLines;
      const cursor = new Position(Math.max(0, lastLine), 0);
      globalState.jumpTracker.recordJump(
        new Jump({
          document: vimState.document,
          position: cursor,
        }),
        Jump.fromStateNow(vimState),
      );
      vimState.recordedState.transformer.moveCursor(PositionDiff.exactPosition(cursor), 0);
    }

    this.confirmedSubstitutions = undefined;
    this.cSearchHighlights = undefined;
    vimState.editor.setDecorations(decoration.confirmedSubstitution, []);

    this.setStatusBarText(vimState, substitutions, substitutionLines.size);

    if (this.arguments.pattern !== undefined) {
      globalState.substituteState = new SubstituteState(pattern, replace);
      globalState.searchState = new SearchState(
        SearchDirection.Forward,
        vimState.cursorStopPosition,
        pattern?.patternString,
        {},
      );
    }
  }

  private setStatusBarText(vimState: VimState, substitutions: number, lines: number) {
    if (substitutions === 0) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.PatternNotFound, this.arguments.pattern?.patternString),
      );
    } else if (this.arguments.flags.printCount) {
      StatusBar.setText(
        vimState,
        `${substitutions} match${substitutions > 1 ? 'es' : ''} on ${lines} line${
          lines > 1 ? 's' : ''
        }`,
      );
    } else if (substitutions > configuration.report) {
      StatusBar.setText(
        vimState,
        `${substitutions} substitution${substitutions > 1 ? 's' : ''} on ${lines} line${
          lines > 1 ? 's' : ''
        }`,
      );
    }
  }
}
