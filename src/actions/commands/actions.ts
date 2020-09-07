import * as vscode from 'vscode';

import { RecordedState } from '../../state/recordedState';
import { ReplaceState } from '../../state/replaceState';
import { VimState } from '../../state/vimState';
import { getCursorsAfterSync, clamp } from '../../util/util';
import { Clipboard } from '../../util/clipboard';
import { FileCommand } from './../../cmd_line/commands/file';
import { OnlyCommand } from './../../cmd_line/commands/only';
import { QuitCommand } from './../../cmd_line/commands/quit';
import { Tab, TabCommand } from './../../cmd_line/commands/tab';
import { Position, PositionDiff, earlierOf, laterOf, sorted } from './../../common/motion/position';
import { Range } from './../../common/motion/range';
import { NumericString } from './../../common/number/numericString';
import { configuration } from './../../configuration/configuration';
import {
  Mode,
  visualBlockGetTopLeftPosition,
  isVisualMode,
  visualBlockGetBottomRightPosition,
} from './../../mode/mode';
import { Register, RegisterMode } from './../../register/register';
import { SearchDirection, SearchState } from './../../state/searchState';
import { EditorScrollByUnit, EditorScrollDirection, TextEditor } from './../../textEditor';
import { isTextTransformation, Transformation } from './../../transformations/transformations';
import { RegisterAction, BaseCommand } from './../base';
import { BaseAction } from './../base';
import { commandLine } from './../../cmd_line/commandLine';
import * as operator from './../operator';
import { Jump } from '../../jumps/jump';
import { StatusBar } from '../../statusBar';
import { reportFileInfo, reportSearch } from '../../util/statusBarTextUtils';
import { globalState } from '../../state/globalState';
import { VimError, ErrorCode } from '../../error';
import { SpecialKeys } from '../../util/specialKeys';
import _ = require('lodash');

export class DocumentContentChangeAction extends BaseAction {
  private contentChanges: vscode.TextDocumentContentChangeEvent[] = [];

  public addChanges(changes: vscode.TextDocumentContentChangeEvent[]) {
    this.contentChanges = [...this.contentChanges, ...changes];
    this.compressChanges();
  }

  public getTransformation(positionDiff: PositionDiff): Transformation {
    return {
      type: 'contentChange',
      changes: this.contentChanges,
      diff: positionDiff,
    };
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (this.contentChanges.length === 0) {
      return;
    }

    const firstTextDiff = this.contentChanges[0];
    let originalLeftBoundary =
      firstTextDiff.text === '' && firstTextDiff.rangeLength === 1
        ? firstTextDiff.range.end
        : firstTextDiff.range.start;

    let rightBoundary: Position = position;
    let replaceRange: Range | undefined;
    for (const change of this.contentChanges) {
      if (change.range.start.line < originalLeftBoundary.line) {
        // This change should be ignored
        const linesAffected = change.range.end.line - change.range.start.line + 1;
        const resultLines = change.text.split('\n').length;
        originalLeftBoundary = originalLeftBoundary.with(
          originalLeftBoundary.line + resultLines - linesAffected
        );
        continue;
      }

      // Translates diffPos from a position relative to originalLeftBoundary to one relative to position
      const translate = (diffPos: vscode.Position): Position => {
        const lineOffset = diffPos.line - originalLeftBoundary.line;
        const char =
          lineOffset === 0
            ? position.character + diffPos.character - originalLeftBoundary.character
            : diffPos.character;
        return new Position(position.line + lineOffset, char);
      };

      replaceRange = new Range(translate(change.range.start), translate(change.range.end));

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

      vimState.editor.selection = new vscode.Selection(replaceRange.start, replaceRange.stop);

      if (replaceRange.start.isEqual(replaceRange.stop)) {
        await TextEditor.insert(change.text, Position.FromVSCodePosition(replaceRange.start));
      } else {
        await TextEditor.replace(vimState.editor.selection, change.text);
      }
    }

    /**
     * We're making an assumption here that content changes are always in order, and I'm not sure
     * we're guaranteed that, but it seems to work well enough in practice.
     */
    if (replaceRange) {
      const lastChange = this.contentChanges[this.contentChanges.length - 1];

      vimState.cursorStartPosition = vimState.cursorStopPosition = replaceRange.start.advancePositionByText(
        lastChange.text
      );
    }

    await vimState.setCurrentMode(Mode.Insert);
  }

  private compressChanges(): void {
    function merge(
      first: vscode.TextDocumentContentChangeEvent,
      second: vscode.TextDocumentContentChangeEvent
    ): vscode.TextDocumentContentChangeEvent | undefined {
      if (
        first.rangeOffset + first.text.length !== second.rangeOffset ||
        second.rangeLength !== 0
      ) {
        // TODO: We should be able to do better, but I'm not sure if this is actually relevant.
        return undefined;
      }

      return {
        text: first.text + second.text,
        range: first.range,
        rangeOffset: first.rangeOffset,
        rangeLength: first.rangeLength,
      };
    }

    let compressed: vscode.TextDocumentContentChangeEvent[] = [];
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

@RegisterAction
class DisableExtension extends BaseCommand {
  modes = [
    Mode.Normal,
    Mode.Insert,
    Mode.Visual,
    Mode.VisualBlock,
    Mode.VisualLine,
    Mode.SearchInProgressMode,
    Mode.CommandlineInProgress,
    Mode.Replace,
    Mode.EasyMotionMode,
    Mode.EasyMotionInputMode,
    Mode.SurroundInputMode,
  ];
  keys = [SpecialKeys.ExtensionDisable];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Disabled);
  }
}

@RegisterAction
class EnableExtension extends BaseCommand {
  modes = [Mode.Disabled];
  keys = [SpecialKeys.ExtensionEnable];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
export class CommandNumber extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['<number>'];
  isCompleteAction = false;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const number = parseInt(this.keysPressed[0], 10);
    const operatorCount = vimState.recordedState.operatorCount;

    if (operatorCount > 0) {
      const lastAction =
        vimState.recordedState.actionsRun[vimState.recordedState.actionsRun.length - 2];
      if (!(lastAction instanceof CommandNumber)) {
        // We have set an operatorCount !== 0 after an operator, but now we got another count
        // number so we need to multiply them.
        vimState.recordedState.count = operatorCount * number;
      } else {
        // We are now getting another digit which means we need to multiply by 10 and add
        // the new digit multiplied by operatorCount.
        //
        // Example: user presses '2d31w':
        // - After '2' the number 2 is stored in 'count'
        // - After 'd' the count (2) is stored in 'operatorCount'
        // - After '3' the number 3 multiplied by 'operatorCount' (3 x 2 = 6) is stored in 'count'
        // - After '1' the count is multiplied by 10 and added by number 1 multiplied by 'operatorCount'
        //   (6 * 10 + 1 * 2 = 62)
        // The final result will be the deletion of 62 words.
        vimState.recordedState.count = vimState.recordedState.count * 10 + number * operatorCount;
      }
    } else {
      vimState.recordedState.count = vimState.recordedState.count * 10 + number;
    }
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const isZero = keysPressed[0] === '0';

    return (
      super.doesActionApply(vimState, keysPressed) &&
      ((isZero && vimState.recordedState.count > 0) || !isZero)
    );
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const isZero = keysPressed[0] === '0';

    return (
      super.couldActionApply(vimState, keysPressed) &&
      ((isZero && vimState.recordedState.count > 0) || !isZero)
    );
  }
}

@RegisterAction
export class CommandRegister extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['"', '<character>'];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const register = this.keysPressed[1];
    vimState.recordedState.registerName = register;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = keysPressed[1];

    return super.doesActionApply(vimState, keysPressed) && Register.isValidRegister(register);
  }
}

@RegisterAction
class CommandRecordMacro extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['q', '<alpha>'],
    ['q', '<number>'],
    ['q', '"'],
  ];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const registerKey = this.keysPressed[1];
    const register = registerKey.toLocaleLowerCase();
    vimState.macro = new RecordedState();
    vimState.macro.registerName = register;

    if (!/^[A-Z]+$/.test(registerKey) || !Register.has(register)) {
      // If register name is upper case, it means we are appending commands to existing register instead of overriding.
      let newRegister = new RecordedState();
      newRegister.registerName = register;
      Register.putByKey(newRegister, register);
    }
  }
}

@RegisterAction
export class CommandQuitRecordMacro extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['q'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const macro = vimState.macro!;

    const existingMacro = (await Register.get(vimState, macro.registerName))?.text;
    if (existingMacro instanceof RecordedState) {
      existingMacro.actionsRun = existingMacro.actionsRun.concat(macro.actionsRun);
    }

    vimState.macro = undefined;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && vimState.macro !== undefined;
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.couldActionApply(vimState, keysPressed) && vimState.macro !== undefined;
  }
}

@RegisterAction
class CommandExecuteMacro extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['@', '<character>'];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const register = this.keysPressed[1].toLocaleLowerCase();
    if (Register.has(register)) {
      vimState.recordedState.transformations.push({
        type: 'macro',
        register: register,
        replay: 'contentChange',
      });
    }
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = keysPressed[1];

    return (
      super.doesActionApply(vimState, keysPressed) && Register.isValidRegisterForMacro(register)
    );
  }
}

@RegisterAction
class CommandExecuteLastMacro extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['@', '@'];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const { lastInvokedMacro } = vimState.historyTracker;

    if (lastInvokedMacro) {
      vimState.recordedState.transformations.push({
        type: 'macro',
        register: lastInvokedMacro.registerName,
        replay: 'contentChange',
      });
    }
  }
}

@RegisterAction
class CommandEsc extends BaseCommand {
  modes = [
    Mode.Visual,
    Mode.VisualLine,
    Mode.VisualBlock,
    Mode.Normal,
    Mode.SurroundInputMode,
    Mode.EasyMotionMode,
    Mode.EasyMotionInputMode,
  ];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  runsOnceForEveryCursor() {
    return false;
  }

