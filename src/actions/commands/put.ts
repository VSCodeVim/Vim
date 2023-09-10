import * as vscode from 'vscode';
import { Position, TextDocument } from 'vscode';
import { laterOf, PositionDiff, sorted } from '../../common/motion/position';
import { configuration } from '../../configuration/configuration';
import { isVisualMode, Mode } from '../../mode/mode';
import { Register, RegisterMode, IRegisterContent } from '../../register/register';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { TextEditor } from '../../textEditor';
import { reportLinesChanged } from '../../util/statusBarTextUtils';
import { BaseCommand, RegisterAction } from '../base';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';
import { Cursor } from '../../common/motion/cursor';
import { Transformation } from '../../transformations/transformations';

function firstNonBlankChar(text: string): number {
  return text.match(/\S/)?.index ?? 0;
}

abstract class BasePutCommand extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  override createsUndoPoint = true;

  protected overwritesRegisterWithSelection = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const register = await Register.get(vimState.recordedState.registerName, this.multicursorIndex);
    if (register === undefined) {
      StatusBar.displayError(
        vimState,
        VimError.fromCode(ErrorCode.NothingInRegister, vimState.recordedState.registerName),
      );
      return;
    }

    const count = vimState.recordedState.count || 1;

    const mode =
      vimState.currentMode === Mode.CommandlineInProgress ? Mode.Normal : vimState.currentMode;
    const registerMode = this.getRegisterMode(register);

    const replaceRange = this.getReplaceRange(mode, vimState.cursors[0], registerMode);

    let text = this.getRegisterText(mode, register, count);
    if (this.shouldAdjustIndent(mode, registerMode)) {
      let lineToMatch: number | undefined;
      if (mode === Mode.VisualLine) {
        const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
        if (end.line < vimState.document.lineCount - 1) {
          lineToMatch = end.line + 1;
        } else if (start.line > 0) {
          lineToMatch = start.line - 1;
        }
      } else {
        lineToMatch = position.line;
      }
      text = this.adjustIndent(
        lineToMatch !== undefined ? vimState.document.lineAt(lineToMatch).text : '',
        text,
      );
    }

    const newCursorPosition = this.getCursorPosition(
      vimState.document,
      mode,
      replaceRange,
      registerMode,
      count,
      text,
    );

    vimState.recordedState.transformer.moveCursor(
      PositionDiff.exactPosition(newCursorPosition),
      this.multicursorIndex ?? 0,
    );

    if (registerMode === RegisterMode.LineWise) {
      text = this.adjustLinewiseRegisterText(mode, text);
    }

    for (const transformation of this.getTransformations(
      vimState.document,
      mode,
      replaceRange,
      registerMode,
      text,
    )) {
      vimState.recordedState.transformer.addTransformation(transformation);
    }

    // We do not run this in multi-cursor mode as it will overwrite the register for upcoming put iterations
    if (isVisualMode(mode) && !vimState.isMultiCursor) {
      // After using "p" or "P" in Visual mode the text that was put will be selected (from Vim's ":help gv").
      vimState.lastVisualSelection = {
        mode,
        start: replaceRange.start,
        end: replaceRange.start.advancePositionByText(text),
      };

      if (this.overwritesRegisterWithSelection) {
        vimState.recordedState.registerName = configuration.useSystemClipboard ? '*' : '"';
        Register.put(
          vimState,
          vimState.document.getText(replaceRange),
          this.multicursorIndex,
          true,
        );
      }
    }

    // Report lines changed
    let numNewlinesAfterPut = text.split('\n').length;
    if (registerMode === RegisterMode.LineWise) {
      numNewlinesAfterPut--;
    }
    reportLinesChanged(numNewlinesAfterPut, vimState);

    const isLastCursor =
      !vimState.isMultiCursor || vimState.cursors.length - 1 === this.multicursorIndex;
    // Place the cursor back into normal mode after all puts are completed
    if (isLastCursor) {
      await vimState.setCurrentMode(Mode.Normal);
    }
  }

  private getRegisterText(mode: Mode, register: IRegisterContent, count: number): string {
    if (register.text instanceof RecordedState) {
      return register.text.actionsRun
        .map((action) => action.keysPressed.join(''))
        .join('')
        .repeat(count);
    }

    if (register.registerMode === RegisterMode.CharacterWise) {
      return mode === Mode.VisualLine
        ? Array(count).fill(register.text).join('\n')
        : register.text.repeat(count);
    } else if (register.registerMode === RegisterMode.LineWise || mode === Mode.VisualLine) {
      return Array(count).fill(register.text).join('\n');
    } else if (register.registerMode === RegisterMode.BlockWise) {
      const lines = register.text.split('\n');
      const longestLength = Math.max(...lines.map((line) => line.length));
      return lines
        .map((line) => {
          const space = longestLength - line.length;
          const lineWithSpace = line + ' '.repeat(space);
          return lineWithSpace.repeat(count - 1) + line;
        })
        .join('\n');
    } else {
      throw new Error(`Unexpected RegisterMode ${register.registerMode}`);
    }
  }

  private adjustIndent(lineToMatch: string, text: string): string {
    const lines = text.split('\n');

    // Adjust indent to current line
    const tabSize = configuration.tabstop; // TODO: Use `editor.options.tabSize`, I think
    const indentationWidth = TextEditor.getIndentationLevel(lineToMatch, tabSize);
    const firstLineIdentationWidth = TextEditor.getIndentationLevel(lines[0], tabSize);

    return lines
      .map((line) => {
        const currentIdentationWidth = TextEditor.getIndentationLevel(line, tabSize);
        const newIndentationWidth =
          currentIdentationWidth - firstLineIdentationWidth + indentationWidth;

        // TODO: Use `editor.options.insertSpaces`, I think
        return TextEditor.setIndentationLevel(line, newIndentationWidth, configuration.expandtab);
      })
      .join('\n');
  }

  private getTransformations(
    document: TextDocument,
    mode: Mode,
    replaceRange: vscode.Range,
    registerMode: RegisterMode,
    text: string,
  ): Transformation[] {
    // Pasting block-wise content is very different, except in VisualLine mode, where it works exactly like line-wise
    if (registerMode === RegisterMode.BlockWise && mode !== Mode.VisualLine) {
      const transformations: Transformation[] = [];
      const lines = text.split('\n');
      const lineCount = Math.max(lines.length, replaceRange.end.line - replaceRange.start.line + 1);
      const longestLength = Math.max(...lines.map((line) => line.length));

      // Only relevant for Visual mode
      // If we replace 2 newlines, subsequent transformations need to take that into account (otherwise we get overlaps)
      let deletedNewlines = 0;

      for (let idx = 0; idx < lineCount; idx++) {
        const lineText = lines[idx] ?? '';

        let range: vscode.Range;
        if (mode === Mode.VisualBlock) {
          if (replaceRange.start.line + idx > replaceRange.end.line) {
            const pos = replaceRange.start.with({ line: replaceRange.start.line + idx });
            range = new vscode.Range(pos, pos);
          } else {
            range = new vscode.Range(
              replaceRange.start.with({ line: replaceRange.start.line + idx }),
              replaceRange.end.with({ line: replaceRange.start.line + idx }),
            );
          }
        } else {
          if (idx > 0) {
            const pos = replaceRange.start.with({
              line: replaceRange.start.line + idx + deletedNewlines,
            });
            range = new vscode.Range(pos, pos);
          } else {
            range = new vscode.Range(replaceRange.start, replaceRange.end);
            deletedNewlines = document.getText(range).split('\n').length - 1;
          }
        }

        const lineNumber = replaceRange.start.line + idx;
        if (lineNumber > document.lineCount - 1) {
          transformations.push({
            type: 'replaceText',
            range,
            text: '\n' + ' '.repeat(replaceRange.start.character) + lineText,
          });
        } else {
          const lineLength = document.lineAt(lineNumber).text.length;
          const leftPadding = Math.max(replaceRange.start.character - lineLength, 0);
          let rightPadding = 0;
          if (
            mode !== Mode.VisualBlock &&
            ((lineNumber <= replaceRange.end.line && replaceRange.end.character < lineLength) ||
              (lineNumber > replaceRange.end.line && replaceRange.start.character < lineLength))
          ) {
            rightPadding = longestLength - lineText.length;
          }
          transformations.push({
            type: 'replaceText',
            range,
            text: ' '.repeat(leftPadding) + lineText + ' '.repeat(rightPadding),
          });
        }
      }
      return transformations;
    }

    if (mode === Mode.Normal || mode === Mode.Visual || mode === Mode.VisualLine) {
      return [
        {
          type: 'replaceText',
          range: replaceRange,
          text,
        },
      ];
    } else if (mode === Mode.VisualBlock) {
      const transformations: Transformation[] = [];
      if (registerMode === RegisterMode.CharacterWise) {
        for (let line = replaceRange.start.line; line <= replaceRange.end.line; line++) {
          const range = new vscode.Range(
            new Position(line, replaceRange.start.character),
            new Position(line, replaceRange.end.character),
          );
          const lineText = !text.includes('\n') || line === replaceRange.start.line ? text : '';
          transformations.push({
            type: 'replaceText',
            range,
            text: lineText,
          });
        }
      } else if (registerMode === RegisterMode.LineWise) {
        // Weird case: first delete the block...
        for (let line = replaceRange.start.line; line <= replaceRange.end.line; line++) {
          const range = new vscode.Range(
            new Position(line, replaceRange.start.character),
            new Position(line, replaceRange.end.character),
          );
          transformations.push({
            type: 'replaceText',
            range,
            text: '',
          });
        }

        // ...then paste the lines before/after the block
        const insertPos = this.putBefore()
          ? new Position(replaceRange.start.line, 0)
          : new Position(replaceRange.end.line, 0).getLineEnd();
        transformations.push({
          type: 'replaceText',
          range: new vscode.Range(insertPos, insertPos),
          text,
        });
      } else {
        throw new Error(`Unexpected RegisterMode ${registerMode}`);
      }
      return transformations;
    } else {
      throw new Error(`Unexpected Mode ${mode}`);
    }
  }

  protected abstract putBefore(): boolean;

  protected abstract getRegisterMode(register: IRegisterContent): RegisterMode;

  protected abstract getReplaceRange(
    mode: Mode,
    cursor: Cursor,
    registerMode: RegisterMode,
  ): vscode.Range;

  protected abstract adjustLinewiseRegisterText(mode: Mode, text: string): string;

  protected abstract shouldAdjustIndent(mode: Mode, registerMode: RegisterMode): boolean;

  protected abstract getCursorPosition(
    document: TextDocument,
    mode: Mode,
    replaceRange: vscode.Range,
    registerMode: RegisterMode,
    count: number,
    text: string,
  ): Position;
}

