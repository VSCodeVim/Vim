import * as vscode from 'vscode';

import { FileCommand } from './../cmd_line/commands/file';
import { VimState } from '../state/vimState';

import { Jump } from './jump';
import { existsAsync } from 'platform/fs';
import { Position } from 'vscode';
import { ErrorCode, VimError } from '../error';

const MAX_JUMPS = 100;

/**
 * JumpTracker is a handrolled version of VSCode's TextEditorState
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
  public isJumpingThroughHistory = false;

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
   * Current jump in the list of jumps.
   */
  public get currentJump(): Jump {
    return this._jumps[this._currentJumpNumber] || null;
  }

  /**
   * Current jump in the list of jumps.
   */
  public get hasJumps(): boolean {
    return this._jumps.length > 0;
  }

  /**
   * Last jump in list of jumps.
   */
  public get end(): Jump | null {
    return this._jumps[this._jumps.length - 1];
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
  public recordJump(from: Jump, to?: Jump) {
    if (to && from.isSamePosition(to)) {
      return;
    }

    this.pushJump(from, to);
  }

  /**
   * Record that a jump occurred from one file to another.
   * This is likely only needed on a handler for
   * vscode.window.onDidChangeActiveTextEditor.
   *
   * File jumps have extra checks in place, keeping in mind
   * whether this plugin initiated the jump, whether the new file is
   * a legitimate file.
   *
   * @param from - File/position jumped from
   * @param to - File/position jumped to
   */
  public handleFileJump(from: Jump | null, to: Jump) {
    if (this.isJumpingThroughHistory) {
      this.isJumpingThroughHistory = false;
      return;
    }

    if (to.document.isClosed) {
      // Wallaby.js seemed to be adding an extra file jump, named e.g. extension-output-#4
      // It was marked closed when jumping to it. Hopefully we can rely on checking isClosed
      // when extensions get all weird on us.
      return;
    }

    this.pushJump(from, to);
  }

  private async performFileJump(jump: Jump, vimState: VimState): Promise<void> {
    this.isJumpingThroughHistory = true;

    if (jump.document) {
      try {
        // Open jump file from stored editor
        await vscode.window.showTextDocument(jump.document, {
          selection: new vscode.Range(jump.position, jump.position),
        });
      } catch (e: unknown) {
        // This can happen when the document we'd like to jump to is weird (like a search editor) or has been deleted
        throw VimError.fromCode(ErrorCode.FileNoLongerAvailable);
      }
    } else if (await existsAsync(jump.fileName)) {
      // Open jump file from disk
      await new FileCommand({
        name: 'edit',
        bang: false,
        opt: [],
        file: jump.fileName,
        cmd: { type: 'line_number', line: jump.position.line },
        createFileIfNotExists: false,
      }).execute(vimState);
    } else {
      // Get jump file from visible editors
      const editor: vscode.TextEditor = vscode.window.visibleTextEditors.filter(
        (e) => e.document.fileName === jump.fileName,
      )[0];

      if (editor) {
        await vscode.window.showTextDocument(editor.document, {
          selection: new vscode.Range(jump.position, jump.position),
        });
      }
    }
  }

  /**
   * Jump forward, possibly resulting in a file jump
   */
  public async jumpForward(position: Position, vimState: VimState): Promise<void> {
    await this.jumpThroughHistory(this.recordJumpForward.bind(this), position, vimState);
  }

  /**
   * Jump back, possibly resulting in a file jump
   */
  public async jumpBack(position: Position, vimState: VimState): Promise<void> {
    await this.jumpThroughHistory(this.recordJumpBack.bind(this), position, vimState);
  }

  private async jumpThroughHistory(
    getJump: (j: Jump) => Jump,
    position: Position,
    vimState: VimState,
  ): Promise<void> {
    let jump = new Jump({
      document: vimState.document,
      position,
    });

    const iterations = vimState.recordedState.count || 1;
    for (let i = 0; i < iterations; i++) {
      jump = getJump(Jump.fromStateNow(vimState));
    }

    if (!jump) {
      return;
    }

    const jumpedFiles = jump.fileName !== vimState.document.fileName;

    if (jumpedFiles) {
      await this.performFileJump(jump, vimState);
    } else {
      vimState.cursorStopPosition = jump.position;
    }
  }

  /**
   * Get the previous jump in history.
   * Continues further back if the current line is on the same line.
   *
   * @param from - File/position jumped from
   */
  public recordJumpBack(from: Jump): Jump {
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
  public recordJumpForward(from: Jump): Jump {
    if (!this.hasJumps) {
      return from;
    }

    if (this._currentJumpNumber >= this._jumps.length) {
      return from;
    }

    this._currentJumpNumber = Math.min(this._currentJumpNumber + 1, this._jumps.length - 1);
    return this._jumps[this._currentJumpNumber];
  }

  /**
   * Update existing jumps when lines were added to a document.
   *
   * @param document - Document that was changed, typically a vscode.TextDocument.
   * @param range - Location where the text was added.
   * @param text - Text containing one or more newline characters.
   */
  public handleTextAdded(document: { fileName: string }, range: vscode.Range, text: string): void {
    // Get distance from newlines in the text added.
    // Unlike handleTextDeleted, the range parameter distance between start/end is generally zero,
    // just showing where the text was added.
    const distance = text.split('').filter((c) => c === '\n').length;

    this._jumps.forEach((jump, i) => {
      const jumpIsAfterAddedText =
        jump.fileName === document.fileName && jump.position.line > range.start.line;

      if (jumpIsAfterAddedText) {
        const newPosition = new Position(jump.position.line + distance, jump.position.character);

        this.changePositionForJumpNumber(i, jump, newPosition);
      }
    });
  }

  /**
   * Update existing jumps when lines were removed from a document.
   *
   * Vim doesn't actually remove deleted lines. Instead, it seems to shift line numbers down
   * for any jumps after the deleted text, and preserves position for jumps on deleted lines or
   * lines above the deleted lines. After lines are shifted, if there are multiple jumps on a line,
   * the duplicates are removed, preserving the newest jumps (preserving latest column number).
   *
   * Lines are shifted based on number of lines deleted before the jump. So if e.g. the jump is on
   * a middle line #6, where the jump above and below it were also deleted, the jump position would
   * move down just one so it is now line #5, based on the line above it being deleted.
   *
   * @param document - Document that was changed, typically a vscode.TextDocument.
   * @param range - Location where the text was removed.
   */
  public handleTextDeleted(document: { fileName: string }, range: vscode.Range): void {
    // Note that this is like Array.slice, such that range.end.line is one line AFTER a deleted line,
    // so distance is expected to be at least 1.
    const distance = range.end.line - range.start.line;

    for (let i = this._jumps.length - 1; i >= 0; i--) {
      const jump = this._jumps[i];

      if (jump.fileName !== document.fileName) {
        continue;
      }

      const jumpIsAfterDeletedText = jump.position.line > range.start.line;

      if (jumpIsAfterDeletedText) {
        const newLineShiftedUp =
          jump.position.line - Math.min(jump.position.line - range.start.line, distance);
        const newPosition = new Position(newLineShiftedUp, jump.position.character);

        this.changePositionForJumpNumber(i, jump, newPosition);
      }
    }

    this.removeDuplicateJumps();
  }

  /**
   * Clear existing jumps and reset jump position.
   */
  public clearJumps(): void {
    this._jumps.splice(0, this._jumps.length);
    this._currentJumpNumber = 0;
  }

  private pushJump(from: Jump | null, to?: Jump) {
    if (from) {
      this.clearJumpsOnSameLine(from);
    }

    if (from && (!to || !from.isSamePosition(to))) {
      if (this._jumps.length === MAX_JUMPS) {
        this._jumps.splice(0, 1);
      }

      this._jumps.push(from);
    }

    this._currentJumpNumber = this._jumps.length;
  }

  private changePositionForJumpNumber(index: number, jump: Jump, newPosition: Position) {
    this._jumps.splice(
      index,
      1,
      new Jump({
        document: jump.document,
        position: newPosition,
      }),
    );
  }

  private clearJumpsOnSameLine(jump: Jump): void {
    this._jumps = this._jumps.filter(
      (j) =>
        j === jump || !(j.fileName === jump.fileName && j.position.line === jump.position.line),
    );
  }

  private removeDuplicateJumps() {
    const linesSeenPerFile = new Map<string, number[]>();
    for (let i = this._jumps.length - 1; i >= 0; i--) {
      const jump = this._jumps[i];

      if (!linesSeenPerFile.has(jump.fileName)) {
        linesSeenPerFile.set(jump.fileName, []);
      }

      const lines = linesSeenPerFile.get(jump.fileName)!;

      if (lines.includes(jump.position.line)) {
        this._jumps.splice(i, 1);
      } else {
        lines.push(jump.position.line);
      }
    }
  }
}