  preservesDesiredColumn() {
    return true;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.currentMode === Mode.Normal) {
      vimState.surround = undefined;

      if (!vimState.isMultiCursor) {
        // If there's nothing to do on the vim side, we might as well call some
        // of vscode's default "close notification" actions. I think we should
        // just add to this list as needed.
        await Promise.all([
          vscode.commands.executeCommand('closeReferenceSearchEditor'),
          vscode.commands.executeCommand('closeMarkersNavigation'),
          vscode.commands.executeCommand('closeDirtyDiff'),
        ]);

        return;
      } else {
        vimState.isMultiCursor = false;
      }
    }

    if (vimState.currentMode === Mode.EasyMotionMode) {
      vimState.easyMotion.clearDecorations();
    }

    // Abort surround operation
    if (vimState.currentMode === Mode.SurroundInputMode) {
      vimState.surround = undefined;
    }

    await vimState.setCurrentMode(Mode.Normal);

    if (!vimState.isMultiCursor) {
      vimState.cursors = [vimState.cursors[0]];
    }
  }
}

@RegisterAction
class CommandEscReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const timesToRepeat = vimState.replaceState!.timesToRepeat;
    let textToAdd = '';

    for (let i = 1; i < timesToRepeat; i++) {
      textToAdd += vimState.replaceState!.newChars.join('');
    }

    vimState.recordedState.transformations.push({
      type: 'insertText',
      text: textToAdd,
      position: position,
      diff: new PositionDiff({ character: -1 }),
    });

    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandInsertReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<Insert>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
  }
}

abstract class CommandEditorScroll extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  runsOnceForEachCountPrefix = false;
  keys: string[];
  to: EditorScrollDirection;
  by: EditorScrollByUnit;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const timesToRepeat = vimState.recordedState.count || 1;
    const visibleRange = vimState.editor.visibleRanges[0];
    const scrolloff = configuration
      .getConfiguration('editor')
      .get<number>('cursorSurroundingLines', 0);

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
        revealCursor: true,
        select: isVisualMode(vimState.currentMode),
      },
    });
  }
}

@RegisterAction
class CommandCtrlE extends CommandEditorScroll {
  keys = ['<C-e>'];
  preservesDesiredColumn() {
    return true;
  }
  to: EditorScrollDirection = 'down';
  by: EditorScrollByUnit = 'line';
}

@RegisterAction
class CommandCtrlY extends CommandEditorScroll {
  keys = ['<C-y>'];
  preservesDesiredColumn() {
    return true;
  }
  to: EditorScrollDirection = 'up';
  by: EditorScrollByUnit = 'line';
}

/**
 * Commands like `<C-d>` and `<C-f>` act *sort* of like `<count><C-e>`, but they move
 * your cursor down and put it on the first non-whitespace character of the line.
 */
abstract class CommandScrollAndMoveCursor extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  runsOnceForEachCountPrefix = false;
  to: EditorScrollDirection;

  /**
   * @returns the number of lines this command should move the cursor
   */
  protected abstract getNumLines(vimState: VimState): number;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const { visibleRanges } = vimState.editor;
    const smoothScrolling = configuration.getConfiguration('editor').smoothScrolling;
    const moveLines = (vimState.actionCount || 1) * this.getNumLines(vimState);

    let scrollLines = moveLines;
    if (this.to === 'down') {
      // This makes <C-d> less wonky when `editor.scrollBeyondLastLine` is enabled
      scrollLines = Math.min(
        moveLines,
        TextEditor.getLineCount() - 1 - visibleRanges[visibleRanges.length - 1].end.line
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
      vimState.editor.document.lineCount - 1
    );
    vimState.cursorStopPosition = new Position(
      newPositionLine,
      vimState.desiredColumn
    ).obeyStartOfLine();
  }
}

@RegisterAction
class CommandMoveFullPageUp extends CommandScrollAndMoveCursor {
  keys = ['<C-b>'];
  to: EditorScrollDirection = 'up';

  protected getNumLines(vimState: VimState) {
    const visible = vimState.editor.visibleRanges[0];
    return visible.end.line - visible.start.line;
  }
}

@RegisterAction
class CommandMoveFullPageDown extends CommandScrollAndMoveCursor {
  keys = ['<C-f>'];
  to: EditorScrollDirection = 'down';

  protected getNumLines(vimState: VimState) {
    const visible = vimState.editor.visibleRanges[0];
    return visible.end.line - visible.start.line;
  }
}

@RegisterAction
class CommandMoveHalfPageDown extends CommandScrollAndMoveCursor {
  keys = ['<C-d>'];
  to: EditorScrollDirection = 'down';

  protected getNumLines(vimState: VimState) {
    return configuration.getScrollLines(vimState.editor.visibleRanges);
  }
}

@RegisterAction
class CommandMoveHalfPageUp extends CommandScrollAndMoveCursor {
  keys = ['<C-u>'];
  to: EditorScrollDirection = 'up';

  protected getNumLines(vimState: VimState) {
    return configuration.getScrollLines(vimState.editor.visibleRanges);
  }
}

@RegisterAction
export class CommandInsertAtCursor extends BaseCommand {
  modes = [Mode.Normal];
  keys = [['i'], ['<Insert>']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Only allow this command to be prefixed with a count or nothing, no other
    // actions or operators before
    let previousActionsNumbers = true;
    for (const prevAction of vimState.recordedState.actionsRun) {
      if (!(prevAction instanceof CommandNumber)) {
        previousActionsNumbers = false;
        break;
      }
    }

    if (vimState.recordedState.actionsRun.length === 0 || previousActionsNumbers) {
      return super.couldActionApply(vimState, keysPressed);
    }
    return false;
  }
}

@RegisterAction
export class CommandReplaceAtCursorFromNormalMode extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['R'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    let timesToRepeat = vimState.recordedState.count || 1;

    await vimState.setCurrentMode(Mode.Replace);
    vimState.replaceState = new ReplaceState(position, timesToRepeat);
  }
}

@RegisterAction
class CommandReplaceInReplaceMode extends BaseCommand {
  modes = [Mode.Replace];
  keys = ['<character>'];
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const char = this.keysPressed[0];
    const replaceState = vimState.replaceState!;

    if (char === '<BS>') {
      if (position.isBeforeOrEqual(replaceState.replaceCursorStartPosition)) {
        // If you backspace before the beginning of where you started to replace,
        // just move the cursor back.

        vimState.cursorStopPosition = position.getLeft();
        vimState.cursorStartPosition = position.getLeft();
      } else if (
        position.line > replaceState.replaceCursorStartPosition.line ||
        position.character > replaceState.originalChars.length
      ) {
        vimState.recordedState.transformations.push({
          type: 'deleteText',
          position: position,
        });
      } else {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: replaceState.originalChars[position.character - 1],
          range: new Range(position.getLeft(), position),
          diff: new PositionDiff({ character: -1 }),
        });
      }

      replaceState.newChars.pop();
    } else {
      if (!position.isLineEnd() && char !== '\n') {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: char,
          range: new Range(position, position.getRight()),
          diff: new PositionDiff({ character: 1 }),
        });
      } else {
        vimState.recordedState.transformations.push({
          type: 'insertText',
          text: char,
          position: position,
        });
      }

      replaceState.newChars.push(char);
    }
  }
}

/**
 * Our Vim implementation selects up to but not including the final character
 * of a visual selection, instead opting to render a block cursor on the final
 * character. This works for everything except VSCode's native copy command,
 * which loses the final character because it's not selected. We override that
 * copy command here by default to include the final character.
 */
@RegisterAction
class CommandOverrideCopy extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine, Mode.VisualBlock, Mode.Insert, Mode.Normal];
  keys = ['<copy>']; // A special key - see ModeHandler

  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    let text = '';

    if (vimState.currentMode === Mode.Visual) {
      text = vimState.cursors
        .map((range) => {
          const [start, stop] = sorted(range.start, range.stop);
          return vimState.editor.document.getText(new vscode.Range(start, stop.getRight()));
        })
        .join('\n');
    } else if (vimState.currentMode === Mode.VisualLine) {
      text = vimState.cursors
        .map((range) => {
          return vimState.editor.document.getText(
            new vscode.Range(
              earlierOf(range.start.getLineBegin(), range.stop.getLineBegin()),
              laterOf(range.start.getLineEnd(), range.stop.getLineEnd())
            )
          );
        })
        .join('\n');
    } else if (vimState.currentMode === Mode.VisualBlock) {
      for (const { line } of TextEditor.iterateLinesInBlock(vimState)) {
        text += line + '\n';
      }
    } else if (vimState.currentMode === Mode.Insert || vimState.currentMode === Mode.Normal) {
      text = vimState.editor.selections
        .map((selection) => {
          return vimState.editor.document.getText(new vscode.Range(selection.start, selection.end));
        })
        .join('\n');
    }

    await Clipboard.Copy(text);
    // all vim yank operations return to normal mode.
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandCmdA extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['<D-a>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.cursorStartPosition = new Position(0, vimState.desiredColumn);
    vimState.cursorStopPosition = new Position(
      TextEditor.getLineCount() - 1,
      vimState.desiredColumn
    );
    await vimState.setCurrentMode(Mode.VisualLine);
  }
}

/**
 * Search for the word under the cursor; used by [g]* and [g]#
 */
