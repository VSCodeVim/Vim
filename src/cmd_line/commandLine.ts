import { Parser } from 'parsimmon';
import { ExtensionContext, Position, window } from 'vscode';
import { configuration } from '../configuration/configuration';
import { ErrorCode, VimError } from '../error';
import { CommandLineHistory, HistoryFile, SearchHistory } from '../history/historyFile';
import { Register } from '../register/register';
import { globalState } from '../state/globalState';
import { RecordedState } from '../state/recordedState';
import { IndexedPosition, IndexedRange, SearchState } from '../state/searchState';
import { VimState } from '../state/vimState';
import { StatusBar } from '../statusBar';
import { WordType, getWordLeftInText, getWordRightInText } from '../textobject/word';
import { SearchDecorations, getDecorationsForSearchMatchRanges } from '../util/decorationUtils';
import { Logger } from '../util/logger';
import { escapeCSSIcons, reportSearch } from '../util/statusBarTextUtils';
import { scrollView } from '../util/util';
import { ExCommand } from '../vimscript/exCommand';
import { LineRange } from '../vimscript/lineRange';
import { SearchDirection } from '../vimscript/pattern';
import { Mode } from './../mode/mode';
import { RegisterCommand } from './commands/register';
import { SubstituteCommand } from './commands/substitute';

export abstract class CommandLine {
  public cursorIndex: number;
  public previousMode: Mode;
  protected historyIndex: number | undefined;
  private savedText: string;

  constructor(text: string, previousMode: Mode) {
    this.cursorIndex = text.length;
    this.historyIndex = this.getHistory().get().length;
    this.previousMode = previousMode;
    this.savedText = text;
  }

  /**
   * @returns the text to be displayed in the status bar
   */
  public abstract display(cursorChar: string): string;

  /**
   * What the user has typed, minus any prefix, etc.
   */
  public abstract get text(): string;
  public abstract set text(text: string);

  /**
   * @returns the SearchState associated with this CommandLine, if one exists
   *
   * This applies to `/`, `:s`, `:g`, `:v`, etc.
   */
  public abstract getSearchState(): SearchState | undefined;

  public abstract getHistory(): HistoryFile;

  public abstract getDecorations(vimState: VimState): SearchDecorations | undefined;

  /**
   * Called when `<Enter>` is pressed
   */
  public abstract run(vimState: VimState): Promise<void>;

  /**
   * Called when `<Esc>` is pressed
   */
  public abstract escape(vimState: VimState): Promise<void>;

  /**
   * Called when `<C-f>` is pressed
   */
  public abstract ctrlF(vimState: VimState): Promise<void>;

  public async historyBack(): Promise<void> {
    if (this.historyIndex === 0) {
      return;
    }

    const historyEntries = this.getHistory().get();
    if (this.historyIndex === undefined) {
      this.historyIndex = historyEntries.length - 1;
      this.savedText = this.text;
    } else if (this.historyIndex > 0) {
      this.historyIndex--;
    }

    this.text = historyEntries[this.historyIndex];
    this.cursorIndex = this.text.length;
  }

  public async historyForward(): Promise<void> {
    if (this.historyIndex === undefined) {
      return;
    }

    const historyEntries = this.getHistory().get();
    if (this.historyIndex === historyEntries.length - 1) {
      this.historyIndex = undefined;
      this.text = this.savedText;
    } else if (this.historyIndex < historyEntries.length - 1) {
      this.historyIndex++;
      this.text = historyEntries[this.historyIndex];
    }

    this.cursorIndex = this.text.length;
  }

  /**
   * Called when `<BS>` is pressed
   */
  public async backspace(vimState: VimState): Promise<void> {
    if (this.cursorIndex === 0) {
      if (this.text.length === 0) {
        await this.escape(vimState);
      }
      return;
    }

    this.text = this.text.slice(0, this.cursorIndex - 1) + this.text.slice(this.cursorIndex);
    this.cursorIndex = Math.max(this.cursorIndex - 1, 0);
  }

  /**
   * Called when `<Del>` is pressed
   */
  public async delete(vimState: VimState): Promise<void> {
    if (this.cursorIndex === this.text.length) {
      return this.backspace(vimState);
    }

    this.text = this.text.slice(0, this.cursorIndex) + this.text.slice(this.cursorIndex + 1);
  }

  /**
   * Called when `<Home>` is pressed
   */
  public async home(): Promise<void> {
    this.cursorIndex = 0;
  }

