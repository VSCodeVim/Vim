// import * as vscode from 'vscode';
import { SearchState } from './searchState';
import { RecordedState } from '../mode/modeHandler';
// import { Position } from './../motion/position';
// import { TextEditor } from './../textEditor';
// import { Configuration } from '../../src/configuration/configuration';

/**
 * State which stores global state (across editors)
 */
export class GlobalState {
  /**
   * The keystroke sequence that made up our last complete action (that can be
   * repeated with '.').
   */
  public static previousFullAction: RecordedState | undefined = undefined;

  /**
   * Previous searches performed
   */
  public static searchStatePrevious: SearchState[] = [];

  /**
   * Last search state for running n and N commands
   */
  public static searchState: SearchState | undefined = undefined;

  /**
   *  Index used for navigating search history with <up> and <down> when searching
   */
  public static searchStateIndex: number = 0;
}