async function searchCurrentWord(
  position: Position,
  vimState: VimState,
  direction: SearchDirection,
  isExact: boolean
): Promise<void> {
  let currentWord = TextEditor.getWord(position);

  if (currentWord) {
    if (/\W/.test(currentWord[0]) || /\W/.test(currentWord[currentWord.length - 1])) {
      // TODO: this kind of sucks. JS regex does not consider the boundary between a special
      // character and whitespace to be a "word boundary", so we can't easily do an exact search.
      isExact = false;
    }

    if (isExact) {
      currentWord = _.escapeRegExp(currentWord);
    }
    // If the search is going left then use `getWordLeft()` on position to start
    // at the beginning of the word. This ensures that any matches happen
    // outside of the currently selected word.
    const searchStartCursorPosition =
      direction === SearchDirection.Backward
        ? vimState.cursorStopPosition.getWordLeft(true)
        : vimState.cursorStopPosition;

    await createSearchStateAndMoveToMatch({
      needle: currentWord,
      vimState,
      direction,
      isExact,
      searchStartCursorPosition,
    });
  }

  StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.NoStringUnderCursor));
}

/**
 * Search for the word under the cursor; used by [g]* and [g]# in visual mode when `visualstar` is enabled
 */
async function searchCurrentSelection(vimState: VimState, direction: SearchDirection) {
  const selection = TextEditor.getSelection();
  const end = new Position(selection.end.line, selection.end.character);
  const currentSelection = TextEditor.getText(selection.with(selection.start, end));

  // Go back to Normal mode, otherwise the selection grows to the next match.
  await vimState.setCurrentMode(Mode.Normal);

  // If the search is going left then use `getLeft()` on the selection start.
  // If going right then use `getRight()` on the selection end. This ensures
  // that any matches happen outside of the currently selected word.
  const searchStartCursorPosition =
    direction === SearchDirection.Backward
      ? vimState.lastVisualSelection!.start.getLeft()
      : vimState.lastVisualSelection!.end.getRight();

  await createSearchStateAndMoveToMatch({
    needle: currentSelection,
    vimState,
    direction,
    isExact: false,
    searchStartCursorPosition,
  });
}

/**
 * Used by [g]* and [g]#
 */
async function createSearchStateAndMoveToMatch(args: {
  needle?: string | undefined;
  vimState: VimState;
  direction: SearchDirection;
  isExact: boolean;
  searchStartCursorPosition: Position;
}): Promise<void> {
  const { needle, vimState, isExact } = args;

  if (needle === undefined || needle.length === 0) {
    return;
  }

  const searchString = isExact ? `\\b${needle}\\b` : needle;

  // Start a search for the given term.
  globalState.searchState = new SearchState(
    args.direction,
    vimState.cursorStopPosition,
    searchString,
    { isRegex: isExact, ignoreSmartcase: true },
    vimState.currentMode
  );
  Register.putByKey(globalState.searchState.searchString, '/', undefined, true);
  globalState.addSearchStateToHistory(globalState.searchState);

  // Turn one of the highlighting flags back on (turned off with :nohl)
  globalState.hl = true;

  const nextMatch = globalState.searchState.getNextSearchMatchPosition(
    args.searchStartCursorPosition
  );
  if (nextMatch) {
    vimState.cursorStopPosition = nextMatch.pos;

    reportSearch(nextMatch.index, globalState.searchState.getMatchRanges().length, vimState);
  } else {
    StatusBar.displayError(
      vimState,
      VimError.fromCode(
        args.direction === SearchDirection.Forward
          ? ErrorCode.SearchHitBottom
          : ErrorCode.SearchHitTop,
        globalState.searchState.searchString
      )
    );
  }
}

@RegisterAction
class CommandSearchCurrentWordExactForward extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['*'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await searchCurrentWord(position, vimState, SearchDirection.Forward, true);
  }
}

@RegisterAction
class CommandSearchCurrentWordForward extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['g', '*'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await searchCurrentWord(position, vimState, SearchDirection.Forward, false);
  }
}

@RegisterAction
class CommandSearchVisualForward extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['*'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (configuration.visualstar) {
      await searchCurrentSelection(vimState, SearchDirection.Forward);
    } else {
      await searchCurrentWord(position, vimState, SearchDirection.Forward, true);
    }
  }
}

@RegisterAction
class CommandSearchCurrentWordExactBackward extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['#'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await searchCurrentWord(position, vimState, SearchDirection.Backward, true);
  }
}

@RegisterAction
class CommandSearchCurrentWordBackward extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['g', '#'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await searchCurrentWord(position, vimState, SearchDirection.Backward, false);
  }
}

@RegisterAction
class CommandSearchVisualBackward extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['#'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (configuration.visualstar) {
      await searchCurrentSelection(vimState, SearchDirection.Backward);
    } else {
      await searchCurrentWord(position, vimState, SearchDirection.Backward, true);
    }
  }
}

@RegisterAction
export class CommandSearchForwards extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['/'];
  isMotion = true;
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    globalState.searchState = new SearchState(
      SearchDirection.Forward,
      vimState.cursorStopPosition,
      '',
      { isRegex: true },
      vimState.currentMode
    );
    await vimState.setCurrentMode(Mode.SearchInProgressMode);

    // Reset search history index
    globalState.searchStateIndex = globalState.searchStatePrevious.length;
  }
}

@RegisterAction
export class CommandSearchBackwards extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['?'];
  isMotion = true;
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    globalState.searchState = new SearchState(
      SearchDirection.Backward,
      vimState.cursorStopPosition,
      '',
      { isRegex: true },
      vimState.currentMode
    );
    await vimState.setCurrentMode(Mode.SearchInProgressMode);

    // Reset search history index
    globalState.searchStateIndex = globalState.searchStatePrevious.length;
  }
}

@RegisterAction
export class MarkCommand extends BaseCommand {
  keys = ['m', '<character>'];
  modes = [Mode.Normal];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const markName = this.keysPressed[1];

    vimState.historyTracker.addMark(position, markName);
  }
}

@RegisterAction
class CommandShowCommandLine extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = [':'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.currentMode === Mode.Normal) {
      if (vimState.recordedState.count) {
        vimState.currentCommandlineText = `.,.+${vimState.recordedState.count - 1}`;
      } else {
        vimState.currentCommandlineText = '';
      }
    } else {
      vimState.currentCommandlineText = "'<,'>";
    }

    // Initialize the cursor position
    vimState.statusBarCursorCharacterPos = vimState.currentCommandlineText.length;

    // Store the current mode for use in retaining selection
    commandLine.previousMode = vimState.currentMode;

    // Change to the new mode
    await vimState.setCurrentMode(Mode.CommandlineInProgress);

    // Reset history navigation index
    commandLine.commandLineHistoryIndex = commandLine.historyEntries.length;
  }
}

@RegisterAction
export class CommandShowCommandHistory extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['q', ':'];

  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformations.push({
      type: 'showCommandHistory',
    });

    if (vimState.currentMode === Mode.Normal) {
      vimState.currentCommandlineText = '';
    } else {
      vimState.currentCommandlineText = "'<,'>";
    }
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
export class CommandShowSearchHistory extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = [
    ['q', '/'],
    ['q', '?'],
  ];

  private direction = SearchDirection.Forward;

  runsOnceForEveryCursor() {
    return false;
  }

  public constructor(direction = SearchDirection.Forward) {
    super();
    this.direction = direction;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (this.keysPressed.includes('?')) {
      this.direction = SearchDirection.Backward;
    }
    vimState.recordedState.transformations.push({
      type: 'showSearchHistory',
      direction: this.direction,
    });

    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandDot extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['.'];

  public async execCount(position: Position, vimState: VimState): Promise<void> {
    let count = vimState.recordedState.count || 1;

    for (let i = 0; i < count; i++) {
      vimState.recordedState.transformations.push({
        type: 'dot',
      });
    }
  }
}

@RegisterAction
class CommandRepeatSubstitution extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['&'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // Parsing the command from a string, while not ideal, is currently
    // necessary to make this work with and without neovim integration
    await commandLine.Run('s', vimState);
  }
}

type FoldDirection = 'up' | 'down' | undefined;
abstract class CommandFold extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  commandName: string;
  direction: FoldDirection;

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const timesToRepeat = vimState.recordedState.count || 1;
    const args =
      this.direction !== undefined
        ? { levels: timesToRepeat, direction: this.direction }
        : undefined;
    await vscode.commands.executeCommand(this.commandName, args);
    vimState.cursors = getCursorsAfterSync();
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandToggleFold extends CommandFold {
  keys = ['z', 'a'];
  commandName = 'editor.toggleFold';
}

@RegisterAction
class CommandCloseFold extends CommandFold {
  keys = ['z', 'c'];
  commandName = 'editor.fold';
  direction: FoldDirection = 'up';
}

@RegisterAction
class CommandCloseAllFolds extends CommandFold {
  keys = ['z', 'M'];
  commandName = 'editor.foldAll';
}

@RegisterAction
class CommandOpenFold extends CommandFold {
  keys = ['z', 'o'];
  commandName = 'editor.unfold';
  direction: FoldDirection = 'down';
}

@RegisterAction
class CommandOpenAllFolds extends CommandFold {
  keys = ['z', 'R'];
  commandName = 'editor.unfoldAll';
}

@RegisterAction
class CommandCloseAllFoldsRecursively extends CommandFold {
  modes = [Mode.Normal];
  keys = ['z', 'C'];
  commandName = 'editor.foldRecursively';
}

@RegisterAction
class CommandOpenAllFoldsRecursively extends CommandFold {
  modes = [Mode.Normal];
  keys = ['z', 'O'];
  commandName = 'editor.unfoldRecursively';
}

@RegisterAction
class CommandCenterScroll extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', 'z'];

  preservesDesiredColumn() {
    return true;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // In these modes you want to center on the cursor position
    vimState.editor.revealRange(
      new vscode.Range(vimState.cursorStopPosition, vimState.cursorStopPosition),
      vscode.TextEditorRevealType.InCenter
    );
  }
}