  /**
   * Called when `<End>` is pressed
   */
  public async end(): Promise<void> {
    this.cursorIndex = this.text.length;
  }

  /**
   * Called when `<C-Left>` is pressed
   */
  public async wordLeft(): Promise<void> {
    this.cursorIndex = getWordLeftInText(this.text, this.cursorIndex, WordType.Big) ?? 0;
  }

  /**
   * Called when `<C-Right>` is pressed
   */
  public async wordRight(): Promise<void> {
    this.cursorIndex =
      getWordRightInText(this.text, this.cursorIndex, WordType.Big) ?? this.text.length;
  }

  /**
   * Called when `<C-BS>` is pressed
   */
  public async deleteWord(): Promise<void> {
    const wordStart = getWordLeftInText(this.text, this.cursorIndex, WordType.Normal);
    if (wordStart !== undefined) {
      this.text = this.text.substring(0, wordStart).concat(this.text.slice(this.cursorIndex));
      this.cursorIndex = this.cursorIndex - (this.cursorIndex - wordStart);
    }
  }

  /**
   * Called when `<C-BS>` is pressed
   */
  public async deleteToBeginning(): Promise<void> {
    this.text = this.text.slice(this.cursorIndex);
    this.cursorIndex = 0;
  }

  public async typeCharacter(char: string): Promise<void> {
    const modifiedString = this.text.split('');
    modifiedString.splice(this.cursorIndex, 0, char);
    this.text = modifiedString.join('');
    this.cursorIndex += char.length;
  }
}

export class ExCommandLine extends CommandLine {
  static history: CommandLineHistory;
  static parser: Parser<{ lineRange: LineRange | undefined; command: ExCommand }>;
  static onSearch: (vimState: VimState) => Promise<void>;

  public static async loadHistory(context: ExtensionContext): Promise<void> {
    ExCommandLine.history = new CommandLineHistory(context);
    await ExCommandLine.history.load();
  }

  // TODO: Make this stuff private?
  public autoCompleteIndex = 0;
  public autoCompleteItems: string[] = [];
  public preCompleteCharacterPos = 0;
  public preCompleteCommand = '';

  private commandText: string;
  private lineRange: LineRange | undefined;
  private command: ExCommand | undefined;

  constructor(commandText: string, previousMode: Mode) {
    super(commandText, previousMode);
    this.commandText = commandText;
    this.text = commandText;
    this.previousMode = previousMode;
  }

  public display(cursorChar: string): string {
    return escapeCSSIcons(
      `:${this.text.substring(0, this.cursorIndex)}${cursorChar}${this.text.substring(
        this.cursorIndex,
      )}`,
    );
  }

  public get text(): string {
    return this.commandText;
  }
  public set text(text: string) {
    this.commandText = text;

    try {
      // TODO: This eager parsing is costly, and if it's not `:s` or similar, don't need to parse the args at all
      const { lineRange, command } = ExCommandLine.parser.tryParse(this.commandText);
      this.lineRange = lineRange;
      this.command = command;
    } catch (err) {
      this.lineRange = undefined;
      this.command = undefined;
    }
  }

  public getSearchState(): SearchState | undefined {
    return undefined;
  }

  public getDecorations(vimState: VimState): SearchDecorations | undefined {
    return this.command instanceof SubstituteCommand &&
      vimState.currentMode === Mode.CommandlineInProgress
      ? this.command.getSubstitutionDecorations(vimState, this.lineRange)
      : undefined;
  }

  public getHistory(): HistoryFile {
    return ExCommandLine.history;
  }

