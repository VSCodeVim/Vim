import { Jump } from './jump';

/**
 * JumpTracker is a handrolled version of vscode's TextEditorState
 * in relation to the 'workbench.action.navigateBack' command.
 */
export class JumpTracker {
  private _jumps: Jump[] = [];
  private _currentJumpIndex = 0;

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
  public get currentJumpIndex(): number {
    return this._currentJumpIndex;
  }

  /**
   * Current jump in the list of jumps
   */
  public get currentJump(): Jump {
    return this._jumps[this._currentJumpIndex];
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
  public recordJump(from: Jump, to?: Jump | null) {
    const currentJump = this._jumps[this._currentJumpIndex];

    if (to && from.onSameLine(to)) {
      return;
    }

    this.clearJumpsOnSameLine(from);

    if (from && !from.onSameLine(to)) {
      this._jumps.push(from);
    }

    this._currentJumpIndex = this._jumps.length;
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

    if (!from || from.fileName === to.fileName) {
      return;
    }

    this.recordJump(from, to);
  }

  /**
   * Get the previous jump in history.
   * Continues further back if the current line is on the same line.
   *
   * @param from - File/position jumped from
   */
  public back(from: Jump): Jump {
    if (!this.hasJumps) {
      return from;
    }

    if (this._currentJumpIndex <= 0) {
      return this._jumps[0];
    }

    let to: Jump;

    if (this._currentJumpIndex === this._jumps.length) {
      to = this._jumps[this._currentJumpIndex - 1];
      this.recordJump(from, to);
      this._currentJumpIndex = this._currentJumpIndex - 2;
    } else {
      to = this._jumps[this._currentJumpIndex - 1];
      this._currentJumpIndex = this._currentJumpIndex - 1;
    }

    return to;
  }

  /**
   * Get the next jump in history.
   * Continues further ahead if the current line is on the same line.
   *
   * @param from - File/position jumped from
   */
  public forward(from: Jump): Jump {
    if (!this.hasJumps) {
      return from;
    }

    if (this._currentJumpIndex >= this._jumps.length) {
      return from;
    }

    this._currentJumpIndex = Math.min(this._currentJumpIndex + 1, this._jumps.length - 1);
    const jump = this._jumps[this._currentJumpIndex];

    // if (jump && jump.onSameLine(from)) {
    //   this.removeCurrentJump();
    //   this._currentJumpIndex -= 1;
    //   return this.forward(from);
    // }
    return jump;
  }

  clearJumps(): void {
    this._jumps.splice(0, this._jumps.length);
  }

  clearJumpsAfterCurrentJumpIndex(): void {
    this._jumps.splice(this._currentJumpIndex + 1, this._jumps.length);
  }

  clearJumpsOnSameLine(jump: Jump): void {
    this._jumps = this._jumps.filter(j => !j.onSameLine(jump));
  }

  removeCurrentJump(): void {
    this._jumps.splice(this._currentJumpIndex, 1);
  }

  updateCurrentJumpColumn(to: Jump): void {
    this._jumps.splice(this._currentJumpIndex, 1, to);
  }
}