@RegisterAction
class CommandCenterScrollFirstChar extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['z', '.'];

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // In these modes you want to center on the cursor position
    // This particular one moves cursor to first non blank char though
    vimState.editor.revealRange(
      new vscode.Range(vimState.cursorStopPosition, vimState.cursorStopPosition),
      vscode.TextEditorRevealType.InCenter
    );

    // Move cursor to first char of line
    vimState.cursorStopPosition = TextEditor.getFirstNonWhitespaceCharOnLine(
      vimState.cursorStopPosition.line
    );
  }
}

@RegisterAction
class CommandTopScroll extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['z', 't'];

  preservesDesiredColumn() {
    return true;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
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

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
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
      vimState.cursorStopPosition.line
    );
  }
}

@RegisterAction
class CommandBottomScroll extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['z', 'b'];

  preservesDesiredColumn() {
    return true;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
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

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Don't run if there's an operator because the Sneak plugin uses <operator>z
    return (
      super.doesActionApply(vimState, keysPressed) && vimState.recordedState.operator === undefined
    );
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
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
      vimState.cursorStopPosition.line
    );
  }
}

@RegisterAction
class CommandGoToOtherEndOfHighlightedText extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['o'];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    [vimState.cursorStartPosition, vimState.cursorStopPosition] = [
      vimState.cursorStopPosition,
      vimState.cursorStartPosition,
    ];
  }
}

@RegisterAction
export class CommandUndo extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['u'];
  // we support a count to undo by this setting
  runsOnceForEachCountPrefix = true;
  runsOnceForEveryCursor() {
    return false;
  }
  // to prevent undo for accidental key chords like: cu, du...
  mustBeFirstKey = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const newPositions = await vimState.historyTracker.goBackHistoryStep();

    if (newPositions === undefined) {
      StatusBar.setText(vimState, 'Already at oldest change');
    } else {
      vimState.cursors = newPositions.map((x) => new Range(x, x));
    }

    vimState.alteredHistory = true;
  }
}

@RegisterAction
class CommandUndoOnLine extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['U'];
  runsOnceForEveryCursor() {
    return false;
  }
  mustBeFirstKey = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const newPositions = await vimState.historyTracker.goBackHistoryStepsOnLine();

    if (newPositions !== undefined) {
      vimState.cursors = newPositions.map((x) => new Range(x, x));
    }

    vimState.alteredHistory = true;
  }
}

@RegisterAction
class CommandRedo extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['<C-r>'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const newPositions = await vimState.historyTracker.goForwardHistoryStep();

    if (newPositions === undefined) {
      StatusBar.setText(vimState, 'Already at newest change');
    } else {
      vimState.cursors = newPositions.map((x) => new Range(x, x));
    }

    vimState.alteredHistory = true;
  }
}

@RegisterAction
class CommandDeleteToLineEnd extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['D'];
  canBeRepeatedWithDot = true;
  runsOnceForEveryCursor() {
    return true;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.isLineEnd()) {
      return;
    }

    const linesDown = (vimState.recordedState.count || 1) - 1;
    const start = position;
    const end = position.getDown(linesDown).getLineEnd().getLeftThroughLineBreaks();

    await new operator.DeleteOperator(this.multicursorIndex).run(vimState, start, end);
  }
}

@RegisterAction
export class CommandYankFullLine extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['Y'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const linesDown = (vimState.recordedState.count || 1) - 1;
    const start = position.getLineBegin();
    const end = position.getDown(linesDown).getLeft();

    vimState.currentRegisterMode = RegisterMode.LineWise;

    await new operator.YankOperator().run(vimState, start, end);
  }
}

@RegisterAction
class CommandChangeToLineEnd extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['C'];
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const count = vimState.recordedState.count || 1;

    await new operator.ChangeOperator().run(
      vimState,
      position,
      position
        .getDown(Math.max(0, count - 1))
        .getLineEnd()
        .getLeft()
    );
  }
}

@RegisterAction
class CommandClearLine extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['S'];
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await new operator.ChangeOperator(this.multicursorIndex).runRepeat(
      vimState,
      position,
      vimState.recordedState.count || 1
    );
  }

  // Don't clash with sneak
  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && !configuration.sneak;
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.couldActionApply(vimState, keysPressed) && !configuration.sneak;
  }
}

@RegisterAction
class CommandExitVisualMode extends BaseCommand {
  modes = [Mode.Visual];
  keys = ['v'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
export class CommandVisualMode extends BaseCommand {
  modes = [Mode.Normal, Mode.VisualLine, Mode.VisualBlock];
  keys = ['v'];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Visual);
  }
}

@RegisterAction
class CommandReselectVisual extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'v'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // Try to restore selection only if valid
    if (vimState.lastVisualSelection !== undefined) {
      if (vimState.lastVisualSelection.end.line <= TextEditor.getLineCount() - 1) {
        await vimState.setCurrentMode(vimState.lastVisualSelection.mode);
        vimState.cursorStartPosition = vimState.lastVisualSelection.start;
        vimState.cursorStopPosition = vimState.lastVisualSelection.end.getLeft();
      }
    }
  }
}

async function selectLastSearchWord(vimState: VimState, direction: SearchDirection): Promise<void> {
  const searchState = globalState.searchState;
  if (!searchState || searchState.searchString === '') {
    return;
  }

  const newSearchState = new SearchState(
    direction,
    vimState.cursorStopPosition,
    searchState.searchString,
    { isRegex: true },
    vimState.currentMode
  );

  let result:
    | {
        start: Position;
        end: Position;
        match: boolean;
        index: number;
      }
    | undefined;

  // At first, try to search for current word, and stop searching if matched.
  // Try to search for the next word if not matched or
  // if the cursor is at the end of a match string in visual-mode.
  result = newSearchState.getSearchMatchRangeOf(vimState.cursorStopPosition);
  if (
    vimState.currentMode === Mode.Visual &&
    vimState.cursorStopPosition.isEqual(result.end.getLeftThroughLineBreaks())
  ) {
    result.match = false;
  }

  if (!result.match) {
    // Try to search for the next word
    result = newSearchState.getNextSearchMatchRange(vimState.cursorStopPosition);
    if (!result?.match) {
      return; // no match...
    }
  }

  vimState.cursorStartPosition =
    vimState.currentMode === Mode.Normal ? result.start : vimState.cursorStopPosition;
  vimState.cursorStopPosition = result.end.getLeftThroughLineBreaks(); // end is exclusive

  // Move the cursor, this is a bit hacky...
  vscode.window.activeTextEditor!.selection = new vscode.Selection(
    vimState.cursorStartPosition,
    vimState.cursorStopPosition
  );

  reportSearch(result.index, searchState.getMatchRanges().length, vimState);

  await vimState.setCurrentMode(Mode.Visual);
}

@RegisterAction
class CommandSelectNextLastSearchWord extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  keys = ['g', 'n'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await selectLastSearchWord(vimState, SearchDirection.Forward);
  }
}

@RegisterAction
class CommandSelectPreviousLastSearchWord extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  keys = ['g', 'N'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await selectLastSearchWord(vimState, SearchDirection.Backward);
  }
}

@RegisterAction
class CommandVisualBlockMode extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-v>'], ['<C-q>']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.VisualBlock);
  }
}

@RegisterAction
class CommandExitVisualBlockMode extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = [['<C-v>'], ['<C-q>']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandVisualLineMode extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  keys = ['V'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.VisualLine);

    if (vimState.recordedState.count > 1) {
      vimState.cursorStopPosition = vimState.cursorStopPosition.getDown(
        vimState.recordedState.count - 1
      );
    }
  }
}

@RegisterAction
class CommandExitVisualLineMode extends BaseCommand {
  modes = [Mode.VisualLine];
  keys = ['V'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandOpenFile extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual];
  keys = ['g', 'f'];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    let fullFilePath: string;
    if (vimState.currentMode === Mode.Visual) {
      fullFilePath = TextEditor.getText(TextEditor.getSelection());
    } else {
      const range = new vscode.Range(position.getFilePathLeft(true), position.getFilePathRight());

      fullFilePath = TextEditor.getText(range).trim();
    }

    const fileInfo = fullFilePath.match(/(.*?(?=:[0-9]+)|.*):?([0-9]*)$/);
    if (fileInfo) {
      const filePath = fileInfo[1];
      const lineNumber = parseInt(fileInfo[2], 10);
      const fileCommand = new FileCommand({
        name: filePath,
        lineNumber: lineNumber,
        createFileIfNotExists: false,
      });
      fileCommand.execute();
    }
  }
}

@RegisterAction
class CommandGoToDefinition extends BaseCommand {
  modes = [Mode.Normal];
  keys = [['g', 'd'], ['<C-]>']];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('editor.action.goToDeclaration');

    if (vimState.editor === vscode.window.activeTextEditor) {
      // We didn't switch to a different editor
      vimState.cursorStopPosition = Position.FromVSCodePosition(vimState.editor.selection.start);
    }
  }
}

@RegisterAction
class CommandOpenLink extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['g', 'x'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vscode.commands.executeCommand('editor.action.openLink');
  }
}

@RegisterAction
class CommandGoBackInChangelist extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', ';'];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const originalIndex = vimState.historyTracker.changelistIndex;
    const prevPos = vimState.historyTracker.getChangePositionAtIndex(originalIndex - 1);
    const currPos = vimState.historyTracker.getChangePositionAtIndex(originalIndex);

    if (prevPos !== undefined) {
      vimState.cursorStopPosition = prevPos[0];
      vimState.historyTracker.changelistIndex = originalIndex - 1;
    } else if (currPos !== undefined) {
      vimState.cursorStopPosition = currPos[0];
    }
  }
}

@RegisterAction
class CommandGoForwardInChangelist extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', ','];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const originalIndex = vimState.historyTracker.changelistIndex;
    const nextPos = vimState.historyTracker.getChangePositionAtIndex(originalIndex + 1);
    const currPos = vimState.historyTracker.getChangePositionAtIndex(originalIndex);

    if (nextPos !== undefined) {
      vimState.cursorStopPosition = nextPos[0];
      vimState.historyTracker.changelistIndex = originalIndex + 1;
    } else if (currPos !== undefined) {
      vimState.cursorStopPosition = currPos[0];
    }
  }
}

