import * as vscode from 'vscode';
import { Position } from 'vscode';

import { VimState } from '../state/vimState';

/**
 * Represents a Jump in the JumpTracker.
 * Includes information necessary to determine jump actions,
 * and to be able to open the related file.
 */
export class Jump {
  public readonly document: vscode.TextDocument;
  public readonly position: Position;

  /**
   *
   * @param options
   * @param options.editor - The editor associated with the jump.
   * @param options.position - The line and column number information.
   */
  constructor({ document, position }: { document: vscode.TextDocument; position: Position }) {
    this.document = document;
    this.position = position;
  }

  public get fileName() {
    return this.document.fileName;
  }

  /**
   * Factory method for creating a Jump from a VimState's current cursor position.
   * @param vimState - State that contains the fileName and position for the jump
   */
  public static fromStateNow(vimState: VimState) {
    return new Jump({
      document: vimState.document,
      position: vimState.cursorStopPosition,
    });
  }

  /**
   * Factory method for creating a Jump from a VimState's cursor position,
   * before any actions or commands were performed.
   * @param vimState - State that contains the fileName and prior position for the jump
   */
  public static fromStateBefore(vimState: VimState) {
    return new Jump({
      document: vimState.document,
      position: vimState.cursorsInitialState[0].stop,
    });
  }

  /**
   * Determine whether another jump matches the same file path, line number, and character column.
   * @param other - Another Jump to compare against
   */
  public isSamePosition(other: Jump): boolean {
    return this.fileName === other.fileName && this.position.isEqual(other.position);
  }
}