  public async run(vimState: VimState): Promise<void> {
    Logger.info(`Executing :${this.text}`);
    void ExCommandLine.history.add(this.text);
    this.historyIndex = ExCommandLine.history.get().length;

    if (!(this.command instanceof RegisterCommand)) {
      // TODO(jfields): Wait...why are we saving the `:` register as a RecordedState?
      const recState = new RecordedState();
      recState.registerName = ':';
      recState.commandList = this.text.split('');
      Register.setReadonlyRegister(':', recState);
    }

    try {
      if (this.command === undefined) {
        // TODO: A bit gross:
        ExCommandLine.parser.tryParse(this.text);
        throw new Error(`Expected parsing ExCommand '${this.text}' to fail`);
      }

      const useNeovim = configuration.enableNeovim && this.command.neovimCapable();
      if (useNeovim && vimState.nvim) {
        const { statusBarText, error } = await vimState.nvim.run(vimState, this.text);
        StatusBar.setText(vimState, statusBarText, error);
      } else {
        if (this.lineRange) {
          await this.command.executeWithRange(vimState, this.lineRange);
        } else {
          await this.command.execute(vimState);
        }
      }
    } catch (e) {
      if (e instanceof VimError) {
        if (
          e.code === ErrorCode.NotAnEditorCommand &&
          configuration.enableNeovim &&
          vimState.nvim
        ) {
          const { statusBarText } = await vimState.nvim.run(vimState, this.text);
          StatusBar.setText(vimState, statusBarText, true);
        } else {
          StatusBar.setText(vimState, e.toString(), true);
        }
      } else {
        Logger.error(`Error executing cmd=${this.text}. err=${e}.`);
      }
    }

    // Update state if this command is repeatable via dot command.
    vimState.lastCommandDotRepeatable = this.command?.isRepeatableWithDot ?? false;
  }

  public async escape(vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
    if (this.text.length > 0) {
      void ExCommandLine.history.add(this.text);
    }
  }

  public async ctrlF(vimState: VimState): Promise<void> {
    void ExCommandLine.onSearch(vimState);
  }
}

export class SearchCommandLine extends CommandLine {
  public static history: SearchHistory;
  public static readonly previousSearchStates: SearchState[] = [];
  public static onSearch: (vimState: VimState, direction: SearchDirection) => Promise<void>;

  /**
   * Shows the search history as a QuickPick (popup list)
   *
   * @returns The SearchState that was selected by the user, if there was one.
   */
  public static async showSearchHistory(): Promise<SearchState | undefined> {
    const items = SearchCommandLine.previousSearchStates
      .slice()
      .reverse()
      .map((searchState) => {
        return {
          label: searchState.searchString,
          searchState,
        };
      });

    const item = await window.showQuickPick(items, {
      placeHolder: 'Vim search history',
      ignoreFocusOut: false,
    });

    return item?.searchState;
  }

  public static async loadHistory(context: ExtensionContext): Promise<void> {
    SearchCommandLine.history = new SearchHistory(context);
    SearchCommandLine.history
      .get()
      .forEach((val) =>
        SearchCommandLine.previousSearchStates.push(
          new SearchState(SearchDirection.Forward, new Position(0, 0), val, undefined),
        ),
      );
  }

  public static async addSearchStateToHistory(searchState: SearchState) {
    const prevSearchString =
      SearchCommandLine.previousSearchStates.length === 0
        ? undefined
        : SearchCommandLine.previousSearchStates[SearchCommandLine.previousSearchStates.length - 1]
            .searchString;
    // Store this search if different than previous
    if (searchState.searchString !== prevSearchString) {
      SearchCommandLine.previousSearchStates.push(searchState);
      if (SearchCommandLine.history !== undefined) {
        await SearchCommandLine.history.add(searchState.searchString);
      }
    }

    // Make sure search history does not exceed configuration option
    if (SearchCommandLine.previousSearchStates.length > configuration.history) {
      SearchCommandLine.previousSearchStates.splice(0, 1);
    }
  }

  /**
   * Keeps the state of the current match, i.e. the match to which the cursor moves when the search is executed.
   * Incremented / decremented by \<C-g> or \<C-t> in SearchInProgress mode.
   * Resets to 0 if the search string becomes empty.
   *
   * @see {@link getCurrentMatchRelativeIndex}
   */
  private currentMatchDisplacement: number = 0;
  private searchState: SearchState;

  constructor(vimState: VimState, searchString: string, direction: SearchDirection) {
    super(searchString, vimState.currentMode);
    this.searchState = new SearchState(direction, vimState.cursorStopPosition, searchString);
  }

  public display(cursorChar: string): string {
    return escapeCSSIcons(
      `${this.searchState.direction === SearchDirection.Forward ? '/' : '?'}${this.text.substring(
        0,
        this.cursorIndex,
      )}${cursorChar}${this.text.substring(this.cursorIndex)}`,
    );
  }

  public get text(): string {
    return this.searchState.searchString;
  }
  public set text(text: string) {
    this.searchState.searchString = text;
    if (text === '') {
      this.currentMatchDisplacement = 0;
    }
  }

  public getSearchState(): SearchState {
    return this.searchState;
  }

  public getHistory(): HistoryFile {
    return SearchCommandLine.history;
  }