@RegisterAction
class CommandGoStartPrevOperatedText extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = [
    ['`', '['],
    ["'", '['],
  ];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const lastPos = vimState.historyTracker.getLastChangeStartPosition();
    if (lastPos !== undefined) {
      vimState.cursorStopPosition = lastPos;
    }
  }
}

@RegisterAction
class CommandGoEndPrevOperatedText extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = [
    ['`', ']'],
    ["'", ']'],
  ];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const lastPos = vimState.historyTracker.getLastChangeEndPosition();
    if (lastPos !== undefined) {
      vimState.cursorStopPosition = lastPos;
    }
  }
}

@RegisterAction
class CommandGoLastChange extends BaseCommand {
  modes = [Mode.Normal];
  keys = [
    ['`', '.'],
    ["'", '.'],
  ];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const lastPos = vimState.historyTracker.getLastHistoryStartPosition();

    if (lastPos !== undefined) {
      vimState.cursorStopPosition = lastPos[0];
    }
  }
}

@RegisterAction
class CommandInsertAtLastChange extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'i'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const lastPos = vimState.historyTracker.getLastChangeEndPosition();

    if (lastPos !== undefined) {
      vimState.cursorStopPosition = lastPos;
      await vimState.setCurrentMode(Mode.Insert);
    }
  }
}

@RegisterAction
export class CommandInsertAtFirstCharacter extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['I'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStopPosition = TextEditor.getFirstNonWhitespaceCharOnLine(position.line);
  }
}

@RegisterAction
class CommandInsertAtLineBegin extends BaseCommand {
  modes = [Mode.Normal];
  mustBeFirstKey = true;
  keys = ['g', 'I'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStopPosition = position.getLineBegin();
  }
}

@RegisterAction
export class CommandInsertAfterCursor extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['a'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStopPosition = position.getRight();
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Only allow this command to be prefixed with a count or nothing, no other actions or operators before
    if (!vimState.recordedState.actionsRun.every((action) => action instanceof CommandNumber)) {
      return false;
    }

    return super.couldActionApply(vimState, keysPressed);
  }
}

@RegisterAction
export class CommandInsertAtLineEnd extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['A'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStopPosition = position.getLineEnd();
  }
}

@RegisterAction
class CommandInsertNewLineAbove extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['O'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async execCount(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    let count = vimState.recordedState.count || 1;

    for (let i = 0; i < count; i++) {
      await vscode.commands.executeCommand('editor.action.insertLineBefore');
    }

    vimState.cursors = getCursorsAfterSync();
    for (let i = 0; i < count; i++) {
      const newPos = new Position(
        vimState.cursors[0].start.line + i,
        vimState.cursors[0].start.character
      );
      vimState.cursors.push(new Range(newPos, newPos));
    }
    vimState.cursors = vimState.cursors.reverse();
    vimState.isFakeMultiCursor = true;
    vimState.isMultiCursor = true;
  }
}

@RegisterAction
class CommandInsertNewLineBefore extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['o'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async execCount(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    let count = vimState.recordedState.count || 1;

    for (let i = 0; i < count; i++) {
      await vscode.commands.executeCommand('editor.action.insertLineAfter');
    }
    vimState.cursors = getCursorsAfterSync();
    for (let i = 1; i < count; i++) {
      const newPos = new Position(
        vimState.cursorStartPosition.line - i,
        vimState.cursorStartPosition.character
      );
      vimState.cursors.push(new Range(newPos, newPos));

      // Ahhhhhh. We have to manually set cursor position here as we need text
      // transformations AND to set multiple cursors.
      vimState.recordedState.transformations.push({
        type: 'insertText',
        text: TextEditor.setIndentationLevel('', newPos.character),
        position: newPos,
        cursorIndex: i,
        manuallySetCursorPositions: true,
      });
    }
    vimState.cursors = vimState.cursors.reverse();
    vimState.isFakeMultiCursor = true;
    vimState.isMultiCursor = true;
  }
}

@RegisterAction
class CommandNavigateBack extends BaseCommand {
  modes = [Mode.Normal];
  keys = [['<C-o>'], ['<C-t>']];

  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await globalState.jumpTracker.jumpBack(position, vimState);
  }
}

@RegisterAction
class CommandNavigateForward extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['<C-i>'];

  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await globalState.jumpTracker.jumpForward(position, vimState);
  }
}

@RegisterAction
class CommandNavigateLast extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['`', '`'];
  runsOnceForEveryCursor() {
    return false;
  }
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await globalState.jumpTracker.jumpBack(position, vimState);
  }
}

@RegisterAction
class CommandNavigateLastBOL extends BaseCommand {
  modes = [Mode.Normal];
  keys = ["'", "'"];
  runsOnceForEveryCursor() {
    return false;
  }
  isJump = true;
  public async exec(position: Position, vimState: VimState): Promise<void> {
    const lastJump = globalState.jumpTracker.end;
    if (lastJump == null) {
      // This command goes to the last jump, and there is no previous jump, so there's nothing to do.
      return;
    }
    const jump = new Jump({
      editor: vimState.editor,
      fileName: vimState.editor.document.fileName,
      position: lastJump.position.getLineBegin(),
    });
    globalState.jumpTracker.recordJump(Jump.fromStateNow(vimState), jump);
    vimState.cursorStopPosition = jump.position;
  }
}

@RegisterAction
class CommandQuit extends BaseCommand {
  modes = [Mode.Normal];
  keys = [
    ['<C-w>', 'q'],
    ['<C-w>', '<C-q>'],
    ['<C-w>', 'c'],
    ['<C-w>', '<C-c>'],
  ];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    new QuitCommand({}).execute();
  }
}

@RegisterAction
class CommandOnly extends BaseCommand {
  modes = [Mode.Normal];
  keys = [
    ['<C-w>', 'o'],
    ['<C-w>', '<C-o>'],
  ];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    new OnlyCommand({}).execute();
  }
}

@RegisterAction
class MoveToRightPane extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-w>', 'l'], ['<C-w>', '<right>'], ['<C-w l>'], ['<C-w>', '<C-l>']];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateRight',
      args: {},
    });
  }
}

@RegisterAction
class MoveToLowerPane extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-w>', 'j'], ['<C-w>', '<down>'], ['<C-w j>'], ['<C-w>', '<C-j>']];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateDown',
      args: {},
    });
  }
}

@RegisterAction
class MoveToUpperPane extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-w>', 'k'], ['<C-w>', '<up>'], ['<C-w k>'], ['<C-w>', '<C-k>']];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateUp',
      args: {},
    });
  }
}

@RegisterAction
class MoveToLeftPane extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['<C-w>', 'h'], ['<C-w>', '<left>'], ['<C-w h>'], ['<C-w>', '<C-h>']];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateLeft',
      args: {},
    });
  }
}

@RegisterAction
class CycleThroughPanes extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', '<C-w>'],
    ['<C-w>', 'w'],
  ];
  isJump = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateEditorGroups',
      args: {},
    });
  }
}

@RegisterAction
class VerticalSplit extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', 'v'],
    ['<C-w>', '<C-v>'],
  ];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.splitEditor',
      args: {},
    });
  }
}

@RegisterAction
class OrthogonalSplit extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [
    ['<C-w>', 's'],
    ['<C-w>', '<C-s>'],
  ];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.splitEditorOrthogonal',
      args: {},
    });
  }
}

@RegisterAction
class EvenPaneWidths extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['<C-w>', '='];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.evenEditorWidths',
      args: {},
    });
  }
}

@RegisterAction
class CommandTabNext extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['g', 't'], ['<C-pagedown>']];
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // gt behaves differently than gT and goes to an absolute index tab
    // (1-based), it does NOT iterate over next tabs
    if (vimState.recordedState.count > 0) {
      new TabCommand({
        tab: Tab.Absolute,
        count: vimState.recordedState.count - 1,
      }).execute();
    } else {
      new TabCommand({
        tab: Tab.Next,
        count: 1,
      }).execute();
    }
  }
}

@RegisterAction
class CommandTabPrevious extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = [['g', 'T'], ['<C-pageup>']];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    new TabCommand({
      tab: Tab.Previous,
      count: 1,
    }).execute();
  }
}

@RegisterAction
export class ActionDeleteChar extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['x'];
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // If line is empty, do nothing
    if (TextEditor.getLineAt(position).text.length < 1) {
      return;
    }

    let timesToRepeat = vimState.recordedState.count || 1;

    await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      position,
      position.getRight(timesToRepeat - 1).getLeftIfEOL()
    );

    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
export class ActionDeleteCharWithDeleteKey extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['<Del>'];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async execCount(position: Position, vimState: VimState): Promise<void> {
    // If <del> has a count in front of it, then <del> deletes a character
    // off the count. Therefore, 100<del>x, would apply 'x' 10 times.
    // http://vimdoc.sourceforge.net/htmldoc/change.html#<Del>
    if (vimState.recordedState.count !== 0) {
      vimState.recordedState.count = Math.floor(vimState.recordedState.count / 10);

      // Change actionsRunPressedKeys so that showCmd updates correctly
      vimState.recordedState.actionsRunPressedKeys =
        vimState.recordedState.count > 0 ? vimState.recordedState.count.toString().split('') : [];
      this.isCompleteAction = false;
    } else {
      await new ActionDeleteChar().execCount(position, vimState);
    }
  }
}

@RegisterAction
export class ActionDeleteLastChar extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['X'];
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.character === 0) {
      return;
    }

    let timesToRepeat = vimState.recordedState.count || 1;

    await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      position.getLeft(timesToRepeat),
      position.getLeft()
    );
  }
}

