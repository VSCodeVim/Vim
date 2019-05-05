import { JumpTracker } from '../jumps/jumpTracker';
import { ModeName } from '../mode/mode';
import { Position } from '../common/motion/position';
import { RecordedState } from './../state/recordedState';
import { SearchHistory } from '../history/historyFile';
import { SearchState, SearchDirection } from './searchState';
import { SubstituteState } from './substituteState';
import { configuration } from '../configuration/configuration';

/**
 * State which stores global state (across editors)
 */
class GlobalState {
  /**
   * Previous searches performed
   */
  private _searchStatePrevious: SearchState[] = [];

  /**
   * Track jumps, and traverse jump history
   */
  private _jumpTracker: JumpTracker = new JumpTracker();

  /**
   * Tracks search history
   */
  private _searchHistory: SearchHistory = new SearchHistory();

  /**
   * The keystroke sequence that made up our last complete action (that can be
   * repeated with '.').
   */
  public previousFullAction: RecordedState | undefined = undefined;

  /**
   * Last substitute state for running :s by itself
   */
  public substituteState: SubstituteState | undefined = undefined;

  /**
   * Last search state for running n and N commands
   */
  public searchState: SearchState | undefined = undefined;

  /**
   *  Index used for navigating search history with <up> and <down> when searching
   */
  public searchStateIndex: number = 0;

  /**
   * Used internally for nohl.
   */
  public hl = true;

  public async load() {
    await this._searchHistory.load();
    this._searchHistory
      .get()
      .forEach(val =>
        this.searchStatePrevious.push(
          new SearchState(
            SearchDirection.Forward,
            new Position(0, 0),
            val,
            undefined,
            ModeName.Normal
          )
        )
      );
  }

  /**
   * Getters and setters for changing global state
   */
  public get searchStatePrevious(): SearchState[] {
    return this._searchStatePrevious;
  }

  public set searchStatePrevious(states: SearchState[]) {
    this._searchStatePrevious = this._searchStatePrevious.concat(states);
  }

  public async addSearchStateToHistory(searchState: SearchState) {
    const prevSearchString =
      this.searchStatePrevious.length === 0
        ? undefined
        : this.searchStatePrevious[this.searchStatePrevious.length - 1]!.searchString;
    // Store this search if different than previous
    if (searchState.searchString !== prevSearchString) {
      this.searchStatePrevious.push(searchState);
      if (this._searchHistory !== undefined) {
        await this._searchHistory.add(searchState.searchString);
      }
    }

    // Make sure search history does not exceed configuration option
    if (this.searchStatePrevious.length > configuration.history) {
      this.searchStatePrevious.splice(0, 1);
    }

    // Update the index to the end of the search history
    this.searchStateIndex = this.searchStatePrevious.length - 1;
  }

  public get jumpTracker(): JumpTracker {
    return this._jumpTracker;
  }
}

export const globalState = new GlobalState();
