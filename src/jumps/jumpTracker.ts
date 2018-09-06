import * as vscode from 'vscode';

import { Jump } from './jump';
import { Position } from './../common/motion/position';

/**
 * JumpTracker is a handrolled version of vscode's TextEditorState
 * in relation to the 'workbench.action.navigateBack' command.
 */
export class JumpTracker {
  private _jumps: Jump[] = [];
  private _currentJumpNumber = 0;

  /**
   * When receiving vscode.window.onDidChangeActiveTextEditor messages,
   * don't record the jump if we initiated the command.
   *
   * Either the jump was added, or it was traversing jump history
   * and shouldn't count as a new jump.
   */
  public isJumpingFiles = false;

  /**
   * All recorded jumps, in the order of occurrence.
   */
  public get jumps(): Jump[] {
    return this._jumps;
  }

  /**
   * Current position in the list of jumps.
   * This will be past last index if not traveling through history.
   */
  public get currentJumpNumber(): number {
    return this._currentJumpNumber;
  }

  /**
   * Current jump in the list of jumps
   */
  public get currentJump(): Jump {
    return this._jumps[this._currentJumpNumber] || null;
  }

  /**
   * Current jump in the list of jumps
   */
  public get hasJumps(): boolean {
    return this._jumps.length > 0;
  }

  /**
   * Last jump in list of jumps
   */
  public get end(): Jump | null {
    return this._jumps[this._jumps.length - 1];
  }

  /**
   * First jump in list of jumps
   */
  public get start(): Jump | null {
    return this._jumps[0];
  }

  /**
   * Record that a jump occurred.
   *
   * If the current position is back in history,
   * jumps after this position will be removed.
   *
   * @param from - File/position jumped from
   * @param to - File/position jumped to
   */
  public recordJump(from: Jump | null, to?: Jump | null) {
    if (from && to && from.onSameLine(to)) {
      return;
    }

    if (from) {
      this.clearJumpsOnSameLine(from);
    }

    if (from && !from.onSameLine(to)) {
      this._jumps.push(from);
    }

    this._currentJumpNumber = this._jumps.length;

    this.clearOldJumps();
  }

  /**
   * Record that a jump occurred from one file to another.
   * This is likely only needed on a handler for
   * vscode.window.onDidChangeActiveTextEditor
   *
   * File jumps have extra checks in place, keeping in mind
   * whether this plugin initiated the jump, whether the new file is
   * a legitimate file.
   *
   * @param from - File/position jumped from
   * @param to - File/position jumped to
   */
  public recordFileJump(from: Jump | null, to: Jump) {
    if (this.isJumpingFiles) {
      this.isJumpingFiles = false;
      return;
    }

    if (to.editor && to.editor.document && to.editor.document.isClosed) {
      // Wallaby.js seemed to be adding an extra file jump, named e.g. extension-output-#4
      // It was marked closed when jumping to it. Hopefully we can rely on checking isClosed
      // when extensions get all weird on us.
      return;
    }

    if (from && from.fileName === to.fileName) {
      return;
    }

    if (from) {
      this.clearJumpsOnSameLine(from);
    }

    if (from && !from.onSameLine(to)) {
      this._jumps.push(from);
    }

    this._currentJumpNumber = this._jumps.length;

    this.clearOldJumps();
  }

  /**
   * Get the previous jump in history.
   * Continues further back if the current line is on the same line.
   *
   * @param from - File/position jumped from
   */
  public jumpBack(from: Jump): Jump {
    if (!this.hasJumps) {
      return from;
    }

    if (this._currentJumpNumber <= 0) {
      return this._jumps[0];
    }

    const to: Jump = this._jumps[this._currentJumpNumber - 1];

    if (this._currentJumpNumber === this._jumps.length) {
      this.recordJump(from, to);
      this._currentJumpNumber = this._currentJumpNumber - 2;
    } else {
      this._currentJumpNumber = this._currentJumpNumber - 1;
    }

    return to;
  }

  /**
   * Get the next jump in history.
   * Continues further ahead if the current line is on the same line.
   *
   * @param from - File/position jumped from
   */
  public jumpForward(from: Jump): Jump {
    if (!this.hasJumps) {
      return from;
    }

    if (this._currentJumpNumber >= this._jumps.length) {
      return from;
    }

    this._currentJumpNumber = Math.min(this._currentJumpNumber + 1, this._jumps.length - 1);
    const jump = this._jumps[this._currentJumpNumber];
    return jump;
  }

  public handleTextAdded(document: vscode.TextDocument, range: vscode.Range, text: string): void {
    const distance = text.split('').filter(c => c === '\n').length;

    this._jumps.forEach((jump, i) => {
      const jumpIsAfterAddedText =
        jump.fileName === document.fileName && jump.position.line > range.start.line;

      if (jumpIsAfterAddedText) {
        const newPosition = new Position(jump.position.line + distance, jump.position.character);

        this.changePositionForJumpNumber(i, jump, newPosition);
      }
    });
  }

  public handleTextDeleted(document: vscode.TextDocument, range: vscode.Range): void {
    const distance = range.end.line - range.start.line;

    this._jumps.forEach((jump, i) => {
      const jumpIsAfterDeletedText =
        jump.fileName === document.fileName && jump.position.line >= range.start.line;

      if (jumpIsAfterDeletedText) {
        const newLineShiftedUp =
          jump.position.line - Math.min(jump.position.line - range.start.line, distance);
        const newPosition = new Position(newLineShiftedUp, jump.position.character);

        this.changePositionForJumpNumber(i, jump, newPosition);
      }
    });

    this.removeDuplicateJumps();
  }

  changePositionForJumpNumber(index: number, jump: Jump, newPosition: Position) {
    this._jumps.splice(
      index,
      1,
      new Jump({
        editor: jump.editor,
        fileName: jump.fileName,
        position: newPosition,
      })
    );
  }

  clearJumps(): void {
    this._jumps.splice(0, this._jumps.length);
  }

  clearOldJumps(): void {
    if (this._jumps.length > 100) {
      this._jumps.splice(0, this._jumps.length - 100);
    }
  }

  clearJumpsAfterCurrentJumpIndex(): void {
    this._jumps.splice(this._currentJumpNumber + 1, this._jumps.length);
  }

  clearJumpsOnSameLine(jump: Jump): void {
    this._jumps = this._jumps.filter(j => j === jump || !j.onSameLine(jump));
  }

  removeDuplicateJumps() {
    for (let i = 0; i < this._jumps.length; i++) {
      const jump = this._jumps[i];
      this.clearJumpsOnSameLine(jump);
    }
  }

  removeJumpNumber(index: number): void {
    this._jumps.splice(index, 1);
  }

  removeCurrentJump(): void {
    this.removeJumpNumber(this._currentJumpNumber);
  }

  getJumpNumberOfLine(line: number) {
    return this._jumps.findIndex(j => j.position.line === line);
  }

  updateCurrentJumpColumn(to: Jump): void {
    this._jumps.splice(this._currentJumpNumber, 1, to);
  }
}