@RegisterAction
class ActionJoin extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['J'];
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = false;

  private firstNonWhitespaceIndex(str: string): number {
    for (let i = 0, len = str.length; i < len; i++) {
      let chCode = str.charCodeAt(i);
      if (chCode !== 32 /** space */ && chCode !== 9 /** tab */) {
        return i;
      }
    }
    return -1;
  }

  public async execJoinLines(
    startPosition: Position,
    position: Position,
    vimState: VimState,
    count: number
  ): Promise<void> {
    count = count - 1 || 1;

    let startLineNumber: number,
      startColumn: number,
      endLineNumber: number,
      endColumn: number,
      columnDeltaOffset: number = 0;

    if (startPosition.isEqual(position) || startPosition.line === position.line) {
      if (position.line + 1 < TextEditor.getLineCount()) {
        startLineNumber = position.line;
        startColumn = 0;
        endLineNumber = position.getDown(count).line;
        endColumn = TextEditor.getLineLength(endLineNumber);
      } else {
        startLineNumber = position.line;
        startColumn = 0;
        endLineNumber = position.line;
        endColumn = TextEditor.getLineLength(endLineNumber);
      }
    } else {
      startLineNumber = startPosition.line;
      startColumn = 0;
      endLineNumber = position.line;
      endColumn = TextEditor.getLineLength(endLineNumber);
    }

    let trimmedLinesContent = TextEditor.getLineAt(startPosition).text;

    for (let i = startLineNumber + 1; i <= endLineNumber; i++) {
      const lineText = TextEditor.getLine(i).text;

      let firstNonWhitespaceIdx = this.firstNonWhitespaceIndex(lineText);

      if (firstNonWhitespaceIdx >= 0) {
        let insertSpace = true;

        if (
          trimmedLinesContent === '' ||
          trimmedLinesContent.charAt(trimmedLinesContent.length - 1) === ' ' ||
          trimmedLinesContent.charAt(trimmedLinesContent.length - 1) === '\t'
        ) {
          insertSpace = false;
        }

        let lineTextWithoutIndent = lineText.substr(firstNonWhitespaceIdx);

        if (lineTextWithoutIndent.charAt(0) === ')') {
          insertSpace = false;
        }

        trimmedLinesContent += (insertSpace ? ' ' : '') + lineTextWithoutIndent;

        if (insertSpace) {
          columnDeltaOffset = lineTextWithoutIndent.length + 1;
        } else {
          columnDeltaOffset = lineTextWithoutIndent.length;
        }
      } else if (
        trimmedLinesContent === '' ||
        trimmedLinesContent.charAt(trimmedLinesContent.length - 1) === ' ' ||
        trimmedLinesContent.charAt(trimmedLinesContent.length - 1) === '\t'
      ) {
        columnDeltaOffset += 0;
      } else {
        trimmedLinesContent += ' ';
        columnDeltaOffset += 1;
      }
    }

    let deleteStartPosition = new Position(startLineNumber, startColumn);
    let deleteEndPosition = new Position(endLineNumber, endColumn);

    if (!deleteStartPosition.isEqual(deleteEndPosition)) {
      if (startPosition.isEqual(position)) {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: trimmedLinesContent,
          range: new Range(deleteStartPosition, deleteEndPosition),
          diff: new PositionDiff({
            character: trimmedLinesContent.length - columnDeltaOffset - position.character,
          }),
        });
      } else {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: trimmedLinesContent,
          range: new Range(deleteStartPosition, deleteEndPosition),
          manuallySetCursorPositions: true,
        });

        vimState.cursorStartPosition = vimState.cursorStopPosition = new Position(
          startPosition.line,
          trimmedLinesContent.length - columnDeltaOffset
        );
        await vimState.setCurrentMode(Mode.Normal);
      }
    }
  }

  public async execCount(position: Position, vimState: VimState): Promise<void> {
    const cursorsToIterateOver = vimState.cursors
      .map((x) => new Range(x.start, x.stop))
      .sort((a, b) =>
        a.start.line > b.start.line ||
        (a.start.line === b.start.line && a.start.character > b.start.character)
          ? 1
          : -1
      );

    let resultingCursors: Range[] = [];
    for (const [idx, { start, stop }] of cursorsToIterateOver.entries()) {
      this.multicursorIndex = idx;

      vimState.cursorStopPosition = stop;
      vimState.cursorStartPosition = start;

      await this.execJoinLines(start, stop, vimState, vimState.recordedState.count || 1);

      resultingCursors.push(new Range(vimState.cursorStartPosition, vimState.cursorStopPosition));

      for (const transformation of vimState.recordedState.transformations) {
        if (isTextTransformation(transformation) && transformation.cursorIndex === undefined) {
          transformation.cursorIndex = this.multicursorIndex;
        }
      }
    }

    vimState.cursors = resultingCursors;
  }
}

@RegisterAction
class ActionJoinVisualMode extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['J'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(
      Position.FromVSCodePosition(vimState.editor.selection.start),
      Position.FromVSCodePosition(vimState.editor.selection.end)
    );

    /**
     * For joining lines, Visual Line behaves the same as Visual so we align the register mode here.
     */
    vimState.currentRegisterMode = RegisterMode.CharacterWise;
    await new ActionJoin().execJoinLines(start, end, vimState, 1);
  }
}

@RegisterAction
class ActionJoinVisualBlockMode extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['J'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);

    vimState.currentRegisterMode = RegisterMode.CharacterWise;
    await new ActionJoin().execJoinLines(start, end, vimState, 1);
  }
}

@RegisterAction
class ActionJoinNoWhitespace extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'J'];
  canBeRepeatedWithDot = true;

  // gJ is essentially J without the edge cases. ;-)

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.line === TextEditor.getLineCount() - 1) {
      return; // TODO: bell
    }

    const count = vimState.recordedState.count > 2 ? vimState.recordedState.count - 1 : 1;
    await this.execJoin(count, position, vimState);
  }

  public async execJoin(count: number, position: Position, vimState: VimState): Promise<void> {
    const lastLine = Math.min(position.line + count, TextEditor.getLineCount() - 1);
    const lines: string[] = [];
    for (let i = position.line + 1; i <= lastLine; i++) {
      lines.push(TextEditor.getLine(i).text);
    }
    const resultLine = TextEditor.getLine(position.line).text + lines.join('');

    await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      position.getLineBegin(),
      TextEditor.getLineLength(lastLine) > 0
        ? position.getDown(count).getLineEnd().getLeft()
        : position.getDown(count - 1).getLineEnd()
    );

    const lastLineLength = lines[lines.length - 1].length;
    vimState.recordedState.transformations.push({
      type: 'insertText',
      text: resultLine,
      position: position,
      diff: new PositionDiff({
        character: -lastLineLength,
      }),
    });

    vimState.cursorStopPosition = new Position(position.line, resultLine.length - lastLineLength);
  }
}

@RegisterAction
class ActionJoinNoWhitespaceVisualMode extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['g', 'J'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    const count = start.line === end.line ? 1 : end.line - start.line;
    vimState.currentRegisterMode = RegisterMode.CharacterWise;
    return new ActionJoinNoWhitespace().execJoin(count, start, vimState);
  }
}

@RegisterAction
class ActionReplaceCharacter extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['r', '<character>'];
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    let timesToRepeat = vimState.recordedState.count || 1;
    const toReplace = this.keysPressed[1];

    /**
     * <character> includes <BS>, <SHIFT+BS> and <TAB> but not any control keys,
     * so we ignore the former two keys and have a special handle for <tab>.
     */

    if (['<BS>', '<SHIFT+BS>'].includes(toReplace.toUpperCase())) {
      return;
    }

    if (position.character + timesToRepeat > position.getLineEnd().character) {
      return;
    }

    let endPos = new Position(position.line, position.character + timesToRepeat);

    // Return if tried to repeat longer than linelength
    if (endPos.character > TextEditor.getLineAt(endPos).text.length) {
      return;
    }

    // If last char (not EOL char), add 1 so that replace selection is complete
    if (endPos.character > TextEditor.getLineAt(endPos).text.length) {
      endPos = new Position(endPos.line, endPos.character + 1);
    }

    if (toReplace === '<tab>') {
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(position, endPos),
      });
      vimState.recordedState.transformations.push({
        type: 'tab',
        cursorIndex: this.multicursorIndex,
        diff: new PositionDiff({ character: -1 }),
      });
    } else if (toReplace === '\n') {
      // A newline replacement always inserts exactly one newline (regardless
      // of count prefix) and puts the cursor on the next line.
      // We use `insertTextVSCode` so we get the right indentation
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(position, endPos),
      });
      vimState.recordedState.transformations.push({
        type: 'insertTextVSCode',
        text: '\n',
      });
    } else {
      vimState.recordedState.transformations.push({
        type: 'replaceText',
        text: toReplace.repeat(timesToRepeat),
        range: new Range(position, endPos),
        diff: new PositionDiff({ character: timesToRepeat - 1 }),
      });
    }
  }

  public async execCount(position: Position, vimState: VimState): Promise<void> {
    await super.execCount(position, vimState);
  }
}

