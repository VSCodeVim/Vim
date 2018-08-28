import * as vscode from 'vscode';

import { Position } from '../common/motion/position';
import { RecordedState } from './../state/recordedState';
import { SearchState } from './searchState';

export class Jump {
  public editor: vscode.TextEditor;
  public fileName: string;
  public position: Position;
  public recordedState?: RecordedState;

  constructor({
    editor,
    fileName,
    position,
    recordedState,
  }: {
    editor: vscode.TextEditor;
    fileName: string;
    position: Position;
    recordedState?: RecordedState;
  }) {
    if (!fileName) {
      throw new Error('fileName is required for Jumps');
    }
    if (!position) {
      throw new Error('position is required for Jumps');
    }
    this.editor = editor;
    // TODO - can we just always require editor and get filename from it?
    this.fileName = fileName;
    this.position = position;
    this.recordedState = recordedState;
  }

  public equals(other: Jump): boolean {
    return this.fileName === other.fileName && this.position.line === other.position.line;
  }
}

export class JumpHistory {
  public isJumpingFiles = false;

  private jumps: Jump[] = [];
  private currentPosition = 0;

  public jumpFiles(from: Jump | null, to: Jump) {
    console.log('jumpFiles------------');
    const currentJump = this.jumps[this.currentPosition];
    if (this.isJumpingFiles) {
      this.isJumpingFiles = false;
      return;
    }

    if (from && from.fileName === to.fileName) {
      return;
    }

    if (this.currentPosition < this.jumps.length - 1) {
      console.log('Removing following jumps jumping files');
      this.jumps.splice(this.currentPosition + 1, this.jumps.length);
    }

    console.log('Jumping to file', to.fileName, to.position.line);

    if (from) {
      if (currentJump && currentJump.equals(from)) {
        console.log('On from');
      } else {
        console.log('Jumped From', from.fileName);
        this.jumps.push(from);
      }
    }
    if (currentJump && currentJump.equals(to)) {
      console.log('On to');
    } else {
      console.log('Jumped To', to.fileName);
      this.jumps.push(to);
    }
    this.currentPosition = this.jumps.length - 1;
  }

  public push(jump: Jump) {
    console.log('push------------');

    const previousJump = this.jumps[this.currentPosition - 1];
    const currentJump = this.jumps[this.currentPosition];
    const nextJump = this.jumps[this.currentPosition + 1];

    if (previousJump && previousJump.equals(jump)) {
      this.currentPosition -= 1;
      console.log('On previous jump', this.currentPosition);
      return;
    }

    if (currentJump && currentJump.equals(jump)) {
      console.log('On current jump', this.currentPosition);
      return;
    }

    if (nextJump && nextJump.equals(jump)) {
      this.currentPosition += 1;
      console.log('On next jump', this.currentPosition);
      return;
    }

    if (this.currentPosition < this.jumps.length - 1) {
      this.jumps.splice(this.currentPosition + 1, this.jumps.length);
      console.log('Removing following jumps');
    }

    console.log('Added new jump', jump.fileName, jump.position.line);
    this.jumps.push(jump);
    this.currentPosition = this.jumps.length - 1;
  }

  public back(): Jump {
    this.currentPosition = Math.max(this.currentPosition - 1, 0);
    return this.jumps[this.currentPosition];
  }

  public forward(): Jump {
    this.currentPosition = Math.min(this.currentPosition + 1, this.jumps.length - 1);
    return this.jumps[this.currentPosition];
  }
}

/**
 * State which stores global state (across editors)
 */
export class GlobalState {
  private static _jumpHistory: JumpHistory = new JumpHistory();

  /**
   * Getters and setters for changing global state
   */
  public get jumpHistory(): JumpHistory {
    return GlobalState._jumpHistory;
  }

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
  public get searchStatePrevious(): SearchState[] {
    return GlobalState._searchStatePrevious;
  }

  public set searchStatePrevious(states: SearchState[]) {
    GlobalState._searchStatePrevious = GlobalState._searchStatePrevious.concat(states);
  }

  public get previousFullAction(): RecordedState | undefined {
    return GlobalState._previousFullAction;
  }

  public set previousFullAction(state: RecordedState | undefined) {
    GlobalState._previousFullAction = state;
  }

  public get searchState(): SearchState | undefined {
    return GlobalState._searchState;
  }

  public set searchState(state: SearchState | undefined) {
    GlobalState._searchState = state;
  }

  public get searchStateIndex(): number {
    return GlobalState._searchStateIndex;
  }

  public set searchStateIndex(state: number) {
    GlobalState._searchStateIndex = state;
  }

  public get hl(): boolean {
    return GlobalState._hl;
  }

  public set hl(enabled: boolean) {
    GlobalState._hl = enabled;
  }
}