@RegisterAction
class PutCommand extends BasePutCommand {
  keys: string[] | string[][] = ['p'];

  protected putBefore(): boolean {
    return false;
  }

  protected getRegisterMode(register: IRegisterContent): RegisterMode {
    return register.registerMode;
  }

  protected getReplaceRange(mode: Mode, cursor: Cursor, registerMode: RegisterMode): vscode.Range {
    if (mode === Mode.Normal) {
      let pos: Position;
      if (registerMode === RegisterMode.CharacterWise || registerMode === RegisterMode.BlockWise) {
        pos = cursor.stop.getRight();
      } else if (registerMode === RegisterMode.LineWise) {
        pos = cursor.stop.getLineEnd();
      } else {
        throw new Error(`Unexpected RegisterMode ${registerMode}`);
      }
      return new vscode.Range(pos, pos);
    } else if (mode === Mode.Visual) {
      const [start, end] = sorted(cursor.start, cursor.stop);
      return new vscode.Range(start, end.getRight());
    } else if (mode === Mode.VisualLine) {
      const [start, end] = sorted(cursor.start, cursor.stop);
      return new vscode.Range(start.getLineBegin(), end.getLineEnd());
    } else {
      const [start, end] = sorted(cursor.start, cursor.stop);
      return new vscode.Range(start, end.getRight());
    }
  }

