import { CommandLineHistory, HistoryFile, SearchHistory } from '../history/historyFile';
import { Mode } from './../mode/mode';
import { Logger } from '../util/logger';
import { StatusBar } from '../statusBar';
import { VimError, ErrorCode } from '../error';
import { VimState } from '../state/vimState';
import { configuration } from '../configuration/configuration';
import { Register } from '../register/register';
import { RecordedState } from '../state/recordedState';
import { exCommandParser } from '../vimscript/exCommandParser';
import { SearchState } from '../state/searchState';
import { getWordLeftInText, getWordRightInText, WordType } from '../textobject/word';
import { CommandShowCommandHistory, CommandShowSearchHistory } from '../actions/commands/actions';
import { SearchDirection } from '../vimscript/pattern';
import { reportSearch } from '../util/statusBarTextUtils';
import { Position, ExtensionContext, window } from 'vscode';
import { globalState } from '../state/globalState';
import { scrollView } from '../util/util';
import { ExCommand } from '../vimscript/exCommand';
import { LineRange } from '../vimscript/lineRange';
import { RegisterCommand } from './commands/register';

export abstract class CommandLine {
  public cursorIndex: number;
  public historyIndex: number | undefined;
  public previousMode: Mode;
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
    } else {
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
      return this.escape(vimState);
    }

    this.text = this.text.slice(0, this.cursorIndex - 1) + this.text.slice(this.cursorIndex);
    this.cursorIndex = Math.max(this.cursorIndex - 1, 0);
  }

  /**
   * Called when `<Del>` is pressed
   */
  public async delete(vimState: VimState): Promise<void> {
    if (this.cursorIndex === 0) {
      return this.escape(vimState);
    } else if (this.cursorIndex === this.text.length) {
      return this.backspace(vimState);
    } else {
      this.text = this.text.slice(0, this.cursorIndex) + this.text.slice(this.cursorIndex + 1);
    }
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

  private static readonly logger = Logger.get('CommandLine');

  constructor(commandText: string, previousMode: Mode) {
    super(commandText, previousMode);
    this.commandText = commandText;
    this.text = commandText;
    this.previousMode = previousMode;
  }

  public display(cursorChar: string): string {
    return `:${this.text.substring(0, this.cursorIndex)}${cursorChar}${this.text.substring(
      this.cursorIndex
    )}`;
  }

  public get text(): string {
    return this.commandText;
  }
  public set text(text: string) {
    this.commandText = text;

    try {
      // TODO: This eager parsing is costly, and if it's not `:s` or similar, don't need to parse the args at all
      const { lineRange, command } = exCommandParser.tryParse(this.commandText);
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

  public getHistory(): HistoryFile {
    return ExCommandLine.history;
  }

  public async run(vimState: VimState): Promise<void> {
    ExCommandLine.history.add(this.text);
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
        exCommandParser.tryParse(this.text);
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
        ExCommandLine.logger.error(`Error executing cmd=${this.text}. err=${e}.`);
      }
    }

    await vimState.setCurrentMode(Mode.Normal);
  }

  public async escape(vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }

  public async ctrlF(vimState: VimState): Promise<void> {
    new CommandShowCommandHistory().exec(vimState.cursorStopPosition, vimState);
  }
}

export class SearchCommandLine extends CommandLine {
  public static history: SearchHistory;
  public static readonly previousSearchStates: SearchState[] = [];

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
          new SearchState(SearchDirection.Forward, new Position(0, 0), val, undefined)
        )
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

  private searchState: SearchState;

  constructor(vimState: VimState, searchString: string, direction: SearchDirection) {
    super(searchString, vimState.currentMode);
    this.searchState = new SearchState(direction, vimState.cursorStopPosition, searchString);
  }

  public display(cursorChar: string): string {
    return `${
      this.searchState.direction === SearchDirection.Forward ? '/' : '?'
    }${this.text.substring(0, this.cursorIndex)}${cursorChar}${this.text.substring(
      this.cursorIndex
    )}`;
  }

  public get text(): string {
    return this.searchState.searchString;
  }
  public set text(text: string) {
    this.searchState.searchString = text;
  }

  public getSearchState(): SearchState {
    return this.searchState;
  }

  public getHistory(): HistoryFile {
    return SearchCommandLine.history;
  }

  public async run(vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(this.previousMode);

    // Repeat the previous search if no new string is entered
    if (this.text === '') {
      if (SearchCommandLine.previousSearchStates.length > 0) {
        this.text =
          SearchCommandLine.previousSearchStates[
            SearchCommandLine.previousSearchStates.length - 1
          ].searchString;
      }
    }

    this.cursorIndex = 0;
    Register.setReadonlyRegister('/', this.text);
    SearchCommandLine.addSearchStateToHistory(this.searchState);
    globalState.hl = true;

    if (this.searchState.getMatchRanges(vimState).length === 0) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.PatternNotFound, this.text));
      return;
    }

    const count = vimState.recordedState.count || 1;
    let searchPos = vimState.cursorStopPosition;
    let nextMatch: { pos: Position; index: number } | undefined;
    for (let i = 0; i < count; i++) {
      // Move cursor to next match
      nextMatch = this.searchState.getNextSearchMatchPosition(vimState, searchPos);
      if (nextMatch === undefined) {
        break;
      }
      searchPos = nextMatch.pos;
    }
    if (nextMatch === undefined) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(
          this.searchState.direction === SearchDirection.Backward
            ? ErrorCode.SearchHitTop
            : ErrorCode.SearchHitBottom,
          this.text
        )
      );
      return;
    }

    vimState.cursorStopPosition = nextMatch.pos;

    reportSearch(nextMatch.index, this.searchState.getMatchRanges(vimState).length, vimState);
  }

  public async escape(vimState: VimState): Promise<void> {
    vimState.cursorStopPosition = this.searchState.cursorStartPosition;

    const prevSearchList = SearchCommandLine.previousSearchStates;
    globalState.searchState = prevSearchList
      ? prevSearchList[prevSearchList.length - 1]
      : undefined;

    if (vimState.firstVisibleLineBeforeSearch !== undefined) {
      const offset =
        vimState.editor.visibleRanges[0].start.line - vimState.firstVisibleLineBeforeSearch;
      scrollView(vimState, offset);
    }

    await vimState.setCurrentMode(this.previousMode);
    this.cursorIndex = 0;
    if (this.text.length > 0) {
      SearchCommandLine.addSearchStateToHistory(this.searchState);
    }
  }

  public async ctrlF(vimState: VimState): Promise<void> {
    await new CommandShowSearchHistory(this.searchState.direction).exec(
      vimState.cursorStopPosition,
      vimState
    );
  }
}
