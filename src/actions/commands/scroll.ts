import * as vscode from 'vscode';
import { clamp } from 'lodash';
import { Position } from 'vscode';
import { configuration } from '../../configuration/configuration';
import { Mode, isVisualMode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { EditorScrollDirection, EditorScrollByUnit, TextEditor } from '../../textEditor';
import { BaseCommand, RegisterAction } from '../base';

abstract class CommandEditorScroll extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  override runsOnceForEachCountPrefix = false;
  abstract to: EditorScrollDirection;
  abstract by: EditorScrollByUnit;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const timesToRepeat = vimState.recordedState.count || 1;
    const scrolloff = configuration
      .getConfiguration('editor')
      .get<number>('cursorSurroundingLines', 0);

    const visibleRange = vimState.editor.visibleRanges[0];
    if (visibleRange === undefined) {
      return;
    }

    const linesAboveCursor =
      visibleRange.end.line - vimState.cursorStopPosition.line - timesToRepeat;
    const linesBelowCursor =
      vimState.cursorStopPosition.line - visibleRange.start.line - timesToRepeat;
    if (this.to === 'up' && scrolloff > linesAboveCursor) {
      vimState.cursorStopPosition = vimState.cursorStopPosition
        .getUp(scrolloff - linesAboveCursor)
        .withColumn(vimState.desiredColumn);
    } else if (this.to === 'down' && scrolloff > linesBelowCursor) {
      vimState.cursorStopPosition = vimState.cursorStopPosition
        .getDown(scrolloff - linesBelowCursor)
        .withColumn(vimState.desiredColumn);
    }

    vimState.postponedCodeViewChanges.push({
      command: 'editorScroll',
      args: {
        to: this.to,
        by: this.by,
        value: timesToRepeat,
        select: isVisualMode(vimState.currentMode),
      },
    });
  }
}

@RegisterAction
class CommandCtrlE extends CommandEditorScroll {
  keys = ['<C-e>'];
  override preservesDesiredColumn = true;
  to: EditorScrollDirection = 'down';
  by: EditorScrollByUnit = 'line';
}

@RegisterAction
class CommandCtrlY extends CommandEditorScroll {
  keys = ['<C-y>'];
  override preservesDesiredColumn = true;
  to: EditorScrollDirection = 'up';
  by: EditorScrollByUnit = 'line';
}

/**
 * Commands like `<C-d>` and `<C-f>` act *sort* of like `<count><C-e>`, but they move
 * your cursor down and put it on the first non-whitespace character of the line.
 */
abstract class CommandScrollAndMoveCursor extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  override runsOnceForEachCountPrefix = false;
  abstract to: EditorScrollDirection;

  /**
   * @returns the number of lines this command should move the cursor
   */
  protected abstract getNumLines(visibleRanges: readonly vscode.Range[]): number;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const { visibleRanges } = vimState.editor;
    if (visibleRanges.length === 0) {
      return;
    }

    const smoothScrolling = configuration
      .getConfiguration('editor')
      .get<boolean>('smoothScrolling', false);

    const timesToRepeat = vimState.recordedState.count || 1;
    const moveLines = timesToRepeat * this.getNumLines(visibleRanges);

    let scrollLines = moveLines;
    if (this.to === 'down') {
      // This makes <C-d> less wonky when `editor.scrollBeyondLastLine` is enabled
      scrollLines = Math.min(
        moveLines,
        vimState.document.lineCount - 1 - visibleRanges[visibleRanges.length - 1].end.line,
      );
    }

    if (scrollLines > 0) {
      const args = {
        to: this.to,
        by: 'line',
        value: scrollLines,
        revealCursor: smoothScrolling,
        select: isVisualMode(vimState.currentMode),
      };
      if (smoothScrolling) {
        await vscode.commands.executeCommand('editorScroll', args);
      } else {
        vimState.postponedCodeViewChanges.push({
          command: 'editorScroll',
          args,
        });
      }
    }

    const newPositionLine = clamp(
      position.line + (this.to === 'down' ? moveLines : -moveLines),
      0,
      vimState.document.lineCount - 1,
    );
    vimState.cursorStopPosition = new Position(
      newPositionLine,
      vimState.desiredColumn,
    ).obeyStartOfLine(vimState.document);
  }
}