@RegisterAction
class ActionReplaceCharacterVisual extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['r', '<character>'];
  runsOnceForEveryCursor() {
    return false;
  }
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    let toInsert = this.keysPressed[1];

    if (toInsert === '<tab>') {
      toInsert = TextEditor.getTabCharacter(vimState.editor);
    }

    let visualSelectionOffset = 1;

    // If selection is reversed, reorganize it so that the text replace logic always works
    let [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    if (vimState.currentMode === Mode.VisualLine) {
      [start, end] = [start.getLineBegin(), end.getLineEnd()];
    }

    // Limit to not replace EOL
    const textLength = TextEditor.getLineAt(end).text.length;
    if (textLength <= 0) {
      visualSelectionOffset = 0;
    }
    end = new Position(end.line, Math.min(end.character, textLength > 0 ? textLength - 1 : 0));

    // Iterate over every line in the current selection
    for (let lineNum = start.line; lineNum <= end.line; lineNum++) {
      // Get line of text
      const lineText = TextEditor.getLine(lineNum).text;

      if (start.line === end.line) {
        // This is a visual section all on one line, only replace the part within the selection
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: Array(end.character - start.character + 2).join(toInsert),
          range: new Range(start, new Position(end.line, end.character + 1)),
          manuallySetCursorPositions: true,
        });
      } else if (lineNum === start.line) {
        // This is the first line of the selection so only replace after the cursor
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: Array(lineText.length - start.character + 1).join(toInsert),
          range: new Range(start, new Position(start.line, lineText.length)),
          manuallySetCursorPositions: true,
        });
      } else if (lineNum === end.line) {
        // This is the last line of the selection so only replace before the cursor
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: Array(end.character + 1 + visualSelectionOffset).join(toInsert),
          range: new Range(
            new Position(end.line, 0),
            new Position(end.line, end.character + visualSelectionOffset)
          ),
          manuallySetCursorPositions: true,
        });
      } else {
        // Replace the entire line length since it is in the middle of the selection
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: Array(lineText.length + 1).join(toInsert),
          range: new Range(new Position(lineNum, 0), new Position(lineNum, lineText.length)),
          manuallySetCursorPositions: true,
        });
      }
    }

    vimState.cursorStopPosition = start;
    vimState.cursorStartPosition = start;
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class ActionReplaceCharacterVisualBlock extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['r', '<character>'];
  runsOnceForEveryCursor() {
    return false;
  }
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    let toInsert = this.keysPressed[1];

    if (toInsert === '<tab>') {
      toInsert = TextEditor.getTabCharacter(vimState.editor);
    }

    for (const { start, end } of TextEditor.iterateLinesInBlock(vimState)) {
      if (end.isBeforeOrEqual(start)) {
        continue;
      }

      vimState.recordedState.transformations.push({
        type: 'replaceText',
        text: Array(end.character - start.character + 1).join(toInsert),
        range: new Range(start, end),
        manuallySetCursorPositions: true,
      });
    }

    const topLeft = visualBlockGetTopLeftPosition(
      vimState.cursorStopPosition,
      vimState.cursorStartPosition
    );
    vimState.cursors = [new Range(topLeft, topLeft)];
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class ActionDeleteVisualBlock extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = [['d'], ['x'], ['X']];
  canBeRepeatedWithDot = true;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const lines: string[] = [];

    for (const { line, start, end } of TextEditor.iterateLinesInBlock(vimState)) {
      lines.push(line);
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(start, end),
        manuallySetCursorPositions: true,
      });
    }

    const text = lines.length === 1 ? lines[0] : lines.join('\n');
    vimState.currentRegisterMode = RegisterMode.BlockWise;
    Register.put(text, vimState, this.multicursorIndex);

    const topLeft = visualBlockGetTopLeftPosition(
      vimState.cursorStopPosition,
      vimState.cursorStartPosition
    );

    vimState.cursors = [new Range(topLeft, topLeft)];
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class ActionShiftDVisualBlock extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['D'];
  canBeRepeatedWithDot = true;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    for (const { start } of TextEditor.iterateLinesInBlock(vimState)) {
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(start, start.getLineEnd()),
        manuallySetCursorPositions: true,
      });
    }

    const topLeft = visualBlockGetTopLeftPosition(
      vimState.cursorStopPosition,
      vimState.cursorStartPosition
    );

    vimState.cursors = [new Range(topLeft, topLeft)];
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class ActionGoToInsertVisualBlockMode extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['I'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.isMultiCursor = true;
    vimState.isFakeMultiCursor = true;

    for (const { line, start } of TextEditor.iterateLinesInBlock(vimState)) {
      if (line === '' && start.character !== 0) {
        continue;
      }
      vimState.cursors.push(new Range(start, start));
    }
    vimState.cursors = vimState.cursors.slice(1);
  }
}

@RegisterAction
class ActionChangeInVisualBlockMode extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = [['c'], ['s']];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    for (const { start, end } of TextEditor.iterateLinesInBlock(vimState)) {
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(start, end),
        manuallySetCursorPositions: true,
      });
    }

    await vimState.setCurrentMode(Mode.Insert);
    vimState.isMultiCursor = true;
    vimState.isFakeMultiCursor = true;

    for (const { start } of TextEditor.iterateLinesInBlock(vimState)) {
      vimState.cursors.push(new Range(start, start));
    }
    vimState.cursors = vimState.cursors.slice(1);
  }
}

@RegisterAction
class ActionChangeToEOLInVisualBlockMode extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['C'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    for (const { start } of TextEditor.iterateLinesInBlock(vimState)) {
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(start, start.getLineEnd()),
        collapseRange: true,
      });
    }

    await vimState.setCurrentMode(Mode.Insert);
    vimState.isMultiCursor = true;
    vimState.isFakeMultiCursor = true;

    for (const { end } of TextEditor.iterateLinesInBlock(vimState)) {
      vimState.cursors.push(new Range(end, end));
    }
    vimState.cursors = vimState.cursors.slice(1);
  }
}

abstract class ActionGoToInsertVisualLineModeCommand extends BaseCommand {
  runsOnceForEveryCursor() {
    return false;
  }

  abstract getCursorRangeForLine(
    line: vscode.TextLine,
    selectionStart: vscode.Position,
    selectionEnd: vscode.Position
  ): Range;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.isMultiCursor = true;
    vimState.isFakeMultiCursor = true;

    vimState.cursors = [];

    for (const selection of vimState.editor.selections) {
      let { start, end } = selection;

      for (let i = start.line; i <= end.line; i++) {
        const line = TextEditor.getLine(i);

        if (!line.isEmptyOrWhitespace) {
          vimState.cursors.push(this.getCursorRangeForLine(line, start, end));
        }
      }
    }
  }
}

@RegisterAction
export class ActionGoToInsertVisualLineMode extends ActionGoToInsertVisualLineModeCommand {
  modes = [Mode.VisualLine];
  keys = ['I'];

  getCursorRangeForLine(line: vscode.TextLine): Range {
    const startCharacterPosition = new Position(
      line.lineNumber,
      line.firstNonWhitespaceCharacterIndex
    );
    return new Range(startCharacterPosition, startCharacterPosition);
  }
}

@RegisterAction
export class ActionGoToInsertVisualLineModeAppend extends ActionGoToInsertVisualLineModeCommand {
  modes = [Mode.VisualLine];
  keys = ['A'];

  getCursorRangeForLine(line: vscode.TextLine): Range {
    const endCharacterPosition = new Position(line.lineNumber, line.range.end.character);
    return new Range(endCharacterPosition, endCharacterPosition);
  }
}

@RegisterAction
export class ActionGoToInsertVisualMode extends ActionGoToInsertVisualLineModeCommand {
  modes = [Mode.Visual];
  keys = ['I'];

  getCursorRangeForLine(
    line: vscode.TextLine,
    selectionStart: vscode.Position,
    selectionEnd: vscode.Position
  ): Range {
    const startCharacterPosition =
      line.lineNumber === selectionStart.line
        ? Position.FromVSCodePosition(selectionStart)
        : new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
    return new Range(startCharacterPosition, startCharacterPosition);
  }
}

@RegisterAction
export class ActionGoToInsertVisualModeAppend extends ActionGoToInsertVisualLineModeCommand {
  modes = [Mode.Visual];
  keys = ['A'];

  getCursorRangeForLine(
    line: vscode.TextLine,
    selectionStart: vscode.Position,
    selectionEnd: vscode.Position
  ): Range {
    const endCharacterPosition =
      line.lineNumber === selectionEnd.line
        ? Position.FromVSCodePosition(selectionEnd)
        : new Position(line.lineNumber, line.range.end.character);
    return new Range(endCharacterPosition, endCharacterPosition);
  }
}

@RegisterAction
class ActionGoToInsertVisualBlockModeAppend extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = ['A'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const newCursors: Range[] = [];
    for (const cursor of vimState.cursors) {
      const [start, end] = sorted(cursor.start, cursor.stop);
      for (let lineNum = start.line; lineNum <= end.line; lineNum++) {
        const line = TextEditor.getLine(lineNum);
        const insertionColumn =
          vimState.desiredColumn === Number.POSITIVE_INFINITY
            ? line.text.length
            : Math.max(cursor.start.character, cursor.stop.character) + 1;
        if (line.text.length < insertionColumn) {
          await TextEditor.insertAt(' '.repeat(insertionColumn - line.text.length), line.range.end);
        }
        const newCursor = new Position(lineNum, insertionColumn);
        newCursors.push(new Range(newCursor, newCursor));
      }
    }

    vimState.cursors = newCursors;
    await vimState.setCurrentMode(Mode.Insert);
    vimState.isMultiCursor = true;
    vimState.isFakeMultiCursor = true;
  }
}

@RegisterAction
class ActionDeleteLineVisualMode extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['X'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (vimState.currentMode === Mode.Visual) {
      await new operator.DeleteOperator(this.multicursorIndex).run(
        vimState,
        vimState.cursorStartPosition.getLineBegin(),
        vimState.cursorStopPosition.getLineEnd()
      );
    } else {
      await new operator.DeleteOperator(this.multicursorIndex).run(
        vimState,
        position.getLineBegin(),
        position.getLineEnd()
      );
    }
  }
}

@RegisterAction
class ActionChangeLineVisualModeS extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['S'];

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return !configuration.surround && super.doesActionApply(vimState, keysPressed);
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    return new ActionChangeLineVisualMode().exec(position, vimState);
  }
}