  protected adjustLinewiseRegisterText(mode: Mode, text: string): string {
    if (mode === Mode.Normal || mode === Mode.VisualBlock) {
      return '\n' + text;
    } else if (mode === Mode.Visual) {
      return '\n' + text + '\n';
    } else {
      return text;
    }
  }

  protected shouldAdjustIndent(mode: Mode, registerMode: RegisterMode): boolean {
    return false;
  }

  protected getCursorPosition(
    document: TextDocument,
    mode: Mode,
    replaceRange: vscode.Range,
    registerMode: RegisterMode,
    count: number,
    text: string,
  ): Position {
    const rangeStart = replaceRange.start;
    if (mode === Mode.Normal || mode === Mode.Visual) {
      if (registerMode === RegisterMode.CharacterWise) {
        return text.includes('\n') ? rangeStart : rangeStart.advancePositionByText(text).getLeft();
      } else if (registerMode === RegisterMode.LineWise) {
        return new Position(rangeStart.line + 1, firstNonBlankChar(text));
      } else if (registerMode === RegisterMode.BlockWise) {
        return rangeStart;
      } else {
        throw new Error(`Unexpected RegisterMode ${registerMode}`);
      }
    } else if (mode === Mode.VisualLine) {
      return rangeStart.with({ character: firstNonBlankChar(text) });
    } else if (mode === Mode.VisualBlock) {
      if (registerMode === RegisterMode.LineWise) {
        return new Position(replaceRange.end.line + 1, firstNonBlankChar(text));
      } else if (registerMode === RegisterMode.BlockWise) {
        return rangeStart;
      } else {
        return rangeStart.with({ character: rangeStart.character + text.length - 1 });
      }
    } else {
      throw new Error(`Unexpected Mode ${mode}`);
    }
  }
}

