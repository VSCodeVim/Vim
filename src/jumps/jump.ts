import * as vscode from 'vscode';

import { Position } from '../common/motion/position';
import { VimState } from '../state/vimState';

/**
 * Represents a Jump in the JumpTracker.
 * Includes information necessary to determine jump actions,
 * and to be able to open the related file.
 */
export class Jump {
  public editor: vscode.TextEditor | null;
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
    editor: vscode.TextEditor | null;
    fileName: string;
    position: Position;
  }) {
    this.editor = editor;
    this.fileName = fileName;
    this.position = position;
  }

  /**
   * Factory method for creating a Jump from a VimState's current cursor position.
   * @param vimState - State that contains the fileName and position for the jump
   */
  static fromStateNow(vimState: VimState) {
    return new Jump({
      editor: vimState.editor,
      fileName: vimState.editor.document.fileName,
      position: vimState.cursorPosition,
    });
  }

  /**
   * Factory method for creating a Jump from a VimState's cursor position,
   * before any actions or commands were performed.
   * @param vimState - State that contains the fileName and prior position for the jump
   */
  static fromStateBefore(vimState: VimState) {
    return new Jump({
      editor: vimState.editor,
      fileName: vimState.editor.document.fileName,
      position: vimState.cursorPositionJustBeforeAnythingHappened[0],
    });
  }

  /**
   * Factory method for creating a Jump from a VimState's cursor position,
   * after the last event from the Vim extension itself, or the
   * last event detected by the Vim extension.
   * Typically should match vimState.cursorPosition, unless a command has occurred that
   * hasn't finished being handled, or an update wasn't detected.
   * @param vimState - State that contains the fileName and prior position for the jump
   */
  static fromStateAfterLastEvent(vimState: VimState) {
    return new Jump({
      editor: vimState.editor,
      fileName: vimState.editor.document.fileName,
      position: vimState.cursorPositionAfterLastEvent[0],
    });
  }

  /**
   * Factory method for creating a Jump from a vscode.TextEditor's cursor start position.
   * @param editor - Editor that contains the filename and position of the jump.
   */
  static fromTextEditor(editor: vscode.TextEditor) {
    return new Jump({
      editor,
      fileName: editor.document.fileName,
      position: new Position(editor.selection.start.line, editor.selection.start.character),
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