@RegisterAction
class ActionChangeLineVisualMode extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = [['C'], ['R']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    await new operator.ChangeOperator(this.multicursorIndex).run(
      vimState,
      start.getLineBegin(),
      end.getLineEndIncludingEOL()
    );
  }
}

@RegisterAction
class ActionChangeLineVisualBlockMode extends BaseCommand {
  modes = [Mode.VisualBlock];
  keys = [['R'], ['S']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    return new ActionChangeLineVisualMode().exec(position, vimState);
  }
}

@RegisterAction
class ActionChangeChar extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['s'];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await new operator.ChangeOperator().run(vimState, position, position);

    await vimState.setCurrentMode(Mode.Insert);
  }

  // Don't clash with surround or sneak modes!
  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return (
      super.doesActionApply(vimState, keysPressed) &&
      !configuration.sneak &&
      !vimState.recordedState.operator
    );
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return (
      super.couldActionApply(vimState, keysPressed) &&
      !configuration.sneak &&
      !vimState.recordedState.operator
    );
  }
}

@RegisterAction
class ToggleCaseAndMoveForward extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['~'];
  mustBeFirstKey = true;
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await new operator.ToggleCaseOperator().run(
      vimState,
      vimState.cursorStopPosition,
      vimState.cursorStopPosition
    );

    vimState.cursorStopPosition = vimState.cursorStopPosition.getRight();
  }
}

abstract class IncrementDecrementNumberAction extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  canBeRepeatedWithDot = true;
  offset: number;
  staircase: boolean;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const ranges = this.getSearchRanges(vimState);

    let stepNum = 1;

    for (const [idx, range] of ranges.entries()) {
      position = range.start;

      const text = TextEditor.getLineAt(position).text;

      // Make sure position within the text is possible and return if not
      if (text.length <= position.character) {
        continue;
      }

      // Start looking to the right for the next word to increment, unless we're
      // already on a word to increment, in which case start at the beginning of
      // that word.
      const whereToStart = text[position.character].match(/\s/)
        ? position
        : position.getWordLeft(true);

      wordLoop: for (let { start, end, word } of TextEditor.iterateWords(whereToStart)) {
        if (start.isAfter(range.stop)) {
          break;
        }

        // '-' doesn't count as a word, but is important to include in parsing
        // the number, as long as it is not just part of the word (-foo2 for example)
        if (text[start.character - 1] === '-' && /\d/.test(text[start.character])) {
          start = start.getLeft();
          word = text[start.character] + word;
        }
        // Strict number parsing so "1a" doesn't silently get converted to "1"
        do {
          const result = NumericString.parse(word);
          if (result === undefined) {
            break;
          }
          const { num, suffixOffset } = result;

          // Use suffix offset to check if current cursor is in or before detected number.
          if (position.character < start.character + suffixOffset) {
            const pos = await this.replaceNum(
              num,
              this.offset * stepNum * (vimState.recordedState.count || 1),
              start,
              end
            );

            if (this.staircase) {
              stepNum++;
            }

            if (vimState.currentMode === Mode.Normal) {
              vimState.cursorStartPosition = vimState.cursorStopPosition = pos.getLeft(
                num.suffix.length
              );
            }
            break wordLoop;
          } else {
            // For situation like this: xyz1999em199[cursor]9m
            word = word.slice(suffixOffset);
            start = new Position(start.line, start.character + suffixOffset);
          }
        } while (true);
      }
    }

    if (isVisualMode(vimState.currentMode)) {
      vimState.cursorStopPosition = ranges[0].start;
    }

    vimState.setCurrentMode(Mode.Normal);
  }

  private async replaceNum(
    start: NumericString,
    offset: number,
    startPos: Position,
    endPos: Position
  ): Promise<Position> {
    const oldLength = endPos.character + 1 - startPos.character;
    start.value += offset;
    const newNum = start.toString();

    const range = new vscode.Range(startPos, endPos.getRight());

    await TextEditor.replace(range, newNum);
    if (oldLength !== newNum.length) {
      // Adjust end position according to difference in width of number-string
      endPos = new Position(endPos.line, startPos.character + newNum.length - 1);
    }

    return endPos;
  }

  /**
   * @returns a list of Ranges in which to search for numbers
   */
  private getSearchRanges(vimState: VimState): Range[] {
    let ranges: Range[] = [];
    const [start, stop] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);
    switch (vimState.currentMode) {
      case Mode.Normal: {
        ranges.push(
          new Range(vimState.cursorStopPosition, vimState.cursorStopPosition.getLineEnd())
        );
        break;
      }

      case Mode.Visual: {
        ranges.push(new Range(start, start.getLineEnd()));
        for (let line = start.line + 1; line < stop.line; line++) {
          const lineStart = new Position(line, 0);
          ranges.push(new Range(lineStart, lineStart.getLineEnd()));
        }
        ranges.push(new Range(stop.getLineBegin(), stop));
        break;
      }

      case Mode.VisualLine: {
        for (let line = start.line; line <= stop.line; line++) {
          const lineStart = new Position(line, 0);
          ranges.push(new Range(lineStart, lineStart.getLineEnd()));
        }
        break;
      }

      case Mode.VisualBlock: {
        const topLeft = visualBlockGetTopLeftPosition(start, stop);
        const bottomRight = visualBlockGetBottomRightPosition(start, stop);
        for (let line = topLeft.line; line <= bottomRight.line; line++) {
          ranges.push(
            new Range(
              new Position(line, topLeft.character),
              new Position(line, bottomRight.character)
            )
          );
        }
        break;
      }

      default:
        throw new Error('Unexpected mode in IncrementDecrementNumberAction.getPositions()');
    }
    return ranges;
  }
}

@RegisterAction
class IncrementNumberAction extends IncrementDecrementNumberAction {
  keys = ['<C-a>'];
  offset = +1;
  staircase = false;
}

@RegisterAction
class DecrementNumberAction extends IncrementDecrementNumberAction {
  keys = ['<C-x>'];
  offset = -1;
  staircase = false;
}

@RegisterAction
class IncrementNumberStaircaseAction extends IncrementDecrementNumberAction {
  keys = ['g', '<C-a>'];
  offset = +1;
  staircase = true;
}

@RegisterAction
class DecrementNumberStaircaseAction extends IncrementDecrementNumberAction {
  keys = ['g', '<C-x>'];
  offset = -1;
  staircase = true;
}

@RegisterAction
class CommandUnicodeName extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'a'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const char = vimState.editor.document.getText(new vscode.Range(position, position.getRight()));
    const charCode = char.charCodeAt(0);
    // TODO: Handle charCode > 127 by also including <M-x>
    StatusBar.setText(
      vimState,
      `<${char}>  ${charCode},  Hex ${charCode.toString(16)},  Octal ${charCode.toString(8)}`
    );
  }
}

@RegisterAction
class ActionTriggerHover extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'h'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('editor.action.showHover');
  }
}

/**
 * Multi-Cursor Command Overrides
 *
 * We currently have to override the VSCode key commands that get us into multi-cursor mode.
 *
 * Normally, we'd just listen for another cursor to be added in order to go into multi-cursor
 * mode rather than rewriting each keybinding one-by-one. We can't currently do that because
 * Visual Block Mode also creates additional cursors, but will get confused if you're in
 * multi-cursor mode.
 */

@RegisterAction
export class ActionOverrideCmdD extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual];
  keys = [['<D-d>'], ['g', 'b']];
  runsOnceForEveryCursor() {
    return false;
  }
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
    vimState.cursors = getCursorsAfterSync();

    // If this is the first cursor, select 1 character less
    // so that only the word is selected, no extra character
    vimState.cursors = vimState.cursors.map((x) => x.withNewStop(x.stop.getLeft()));

    await vimState.setCurrentMode(Mode.Visual);
  }
}

@RegisterAction
class ActionOverrideCmdDInsert extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<D-d>'];
  runsOnceForEveryCursor() {
    return false;
  }
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    // Since editor.action.addSelectionToNextFindMatch uses the selection to
    // determine where to add a word, we need to do a hack and manually set the
    // selections to the word boundaries before we make the api call.
    vscode.window.activeTextEditor!.selections = vscode.window.activeTextEditor!.selections.map(
      (x, idx) => {
        const curPos = Position.FromVSCodePosition(x.active);
        if (idx === 0) {
          return new vscode.Selection(
            curPos.getWordLeft(false),
            curPos.getLeft().getCurrentWordEnd(true).getRight()
          );
        } else {
          // Since we're adding the selections ourselves, we need to make sure
          // that our selection is actually over what our original word is
          const matchWordPos = Position.FromVSCodePosition(
            vscode.window.activeTextEditor!.selections[0].active
          );
          const matchWordLength =
            matchWordPos.getLeft().getCurrentWordEnd(true).getRight().character -
            matchWordPos.getWordLeft(false).character;
          const wordBegin = curPos.getLeft(matchWordLength);
          return new vscode.Selection(wordBegin, curPos);
        }
      }
    );
    await vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
    vimState.cursors = getCursorsAfterSync();
  }
}

@RegisterAction
class ActionOverrideCmdAltDown extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual];
  keys = [
    ['<D-alt+down>'], // OSX
    ['<C-alt+down>'], // Windows
  ];
  runsOnceForEveryCursor() {
    return false;
  }
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('editor.action.insertCursorBelow');
    vimState.cursors = getCursorsAfterSync();
  }
}

@RegisterAction
class ActionOverrideCmdAltUp extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual];
  keys = [
    ['<D-alt+up>'], // OSX
    ['<C-alt+up>'], // Windows
  ];
  runsOnceForEveryCursor() {
    return false;
  }
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('editor.action.insertCursorAbove');
    vimState.cursors = getCursorsAfterSync();
  }
}

@RegisterAction
class ActionShowFileInfo extends BaseCommand {
  modes = [Mode.Normal];
  keys = [['<C-g>']];

  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    reportFileInfo(position, vimState);
  }
}