@RegisterAction
class PutBeforeCommand extends PutCommand {
  override keys: string[] | string[][] = ['P'];

  // Since Vim 9.0, Visual `P` does not overwrite the unnamed register with selection's contents
  override overwritesRegisterWithSelection = false;

  protected override putBefore(): boolean {
    return true;
  }

  protected override adjustLinewiseRegisterText(mode: Mode, text: string): string {
    if (mode === Mode.Normal || mode === Mode.VisualBlock) {
      return text + '\n';
    }

    return super.adjustLinewiseRegisterText(mode, text);
  }

  protected override getReplaceRange(
    mode: Mode,
    cursor: Cursor,
    registerMode: RegisterMode,
  ): vscode.Range {
    if (mode === Mode.Normal) {
      if (registerMode === RegisterMode.CharacterWise || registerMode === RegisterMode.BlockWise) {
        const pos = cursor.stop;
        return new vscode.Range(pos, pos);
      } else if (registerMode === RegisterMode.LineWise) {
        const pos = cursor.stop.getLineBegin();
        return new vscode.Range(pos, pos);
      }
    }

    return super.getReplaceRange(mode, cursor, registerMode);
  }

  protected override getCursorPosition(
    document: TextDocument,
    mode: Mode,
    replaceRange: vscode.Range,
    registerMode: RegisterMode,
    count: number,
    text: string,
  ): Position {
    const rangeStart = replaceRange.start;
    if (mode === Mode.Normal || mode === Mode.VisualBlock) {
      if (registerMode === RegisterMode.LineWise) {
        return rangeStart.with({ character: firstNonBlankChar(text) });
      }
    }

    return super.getCursorPosition(document, mode, replaceRange, registerMode, count, text);
  }
}