@RegisterAction
class CommandMoveFullPageUp extends CommandScrollAndMoveCursor {
  keys = ['<C-b>'];
  to: EditorScrollDirection = 'up';

  protected getNumLines(visibleRanges: vscode.Range[]) {
    return visibleRanges[0].end.line - visibleRanges[0].start.line;
  }
}

@RegisterAction
class CommandMoveFullPageDown extends CommandScrollAndMoveCursor {
  keys = ['<C-f>'];
  to: EditorScrollDirection = 'down';

  protected getNumLines(visibleRanges: vscode.Range[]) {
    return visibleRanges[0].end.line - visibleRanges[0].start.line;
  }
}

@RegisterAction
class CommandMoveHalfPageDown extends CommandScrollAndMoveCursor {
  keys = ['<C-d>'];
  to: EditorScrollDirection = 'down';

  protected getNumLines(visibleRanges: vscode.Range[]) {
    return configuration.getScrollLines(visibleRanges);
  }
}

@RegisterAction
class CommandMoveHalfPageUp extends CommandScrollAndMoveCursor {
  keys = ['<C-u>'];
  to: EditorScrollDirection = 'up';

  protected getNumLines(visibleRanges: vscode.Range[]) {
    return configuration.getScrollLines(visibleRanges);
  }
}

@RegisterAction
class CommandCenterScroll extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', 'z'];

  override preservesDesiredColumn = true;

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    // In these modes you want to center on the cursor position
    vimState.editor.revealRange(
      new vscode.Range(vimState.cursorStopPosition, vimState.cursorStopPosition),
      vscode.TextEditorRevealType.InCenter,
    );
  }
}

@RegisterAction
class CommandCenterScrollFirstChar extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', '.'];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    // In these modes you want to center on the cursor position
    // This particular one moves cursor to first non blank char though
    vimState.editor.revealRange(
      new vscode.Range(vimState.cursorStopPosition, vimState.cursorStopPosition),
      vscode.TextEditorRevealType.InCenter,
    );

    // Move cursor to first char of line
    vimState.cursorStopPosition = TextEditor.getFirstNonWhitespaceCharOnLine(
      vimState.document,
      vimState.cursorStopPosition.line,
    );
  }
}

@RegisterAction
class CommandTopScroll extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', 't'];

  override preservesDesiredColumn = true;

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'revealLine',
      args: {
        lineNumber: position.line,
        at: 'top',
      },
    });
  }
}

@RegisterAction
class CommandTopScrollFirstChar extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', '\n'];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    // In these modes you want to center on the cursor position
    // This particular one moves cursor to first non blank char though
    vimState.postponedCodeViewChanges.push({
      command: 'revealLine',
      args: {
        lineNumber: position.line,
        at: 'top',
      },
    });

    // Move cursor to first char of line
    vimState.cursorStopPosition = TextEditor.getFirstNonWhitespaceCharOnLine(
      vimState.document,
      vimState.cursorStopPosition.line,
    );
  }
}

@RegisterAction
class CommandBottomScroll extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', 'b'];

  override preservesDesiredColumn = true;

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'revealLine',
      args: {
        lineNumber: position.line,
        at: 'bottom',
      },
    });
  }
}

@RegisterAction
class CommandBottomScrollFirstChar extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', '-'];

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    // In these modes you want to center on the cursor position
    // This particular one moves cursor to first non blank char though
    vimState.postponedCodeViewChanges.push({
      command: 'revealLine',
      args: {
        lineNumber: position.line,
        at: 'bottom',
      },
    });

    // Move cursor to first char of line
    vimState.cursorStopPosition = TextEditor.getFirstNonWhitespaceCharOnLine(
      vimState.document,
      vimState.cursorStopPosition.line,
    );
  }
}
