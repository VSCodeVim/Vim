import * as vscode from 'vscode';
import { Position } from 'vscode';
import { PositionDiff, laterOf } from '../../common/motion/position';
import { VimState } from '../../state/vimState';
import { Transformation } from '../../transformations/transformations';
import { BaseCommand } from '../base';

/**
 * A very special snowflake.
 *
 * Each keystroke when typing in Insert mode is its own Action, which means naively replaying a
 * realistic insertion (via `.` or a macro) does many small insertions, which is very slow.
 * So instead, we fold all those actions after the fact into a single DocumentContentChangeAction,
 * which compresses the changes, generally into a single document edit per cursor.
 */
export class DocumentContentChangeAction extends BaseCommand {
  modes = [];
  keys = [];
  private readonly cursorStart: Position;
  private cursorEnd: Position;

  constructor(cursorStart: Position) {
    super();
    this.cursorStart = cursorStart;
    this.cursorEnd = cursorStart;
  }

  private contentChanges: vscode.TextDocumentContentChangeEvent[] = [];

  public addChanges(changes: vscode.TextDocumentContentChangeEvent[], cursorPosition: Position) {
    this.contentChanges = [...this.contentChanges, ...changes];
    this.compressChanges();
    this.cursorEnd = cursorPosition;
  }

  public getTransformation(positionDiff: PositionDiff): Transformation {
    return {
      type: 'contentChange',
      changes: this.contentChanges,
      diff: positionDiff,
    };
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (this.contentChanges.length === 0) {
      return;
    }

    let originalLeftBoundary = this.cursorStart;

    let rightBoundary: Position = position;
    for (const change of this.contentChanges) {
      if (change.range.start.line < originalLeftBoundary.line) {
        // This change should be ignored
        const linesAffected = change.range.end.line - change.range.start.line + 1;
        const resultLines = change.text.split('\n').length;
        originalLeftBoundary = originalLeftBoundary.with(
          Math.max(0, originalLeftBoundary.line + resultLines - linesAffected),
        );
        continue;
      }

      // Translates diffPos from a position relative to originalLeftBoundary to one relative to position
      const translate = (diffPos: Position): Position => {
        const lineOffset = diffPos.line - originalLeftBoundary.line;
        const char =
          lineOffset === 0
            ? position.character + diffPos.character - originalLeftBoundary.character
            : diffPos.character;
        // TODO: Should we document.validate() this position?
        return new Position(Math.max(position.line + lineOffset, 0), Math.max(char, 0));
      };

      const replaceRange = new vscode.Range(
        translate(change.range.start),
        translate(change.range.end),
      );

      if (replaceRange.start.isAfter(rightBoundary)) {
        // This change should be ignored as it's out of boundary
        continue;
      }

      // Calculate new right boundary
      const textDiffLines = change.text.split('\n');
      const numLinesAdded = textDiffLines.length - 1;
      const newRightBoundary =
        numLinesAdded === 0
          ? new Position(replaceRange.start.line, replaceRange.start.character + change.text.length)
          : new Position(replaceRange.start.line + numLinesAdded, textDiffLines.pop()!.length);

      rightBoundary = laterOf(rightBoundary, newRightBoundary);

      if (replaceRange.start.isEqual(replaceRange.end)) {
        vimState.recordedState.transformer.insert(
          replaceRange.start,
          change.text,
          PositionDiff.exactPosition(translate(this.cursorEnd)),
        );
      } else {
        vimState.recordedState.transformer.replace(
          replaceRange,
          change.text,
          PositionDiff.exactPosition(translate(this.cursorEnd)),
        );
      }
    }
  }

  private compressChanges(): void {
    const merge = (
      first: vscode.TextDocumentContentChangeEvent,
      second: vscode.TextDocumentContentChangeEvent,
    ): vscode.TextDocumentContentChangeEvent | undefined => {
      if (first.rangeOffset + first.text.length === second.rangeOffset) {
        // Simple concatenation
        return {
          text: first.text + second.text,
          range: first.range,
          rangeOffset: first.rangeOffset,
          rangeLength: first.rangeLength,
        };
      } else if (
        first.rangeOffset <= second.rangeOffset &&
        first.text.length >= second.rangeLength
      ) {
        const start = second.rangeOffset - first.rangeOffset;
        const end = start + second.rangeLength;
        const text = first.text.slice(0, start) + second.text + first.text.slice(end);
        // `second` replaces part of `first`
        // Most often, this is the result of confirming an auto-completion
        return {
          text,
          range: first.range,
          rangeOffset: first.rangeOffset,
          rangeLength: first.rangeLength,
        };
      } else {
        // TODO: Do any of the cases falling into this `else` matter?
        // TODO: YES - make an insertion and then autocomplete to something totally different (replace subsumes insert)
        return undefined;
      }
    };

    const compressed: vscode.TextDocumentContentChangeEvent[] = [];
    let prev: vscode.TextDocumentContentChangeEvent | undefined;
    for (const change of this.contentChanges) {
      if (prev === undefined) {
        prev = change;
      } else {
        const merged = merge(prev, change);
        if (merged) {
          prev = merged;
        } else {
          compressed.push(prev);
          prev = change;
        }
      }
    }
    if (prev !== undefined) {
      compressed.push(prev);
    }
    this.contentChanges = compressed;
  }
}