function PlaceCursorAfterText<TBase extends new (...args: any[]) => PutCommand>(Base: TBase) {
  return class CursorAfterText extends Base {
    protected override getCursorPosition(
      document: TextDocument,
      mode: Mode,
      replaceRange: vscode.Range,
      registerMode: RegisterMode,
      count: number,
      text: string,
    ): Position {
      const rangeStart = replaceRange.start;
      if (mode === Mode.Normal || mode === Mode.Visual) {
        if (registerMode === RegisterMode.CharacterWise) {
          if (text.includes('\n')) {
            // Weird case: if there's a newline, the cursor goes to the same place, regardless of [count]
            // HACK: We're undoing the repeat() here - definitely a bit janky
            text = text.slice(0, text.length / count);
          }
          return rangeStart.advancePositionByText(text);
        } else if (registerMode === RegisterMode.LineWise) {
          let line = rangeStart.line + text.split('\n').length;
          if (
            mode === Mode.Visual ||
            (!this.putBefore() && rangeStart.line < document.lineCount - 1)
          ) {
            line++;
          }
          return new Position(line, 0);
        } else if (registerMode === RegisterMode.BlockWise) {
          const lines = text.split('\n');
          const lastLine = rangeStart.line + lines.length - 1;
          const longestLineLength = Math.max(...lines.map((line) => line.length));
          return new Position(lastLine, rangeStart.character + longestLineLength);
        }
      } else if (mode === Mode.VisualLine) {
        return new Position(rangeStart.line + text.split('\n').length, 0);
      } else if (mode === Mode.VisualBlock) {
        const lines = text.split('\n');
        if (registerMode === RegisterMode.LineWise) {
          if (this.putBefore()) {
            return new Position(rangeStart.line + lines.length, 0);
          } else {
            return new Position(replaceRange.end.line + lines.length + 1, 0);
          }
        } else if (registerMode === RegisterMode.BlockWise) {
          return new Position(
            replaceRange.start.line + lines.length - 1,
            replaceRange.start.character + lines[lines.length - 1].length,
          );
        } else {
          return rangeStart.with({ character: rangeStart.character + text.length });
        }
      }

      return super.getCursorPosition(document, mode, replaceRange, registerMode, count, text);
    }
  };
}

@RegisterAction
@PlaceCursorAfterText
class GPutCommand extends PutCommand {
  override keys = ['g', 'p'];
}

@RegisterAction
@PlaceCursorAfterText
class GPutBeforeCommand extends PutBeforeCommand {
  override keys = ['g', 'P'];
  override overwritesRegisterWithSelection = true;
}

function AdjustIndent<TBase extends new (...args: any[]) => PutCommand>(Base: TBase) {
  return class AdjustedIndent extends Base {
    protected override shouldAdjustIndent(mode: Mode, registerMode: RegisterMode): boolean {
      return (
        (mode === Mode.Normal || mode === Mode.VisualLine) && registerMode === RegisterMode.LineWise
      );
    }
  };
}

@RegisterAction
@AdjustIndent
class PutWithIndentCommand extends PutCommand {
  override keys = [']', 'p'];
}

@RegisterAction
@AdjustIndent
class PutBeforeWithIndentCommand extends PutBeforeCommand {
  override keys = [
    ['[', 'P'],
    [']', 'P'],
    ['[', 'p'],
  ];
}

function ExCommand<TBase extends new (...args: any[]) => PutCommand>(Base: TBase) {
  return class Ex extends Base {
    private insertLine?: number;

    public setInsertionLine(insertLine: number) {
      this.insertLine = insertLine;
    }

    protected override getRegisterMode(register: IRegisterContent): RegisterMode {
      return RegisterMode.LineWise;
    }

    protected override getReplaceRange(
      mode: Mode,
      cursor: Cursor,
      registerMode: RegisterMode,
    ): vscode.Range {
      const line = this.insertLine ?? laterOf(cursor.start, cursor.stop).line;
      const pos = this.putBefore() ? new Position(line, 0) : new Position(line, 0).getLineEnd();
      return new vscode.Range(pos, pos);
    }

    protected override getCursorPosition(
      document: TextDocument,
      mode: Mode,
      replaceRange: vscode.Range,
      registerMode: RegisterMode,
      count: number,
      text: string,
    ): Position {
      const lines = text.split('\n');
      return new Position(
        replaceRange.start.line + lines.length - (this.putBefore() ? 1 : 0),
        firstNonBlankChar(lines[lines.length - 1]),
      );
    }
  };
}

export const PutFromCmdLine = ExCommand(PutCommand);
export const PutBeforeFromCmdLine = ExCommand(PutBeforeCommand);
