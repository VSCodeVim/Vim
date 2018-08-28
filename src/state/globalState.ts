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

  public onSameLine(other: Jump | null | undefined): boolean {
    return (
      !other || (this.fileName === other.fileName && this.position.line === other.position.line)
    );
  }
}

export class JumpHistory {
  public isJumpingFiles = false;

  private jumps: Jump[] = [];
  private currentPosition = 0;

  public jumpFiles(from: Jump | null, to: Jump) {
    const currentJump = this.jumps[this.currentPosition];
    if (this.isJumpingFiles) {
      this.isJumpingFiles = false;
      return;
    }

    if (to.editor.document.isClosed) {
      // Wallaby.js seemed to be adding an extra file jump, named e.g. extension-output-#4
      // It was marked closed when jumping to it. Hopefully we can rely on checking isClosed
      // when extensions get all weird on us.
      return;
    }

    if (from && from.fileName === to.fileName) {
      return;
    }

    if (this.currentPosition < this.jumps.length - 1) {
      this.clearJumpsAfterCurrentPosition();
    }

    if (from) {
      this.jumps.push(from);
    }
    this.jumps.push(to);
    this.currentPosition = this.jumps.length - 1;
  }

  public jump(from: Jump | null, to: Jump) {
    const previousJump = this.jumps[this.currentPosition - 1];
    const currentJump = this.jumps[this.currentPosition];
    const nextJump = this.jumps[this.currentPosition + 1];

    if (previousJump && previousJump.onSameLine(to)) {
      this.currentPosition -= 1;
      return;
    }

    if (currentJump && currentJump.onSameLine(to)) {
      this.replaceCurrentJump(to);
      return;
    }

    if (nextJump && nextJump.onSameLine(to)) {
      this.currentPosition += 1;
      return;
    }

    if (this.currentPosition < this.jumps.length - 1) {
      this.clearJumpsAfterCurrentPosition();
    }

    if (from && !from.onSameLine(currentJump) && !from.onSameLine(to)) {
      this.jumps.push(from);
    }
    this.jumps.push(to);
    this.currentPosition = this.jumps.length - 1;
  }

  clearJumpsAfterCurrentPosition(): any {
    this.jumps.splice(this.currentPosition + 1, this.jumps.length);
  }

  replaceCurrentJump(to: Jump): any {
    this.jumps.splice(this.currentPosition, this.jumps.length, to);
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
