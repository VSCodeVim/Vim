import { Jump } from './jump';

/**
 * JumpTracker is a handrolled version of vscode's TextEditorState
 * in relation to the 'workbench.action.navigateBack' command.
 */
export class JumpTracker {
  private jumps: Jump[] = [];
  private currentJumpIndex = 0;

  /**
   * When receiving vscode.window.onDidChangeActiveTextEditor messages,
   * don't record the jump if we initiated the command.
   *
   * Either the jump was added, or it was traversing jump history
   * and shouldn't count as a new jump.
   */
  public isJumpingFiles = false;

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

    if (to.editor.document.isClosed) {
      // Wallaby.js seemed to be adding an extra file jump, named e.g. extension-output-#4
      // It was marked closed when jumping to it. Hopefully we can rely on checking isClosed
      // when extensions get all weird on us.
      return;
    }

    if (from && from.fileName === to.fileName) {
      return;
    }

    this.recordJump(from, to);
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
  public recordJump(from: Jump | null, to: Jump) {
    const currentJump = this.jumps[this.currentJumpIndex];

    if (currentJump && currentJump.onSameLine(to)) {
      this.updateCurrentJumpColumn(to);
      return;
    }

    if (this.currentJumpIndex < this.jumps.length - 1) {
      this.clearJumpsAfterCurrentJumpIndex();
    }

    if (from && !from.onSameLine(currentJump) && !from.onSameLine(to)) {
      this.jumps.push(from);
    }
    this.jumps.push(to);

    this.currentJumpIndex = this.jumps.length - 1;
  }

  /**
   * Get the previous jump in history.
   * Continues further back if the current line is on the same line.
   *
   * @param from - File/position jumped from
   */
  public back(from: Jump): Jump {
    if (this.currentJumpIndex <= 0) {
      return this.jumps[0];
    }

    this.currentJumpIndex = this.currentJumpIndex - 1;
    const jump = this.jumps[this.currentJumpIndex];

    if (jump && jump.onSameLine(from)) {
      this.removeCurrentJump();
      return this.back(from);
    }
    return jump;
  }

  /**
   * Get the next jump in history.
   * Continues further ahead if the current line is on the same line.
   *
   * @param from - File/position jumped from
   */
  public forward(from: Jump): Jump {
    if (this.currentJumpIndex >= this.jumps.length - 1) {
      return this.jumps[this.jumps.length - 1];
    }

    this.currentJumpIndex = Math.min(this.currentJumpIndex + 1, this.jumps.length - 1);
    const jump = this.jumps[this.currentJumpIndex];

    if (jump && jump.onSameLine(from)) {
      this.removeCurrentJump();
      this.currentJumpIndex -= 1;
      return this.forward(from);
    }
    return jump;
  }

  clearJumpsAfterCurrentJumpIndex(): any {
    this.jumps.splice(this.currentJumpIndex + 1, this.jumps.length);
  }

  removeCurrentJump(): any {
    this.jumps.splice(this.currentJumpIndex, 1);
  }

  updateCurrentJumpColumn(to: Jump): any {
    this.jumps.splice(this.currentJumpIndex, 1, to);
  }
}