  /**
   * @returns the index of the current match, relative to the next match.
   */
  private getCurrentMatchRelativeIndex(vimState: VimState): number {
    const count = vimState.recordedState.count || 1;
    return count - 1 + this.currentMatchDisplacement * count;
  }

  /**
   * @returns The start of the current match range (after applying the search offset) and its rank in the document's matches
   */
  public getCurrentMatchPosition(vimState: VimState): IndexedPosition | undefined {
    return this.searchState.getNextSearchMatchPosition(
      vimState,
      vimState.cursorStopPosition,
      SearchDirection.Forward,
      this.getCurrentMatchRelativeIndex(vimState),
    );
  }

  /**
   * @returns The current match range and its rank in the document's matches
   *
   * NOTE: This method does not take the search offset into account
   */
  public getCurrentMatchRange(vimState: VimState): IndexedRange | undefined {
    return this.searchState.getNextSearchMatchRange(
      vimState,
      vimState.cursorStopPosition,
      SearchDirection.Forward,
      this.getCurrentMatchRelativeIndex(vimState),
    );
  }

  public getDecorations(vimState: VimState): SearchDecorations | undefined {
    return getDecorationsForSearchMatchRanges(
      this.searchState.getMatchRanges(vimState),
      configuration.incsearch && vimState.currentMode === Mode.SearchInProgressMode
        ? this.getCurrentMatchRange(vimState)?.index
        : undefined,
    );
  }

  public async run(vimState: VimState): Promise<void> {
    // Repeat the previous search if no new string is entered
    if (this.text === '') {
      if (SearchCommandLine.previousSearchStates.length > 0) {
        this.text =
          SearchCommandLine.previousSearchStates[
            SearchCommandLine.previousSearchStates.length - 1
          ].searchString;
      }
    }
    Logger.info(`Searching for ${this.text}`);

    this.cursorIndex = 0;
    Register.setReadonlyRegister('/', this.text);
    void SearchCommandLine.addSearchStateToHistory(this.searchState);
    globalState.hl = true;

    if (this.searchState.getMatchRanges(vimState).length === 0) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.PatternNotFound, this.text));
      return;
    }

    const currentMatch = this.getCurrentMatchPosition(vimState);

    if (currentMatch === undefined) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(
          this.searchState.direction === SearchDirection.Backward
            ? ErrorCode.SearchHitTop
            : ErrorCode.SearchHitBottom,
          this.text,
        ),
      );
      return;
    }

    vimState.cursorStopPosition = currentMatch.pos;

    reportSearch(currentMatch.index, this.searchState.getMatchRanges(vimState).length, vimState);
  }

  public async escape(vimState: VimState): Promise<void> {
    vimState.cursorStopPosition = this.searchState.cursorStartPosition;

    const prevSearchList = SearchCommandLine.previousSearchStates;
    globalState.searchState = prevSearchList
      ? prevSearchList[prevSearchList.length - 1]
      : undefined;

    if (vimState.modeData.mode === Mode.SearchInProgressMode) {
      const offset =
        vimState.editor.visibleRanges[0].start.line -
        vimState.modeData.firstVisibleLineBeforeSearch;
      scrollView(vimState, offset);
    }

    await vimState.setCurrentMode(this.previousMode);
    if (this.text.length > 0) {
      void SearchCommandLine.addSearchStateToHistory(this.searchState);
    }
  }

  public async ctrlF(vimState: VimState): Promise<void> {
    await SearchCommandLine.onSearch(vimState, this.searchState.direction);
  }

  /**
   * Called when <C-g> or <C-t> is pressed during SearchInProgress mode
   */
  public async advanceCurrentMatch(vimState: VimState, direction: SearchDirection): Promise<void> {
    // <C-g> always moves forward in the document, and <C-t> always moves back, regardless of search direction.
    // To compensate, multiply the desired direction by the searchState's direction, so that
    // effectiveDirection == direction * (searchState.direction)^2 == direction.
    this.currentMatchDisplacement += this.searchState.direction * direction;

    // With nowrapscan, <C-g>/<C-t> shouldn't do anything if it would mean advancing past the last reachable match in the buffer.
    // We account for this by checking whether getCurrentMatchRange returns undefined once this.currentMatchDisplacement is advanced.
    // If it does, we undo the change to this.currentMatchDisplacement before exiting, making this command a noop.
    if (!configuration.wrapscan && !this.getCurrentMatchRange(vimState)) {
      this.currentMatchDisplacement -= this.searchState.direction * direction;
    }
  }
}
