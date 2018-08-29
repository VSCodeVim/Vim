import * as vscode from 'vscode';

import { Position } from '../common/motion/position';
import { VimState } from '../state/vimState';

/**
 * Represents a Jump in the JumpTracker.
 * Includes information necessary to determine jump actions, and to
 * be able to open the related file.
 */
export class Jump {
  public editor: vscode.TextEditor;
  public fileName: string;
  public position: Position;

  /**
   *
   * @param options
   * @param options.editor - The editor associated with the jump.
   * @param options.fileName - The absolute or relative file path.
   * @param options.position - The line and column number information.
   */
  constructor({
    editor,
    fileName,
    position,
  }: {
    editor: vscode.TextEditor;
    fileName: string;
    position: Position;
  }) {
    if (!fileName) {
      throw new Error('fileName is required for Jumps');
    }
    this.editor = editor;
    // TODO - can we just always require editor and get filename from it?
    this.fileName = fileName;
    this.position = position;
  }

  /**
   * Factory method for creating a Jump from a VimState.
   * @param vimState - State that contains the fileName and position for the jump
   */
  static fromState(vimState: VimState) {
    return new Jump({
      editor: vimState.editor,
      fileName: vimState.editor.document.fileName,
      position: vimState.cursorPosition,
    });
  }

  /**
   * Determine whether another jump matches the same file path and line number,
   * regardless of whether the column numbers match.
   *
   * @param other - Another Jump to compare against
   */
  public onSameLine(other: Jump | null | undefined): boolean {
    return (
      !other || (this.fileName === other.fileName && this.position.line === other.position.line)
    );
  }
}
