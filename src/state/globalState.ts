import { SearchState } from './searchState';
import { RecordedState } from '../mode/modeHandler';

/**
 * State which stores global state (across editors)
 */
export class GlobalState {
  /**
   * The keystroke sequence that made up our last complete action (that can be
   * repeated with '.').
   */
  private static _previousFullAction: RecordedState | undefined = undefined;

  /**
   * Previous searches performed
   */
  private static _searchStatePrevious: SearchState[] = [];

  /**
   * Last search state for running n and N commands
   */
  private static _searchState: SearchState | undefined = undefined;

  /**
   *  Index used for navigating search history with <up> and <down> when searching
   */
  private static _searchStateIndex: number = 0;

  /**
   * Used internally for nohl.
   */
  private static _hl = true;

  /**
   * Getters and setters for changing global state
   */
  public get searchStatePrevious(): SearchState[]{
    return GlobalState._searchStatePrevious;
  }

  public set searchStatePrevious(states: SearchState[]) {
    GlobalState._searchStatePrevious = GlobalState._searchStatePrevious.concat(states);
  }

  public get previousFullAction(): RecordedState | undefined {
    return GlobalState._previousFullAction;
  }

  public set previousFullAction(state : RecordedState | undefined) {
    GlobalState._previousFullAction = state;
  }

  public get searchState(): SearchState | undefined {
    return GlobalState._searchState;
  }

  public set searchState(state : SearchState | undefined) {
    GlobalState._searchState = state;
  }

  public get searchStateIndex(): number {
    return GlobalState._searchStateIndex;
  }

  public set searchStateIndex(state : number) {
    GlobalState._searchStateIndex = state;
  }

  public get hl(): boolean {
    return GlobalState._hl;
  }

  public set hl(enabled: boolean) {
    GlobalState._hl = enabled;
  }
}
