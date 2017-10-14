import { RecordedState, VimState } from './../../mode/modeHandler';
import { SearchState, SearchDirection } from './../../state/searchState';
import { ReplaceState } from './../../state/replaceState';
import { VisualBlockMode } from './../../mode/modeVisualBlock';
import { ModeName } from './../../mode/mode';
import { Range } from './../../common/motion/range';
import { TextEditor, EditorScrollByUnit, EditorScrollDirection } from './../../textEditor';
import { Register, RegisterMode } from './../../register/register';
import { NumericString } from './../../common/number/numericString';
import { Position, PositionDiff } from './../../common/motion/position';
import { Tab, TabCommand } from './../../cmd_line/commands/tab';
import { Configuration } from './../../configuration/configuration';
import { allowVSCodeToPropagateCursorUpdatesAndReturnThem } from '../../util';
import { isTextTransformation } from './../../transformations/transformations';
import { FileCommand } from './../../cmd_line/commands/file';
import { QuitCommand } from './../../cmd_line/commands/quit';
import { OnlyCommand } from './../../cmd_line/commands/only';
import * as vscode from 'vscode';
import * as util from './../../util';
import { RegisterAction } from './../base';
import * as operator from './../operator';
import { BaseAction } from './../base';

export class DocumentContentChangeAction extends BaseAction {
  contentChanges: {
    positionDiff: PositionDiff;
    textDiff: vscode.TextDocumentContentChangeEvent;
  }[] = [];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (this.contentChanges.length === 0) {
      return vimState;
    }

    let originalLeftBoundary: vscode.Position;

    if (
      this.contentChanges[0].textDiff.text === '' &&
      this.contentChanges[0].textDiff.rangeLength === 1
    ) {
      originalLeftBoundary = this.contentChanges[0].textDiff.range.end;
    } else {
      originalLeftBoundary = this.contentChanges[0].textDiff.range.start;
    }

    let rightBoundary: vscode.Position = position;
    let newStart: vscode.Position | undefined;
    let newEnd: vscode.Position | undefined;

    for (let i = 0; i < this.contentChanges.length; i++) {
      let contentChange = this.contentChanges[i].textDiff;

      if (contentChange.range.start.line < originalLeftBoundary.line) {
        // This change should be ignored
        let linesEffected = contentChange.range.end.line - contentChange.range.start.line + 1;
        let resultLines = contentChange.text.split('\n').length;
        originalLeftBoundary = originalLeftBoundary.with(
          originalLeftBoundary.line + resultLines - linesEffected
        );
        continue;
      }

      if (contentChange.range.start.line === originalLeftBoundary.line) {
        newStart = position.with(
          position.line,
          position.character + contentChange.range.start.character - originalLeftBoundary.character
        );

        if (contentChange.range.end.line === originalLeftBoundary.line) {
          newEnd = position.with(
            position.line,
            position.character + contentChange.range.end.character - originalLeftBoundary.character
          );
        } else {
          newEnd = position.with(
            position.line + contentChange.range.end.line - originalLeftBoundary.line,
            contentChange.range.end.character
          );
        }
      } else {
        newStart = position.with(
          position.line + contentChange.range.start.line - originalLeftBoundary.line,
          contentChange.range.start.character
        );
        newEnd = position.with(
          position.line + contentChange.range.end.line - originalLeftBoundary.line,
          contentChange.range.end.character
        );
      }

      if (newStart.isAfter(rightBoundary)) {
        // This change should be ignored as it's out of boundary
        continue;
      }

      // Calculate new right boundary
      let newLineCount = contentChange.text.split('\n').length;
      let newRightBoundary: vscode.Position;

      if (newLineCount === 1) {
        newRightBoundary = newStart.with(
          newStart.line,
          newStart.character + contentChange.text.length
        );
      } else {
        newRightBoundary = new vscode.Position(
          newStart.line + newLineCount - 1,
          contentChange.text.split('\n').pop()!.length
        );
      }

      if (newRightBoundary.isAfter(rightBoundary)) {
        rightBoundary = newRightBoundary;
      }

      vimState.editor.selection = new vscode.Selection(newStart, newEnd);

      if (newStart.isEqual(newEnd)) {
        await TextEditor.insert(contentChange.text, Position.FromVSCodePosition(newStart));
      } else {
        await TextEditor.replace(vimState.editor.selection, contentChange.text);
      }
    }

    /**
     * We're making an assumption here that content changes are always in order, and I'm not sure
     * we're guaranteed that, but it seems to work well enough in practice.
     */
    if (newStart && newEnd) {
      const last = this.contentChanges[this.contentChanges.length - 1];

      vimState.cursorStartPosition = Position.FromVSCodePosition(newStart)
        .advancePositionByText(last.textDiff.text)
        .add(last.positionDiff);
      vimState.cursorPosition = Position.FromVSCodePosition(newEnd)
        .advancePositionByText(last.textDiff.text)
        .add(last.positionDiff);
    }

    vimState.currentMode = ModeName.Insert;
    return vimState;
  }
}

/**
 * A command is something like <Esc>, :, v, i, etc.
 */
export abstract class BaseCommand extends BaseAction {
  /**
   * If isCompleteAction is true, then triggering this command is a complete action -
   * that means that we'll go and try to run it.
   */
  isCompleteAction = true;

  multicursorIndex: number | undefined = undefined;

  /**
   * In multi-cursor mode, do we run this command for every cursor, or just once?
   */
  public runsOnceForEveryCursor(): boolean {
    return true;
  }

  /**
   * If true, exec() will get called N times where N is the count.
   *
   * If false, exec() will only be called once, and you are expected to
   * handle count prefixes (e.g. the 3 in 3w) yourself.
   */
  runsOnceForEachCountPrefix = false;

  canBeRepeatedWithDot = false;

  /**
   * Run the command a single time.
   */
  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    throw new Error('Not implemented!');
  }

  /**
   * Run the command the number of times VimState wants us to.
   */
  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = this.runsOnceForEachCountPrefix ? vimState.recordedState.count || 1 : 1;

    if (!this.runsOnceForEveryCursor()) {
      for (let i = 0; i < timesToRepeat; i++) {
        vimState = await this.exec(position, vimState);
      }

      for (const transformation of vimState.recordedState.transformations) {
        if (isTextTransformation(transformation) && transformation.cursorIndex === undefined) {
          transformation.cursorIndex = 0;
        }
      }

      return vimState;
    }

    let resultingCursors: Range[] = [];

    const cursorsToIterateOver = vimState.allCursors
      .map(x => new Range(x.start, x.stop))
      .sort(
        (a, b) =>
          a.start.line > b.start.line ||
          (a.start.line === b.start.line && a.start.character > b.start.character)
            ? 1
            : -1
      );

    let cursorIndex = 0;
    for (const { start, stop } of cursorsToIterateOver) {
      this.multicursorIndex = cursorIndex++;

      vimState.cursorPosition = stop;
      vimState.cursorStartPosition = start;

      for (let j = 0; j < timesToRepeat; j++) {
        vimState = await this.exec(stop, vimState);
      }

      resultingCursors.push(new Range(vimState.cursorStartPosition, vimState.cursorPosition));

      for (const transformation of vimState.recordedState.transformations) {
        if (isTextTransformation(transformation) && transformation.cursorIndex === undefined) {
          transformation.cursorIndex = this.multicursorIndex;
        }
      }
    }

    vimState.allCursors = resultingCursors;

    return vimState;
  }
}

// begin actions

@RegisterAction
export class CommandNumber extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ['<number>'];
  isCompleteAction = false;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const number = parseInt(this.keysPressed[0], 10);

    vimState.recordedState.count = vimState.recordedState.count * 10 + number;

    return vimState;
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
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ['"', '<character>'];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const register = this.keysPressed[1];
    vimState.recordedState.registerName = register;
    return vimState;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = keysPressed[1];

    return super.doesActionApply(vimState, keysPressed) && Register.isValidRegister(register);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = keysPressed[1];

    return super.couldActionApply(vimState, keysPressed) && Register.isValidRegister(register);
  }
}

@RegisterAction
class CommandInsertRegisterContentInSearchMode extends BaseCommand {
  modes = [ModeName.SearchInProgressMode];
  keys = ['<C-r>', '<character>'];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.recordedState.registerName = this.keysPressed[1];
    const register = await Register.get(vimState);
    let text: string;

    if (register.text instanceof Array) {
      text = (register.text as string[]).join('\n');
    } else if (register.text instanceof RecordedState) {
      let keyStrokes: string[] = [];

      for (let action of register.text.actionsRun) {
        keyStrokes = keyStrokes.concat(action.keysPressed);
      }

      text = keyStrokes.join('\n');
    } else {
      text = register.text;
    }

    if (register.registerMode === RegisterMode.LineWise) {
      text += '\n';
    }

    const searchState = vimState.globalState.searchState!;
    searchState.searchString += text;
    return vimState;
  }
}

@RegisterAction
class CommandRecordMacro extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ['q', '<character>'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const register = this.keysPressed[1];
    vimState.recordedMacro = new RecordedState();
    vimState.recordedMacro.registerName = register.toLocaleLowerCase();

    if (!/^[A-Z]+$/.test(register) || !Register.has(register)) {
      // If register name is upper case, it means we are appending commands to existing register instead of overriding.
      let newRegister = new RecordedState();
      newRegister.registerName = register;
      Register.putByKey(newRegister, register);
    }

    vimState.isRecordingMacro = true;
    return vimState;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = this.keysPressed[1];

    return (
      super.doesActionApply(vimState, keysPressed) && Register.isValidRegisterForMacro(register)
    );
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = this.keysPressed[1];

    return (
      super.couldActionApply(vimState, keysPressed) && Register.isValidRegisterForMacro(register)
    );
  }
}

@RegisterAction
export class CommandQuitRecordMacro extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ['q'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let existingMacro = (await Register.getByKey(vimState.recordedMacro.registerName))
      .text as RecordedState;
    existingMacro.actionsRun = existingMacro.actionsRun.concat(vimState.recordedMacro.actionsRun);
    vimState.isRecordingMacro = false;
    return vimState;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && vimState.isRecordingMacro;
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.couldActionApply(vimState, keysPressed) && vimState.isRecordingMacro;
  }
}

@RegisterAction
class CommandExecuteMacro extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ['@', '<character>'];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const register = this.keysPressed[1];
    vimState.recordedState.transformations.push({
      type: 'macro',
      register: register,
      replay: 'contentChange',
    });

    return vimState;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = keysPressed[1];

    return (
      super.doesActionApply(vimState, keysPressed) && Register.isValidRegisterForMacro(register)
    );
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = keysPressed[1];

    return (
      super.couldActionApply(vimState, keysPressed) && Register.isValidRegisterForMacro(register)
    );
  }
}

@RegisterAction
class CommandExecuteLastMacro extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ['@', '@'];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let lastInvokedMacro = vimState.historyTracker.lastInvokedMacro;

    if (lastInvokedMacro) {
      vimState.recordedState.transformations.push({
        type: 'macro',
        register: lastInvokedMacro.registerName,
        replay: 'contentChange',
      });
    }

    return vimState;
  }
}

@RegisterAction
class CommandEsc extends BaseCommand {
  modes = [
    ModeName.Visual,
    ModeName.VisualLine,
    ModeName.VisualBlock,
    ModeName.Normal,
    ModeName.SearchInProgressMode,
    ModeName.SurroundInputMode,
    ModeName.EasyMotionMode,
    ModeName.EasyMotionInputMode,
  ];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.currentMode === ModeName.Normal && !vimState.isMultiCursor) {
      // If there's nothing to do on the vim side, we might as well call some
      // of vscode's default "close notification" actions. I think we should
      // just add to this list as needed.
      await vscode.commands.executeCommand('closeReferenceSearchEditor');
      return vimState;
    }

    if (
      vimState.currentMode !== ModeName.Visual &&
      vimState.currentMode !== ModeName.VisualLine &&
      vimState.currentMode !== ModeName.EasyMotionMode
    ) {
      // Normally, you don't have to iterate over all cursors,
      // as that is handled for you by the state machine. ESC is
      // a special case since runsOnceForEveryCursor is false.

      vimState.allCursors = vimState.allCursors.map(x => x.withNewStop(x.stop.getLeft()));
    }

    if (vimState.currentMode === ModeName.SearchInProgressMode) {
      if (vimState.globalState.searchState) {
        vimState.cursorPosition = vimState.globalState.searchState.searchCursorStartPosition;
      }
    }

    if (vimState.currentMode === ModeName.Normal && vimState.isMultiCursor) {
      vimState.isMultiCursor = false;
    }

    if (vimState.currentMode === ModeName.EasyMotionMode) {
      // Escape or other termination keys were pressed, exit mode
      vimState.easyMotion.clearDecorations();
      vimState.currentMode = ModeName.Normal;
    }

    // Abort surround operation
    if (vimState.currentMode === ModeName.SurroundInputMode) {
      vimState.surround = undefined;
    }

    vimState.currentMode = ModeName.Normal;

    if (!vimState.isMultiCursor) {
      vimState.allCursors = [vimState.allCursors[0]];
    }

    return vimState;
  }
}

@RegisterAction
class CommandEscReplaceMode extends BaseCommand {
  modes = [ModeName.Replace];
  keys = [['<Esc>'], ['<C-c>']];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const timesToRepeat = vimState.replaceState!.timesToRepeat;
    let textToAdd = '';

    for (let i = 1; i < timesToRepeat; i++) {
      textToAdd += vimState.replaceState!.newChars.join('');
    }

    vimState.recordedState.transformations.push({
      type: 'insertText',
      text: textToAdd,
      position: position,
      diff: new PositionDiff(0, -1),
    });

    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

abstract class CommandEditorScroll extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  runsOnceForEachCountPrefix = false;
  keys: string[];
  to: EditorScrollDirection;
  by: EditorScrollByUnit;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;

    vimState.postponedCodeViewChanges.push({
      command: 'editorScroll',
      args: {
        to: this.to,
        by: this.by,
        value: timesToRepeat,
        revealCursor: true,
        select:
          [ModeName.Visual, ModeName.VisualBlock, ModeName.VisualLine].indexOf(
            vimState.currentMode
          ) >= 0,
      },
    });
    return vimState;
  }
}

@RegisterAction
class CommandCtrlE extends CommandEditorScroll {
  keys = ['<C-e>'];
  to: EditorScrollDirection = 'down';
  by: EditorScrollByUnit = 'line';
}

@RegisterAction
class CommandCtrlY extends CommandEditorScroll {
  keys = ['<C-y>'];
  to: EditorScrollDirection = 'up';
  by: EditorScrollByUnit = 'line';
}

@RegisterAction
class CommandMoveFullPageUp extends CommandEditorScroll {
  keys = ['<C-b>'];
  to: EditorScrollDirection = 'up';
  by: EditorScrollByUnit = 'page';
}

@RegisterAction
class CommandMoveFullPageDown extends CommandEditorScroll {
  keys = ['<C-f>'];
  to: EditorScrollDirection = 'down';
  by: EditorScrollByUnit = 'page';
}

@RegisterAction
class CommandMoveHalfPageDown extends CommandEditorScroll {
  keys = ['<C-d>'];
  to: EditorScrollDirection = 'down';
  by: EditorScrollByUnit = 'halfPage';
}

@RegisterAction
class CommandMoveHalfPageUp extends CommandEditorScroll {
  keys = ['<C-u>'];
  to: EditorScrollDirection = 'up';
  by: EditorScrollByUnit = 'halfPage';
}

@RegisterAction
export class CommandInsertAtCursor extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['i'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    return vimState;
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
class CommandReplaceAtCursor extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['R'];
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;

    vimState.currentMode = ModeName.Replace;
    vimState.replaceState = new ReplaceState(position, timesToRepeat);

    return vimState;
  }
}

@RegisterAction
class CommandReplaceInReplaceMode extends BaseCommand {
  modes = [ModeName.Replace];
  keys = ['<character>'];
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const char = this.keysPressed[0];
    const replaceState = vimState.replaceState!;

    if (char === '<BS>') {
      if (position.isBeforeOrEqual(replaceState.replaceCursorStartPosition)) {
        // If you backspace before the beginning of where you started to replace,
        // just move the cursor back.

        vimState.cursorPosition = position.getLeft();
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
          start: position.getLeft(),
          end: position,
          diff: new PositionDiff(0, -1),
        });
      }

      replaceState.newChars.pop();
    } else {
      if (!position.isLineEnd() && char !== '\n') {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: char,
          start: position,
          end: position.getRight(),
          diff: new PositionDiff(0, 1),
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

    vimState.currentMode = ModeName.Replace;
    return vimState;
  }
}

@RegisterAction
class CommandInsertInSearchMode extends BaseCommand {
  modes = [ModeName.SearchInProgressMode];
  keys = [['<character>'], ['<up>'], ['<down>']];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const key = this.keysPressed[0];
    const searchState = vimState.globalState.searchState!;
    const prevSearchList = vimState.globalState.searchStatePrevious!;

    // handle special keys first
    if (key === '<BS>' || key === '<shift+BS>') {
      searchState.searchString = searchState.searchString.slice(0, -1);
    } else if (key === '\n') {
      vimState.currentMode = vimState.globalState.searchState!.previousMode;

      // Repeat the previous search if no new string is entered
      if (searchState.searchString === '') {
        if (prevSearchList.length > 0) {
          searchState.searchString = prevSearchList[prevSearchList.length - 1].searchString;
        }
      }

      // Store this search if different than previous
      if (vimState.globalState.searchStatePrevious.length !== 0) {
        let previousSearchState = vimState.globalState.searchStatePrevious;
        if (
          searchState.searchString !==
          previousSearchState[previousSearchState.length - 1]!.searchString
        ) {
          previousSearchState.push(searchState);
        }
      } else {
        vimState.globalState.searchStatePrevious.push(searchState);
      }

      // Make sure search history does not exceed configuration option
      if (vimState.globalState.searchStatePrevious.length > Configuration.history) {
        vimState.globalState.searchStatePrevious.splice(0, 1);
      }

      // Update the index to the end of the search history
      vimState.globalState.searchStateIndex = vimState.globalState.searchStatePrevious.length - 1;

      // Move cursor to next match
      vimState.cursorPosition = searchState.getNextSearchMatchPosition(vimState.cursorPosition).pos;

      return vimState;
    } else if (key === '<up>') {
      vimState.globalState.searchStateIndex -= 1;

      // Clamp the history index to stay within bounds of search history length
      vimState.globalState.searchStateIndex = Math.max(vimState.globalState.searchStateIndex, 0);

      if (prevSearchList[vimState.globalState.searchStateIndex] !== undefined) {
        searchState.searchString =
          prevSearchList[vimState.globalState.searchStateIndex].searchString;
      }
    } else if (key === '<down>') {
      vimState.globalState.searchStateIndex += 1;

      // If past the first history item, allow user to enter their own search string (not using history)
      if (
        vimState.globalState.searchStateIndex >
        vimState.globalState.searchStatePrevious.length - 1
      ) {
        searchState.searchString = '';
        vimState.globalState.searchStateIndex = vimState.globalState.searchStatePrevious.length;
        return vimState;
      }

      if (prevSearchList[vimState.globalState.searchStateIndex] !== undefined) {
        searchState.searchString =
          prevSearchList[vimState.globalState.searchStateIndex].searchString;
      }
    } else {
      searchState.searchString += this.keysPressed[0];
    }

    return vimState;
  }
}

@RegisterAction
class CommandEscInSearchMode extends BaseCommand {
  modes = [ModeName.SearchInProgressMode];
  keys = ['<Esc>'];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;
    vimState.globalState.searchState = undefined;

    return vimState;
  }
}

@RegisterAction
class CommandCtrlVInSearchMode extends BaseCommand {
  modes = [ModeName.SearchInProgressMode];
  keys = ['<C-v>'];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const searchState = vimState.globalState.searchState!;
    const textFromClipboard = util.clipboardPaste();

    searchState.searchString += textFromClipboard;
    return vimState;
  }
}

@RegisterAction
class CommandCmdVInSearchMode extends BaseCommand {
  modes = [ModeName.SearchInProgressMode];
  keys = ['<D-v>'];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const searchState = vimState.globalState.searchState!;
    const textFromClipboard = util.clipboardPaste();

    searchState.searchString += textFromClipboard;
    return vimState;
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
  modes = [
    ModeName.Visual,
    ModeName.VisualLine,
    ModeName.VisualBlock,
    ModeName.Insert,
    ModeName.Normal,
  ];
  keys = ['<copy>']; // A special key - see ModeHandler
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let text = '';

    if (vimState.currentMode === ModeName.Visual || vimState.currentMode === ModeName.Normal) {
      text = vimState.allCursors
        .map(range => {
          const start = Position.EarlierOf(range.start, range.stop);
          const stop = Position.LaterOf(range.start, range.stop);
          return vimState.editor.document.getText(new vscode.Range(start, stop.getRight()));
        })
        .join('\n');
    } else if (vimState.currentMode === ModeName.VisualLine) {
      text = vimState.allCursors
        .map(range => {
          return vimState.editor.document.getText(
            new vscode.Range(
              Position.EarlierOf(range.start.getLineBegin(), range.stop.getLineBegin()),
              Position.LaterOf(range.start.getLineEnd(), range.stop.getLineEnd())
            )
          );
        })
        .join('\n');
    } else if (vimState.currentMode === ModeName.VisualBlock) {
      for (const { line } of Position.IterateLine(vimState)) {
        text += line + '\n';
      }
    } else if (vimState.currentMode === ModeName.Insert) {
      text = vimState.editor.selections
        .map(selection => {
          return vimState.editor.document.getText(new vscode.Range(selection.start, selection.end));
        })
        .join('\n');
    }

    util.clipboardCopy(text);
    // all vim yank operations return to normal mode.
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandCmdA extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ['<D-a>'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorStartPosition = new Position(0, vimState.desiredColumn);
    vimState.cursorPosition = new Position(TextEditor.getLineCount() - 1, vimState.desiredColumn);
    vimState.currentMode = ModeName.VisualLine;

    return vimState;
  }
}

function searchCurrentWord(
  position: Position,
  vimState: VimState,
  direction: SearchDirection,
  isExact: boolean
) {
  const currentWord = TextEditor.getWord(position);

  // If the search is going left then use `getWordLeft()` on position to start
  // at the beginning of the word. This ensures that any matches happen
  // outside of the currently selected word.
  const searchStartCursorPosition =
    direction === SearchDirection.Backward
      ? vimState.cursorPosition.getWordLeft(true)
      : vimState.cursorPosition;

  return createSearchStateAndMoveToMatch({
    needle: currentWord,
    vimState,
    direction,
    isExact,
    searchStartCursorPosition,
  });
}

function searchCurrentSelection(vimState: VimState, direction: SearchDirection) {
  const selection = TextEditor.getSelection();
  const end = new Position(selection.end.line, selection.end.character);
  const currentSelection = TextEditor.getText(selection.with(selection.start, end));

  // Go back to Normal mode, otherwise the selection grows to the next match.
  vimState.currentMode = ModeName.Normal;

  // If the search is going left then use `getLeft()` on the selection start.
  // If going right then use `getRight()` on the selection end. This ensures
  // that any matches happen outside of the currently selected word.
  const searchStartCursorPosition =
    direction === SearchDirection.Backward
      ? vimState.lastVisualSelectionStart.getLeft()
      : vimState.lastVisualSelectionEnd.getRight();

  return createSearchStateAndMoveToMatch({
    needle: currentSelection,
    vimState,
    direction,
    isExact: false,
    searchStartCursorPosition,
  });
}

function createSearchStateAndMoveToMatch(args: {
  needle?: string | undefined;
  vimState: VimState;
  direction: SearchDirection;
  isExact: boolean;
  searchStartCursorPosition: Position;
}) {
  const { needle, vimState, isExact } = args;

  if (needle === undefined || needle.length === 0) {
    return vimState;
  }

  const searchString = isExact ? `\\b${needle}\\b` : needle;

  // Start a search for the given term.
  vimState.globalState.searchState = new SearchState(
    args.direction,
    vimState.cursorPosition,
    searchString,
    { isRegex: isExact },
    vimState.currentMode
  );

  vimState.cursorPosition = vimState.globalState.searchState.getNextSearchMatchPosition(
    args.searchStartCursorPosition
  ).pos;

  // Turn one of the highlighting flags back on (turned off with :nohl)
  vimState.globalState.hl = true;

  return vimState;
}

@RegisterAction
class CommandSearchCurrentWordExactForward extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['*'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return searchCurrentWord(position, vimState, SearchDirection.Forward, true);
  }
}

@RegisterAction
class CommandSearchCurrentWordForward extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ['g', '*'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return searchCurrentWord(position, vimState, SearchDirection.Forward, false);
  }
}

@RegisterAction
class CommandSearchVisualForward extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ['*'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return searchCurrentSelection(vimState, SearchDirection.Forward);
  }
}

@RegisterAction
class CommandSearchCurrentWordExactBackward extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['#'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return searchCurrentWord(position, vimState, SearchDirection.Backward, true);
  }
}

@RegisterAction
class CommandSearchCurrentWordBackward extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ['g', '#'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return searchCurrentWord(position, vimState, SearchDirection.Backward, false);
  }
}

@RegisterAction
class CommandSearchVisualBackward extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ['#'];
  isMotion = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return searchCurrentSelection(vimState, SearchDirection.Backward);
  }
}

@RegisterAction
export class CommandSearchForwards extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ['/'];
  isMotion = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.globalState.searchState = new SearchState(
      SearchDirection.Forward,
      vimState.cursorPosition,
      '',
      { isRegex: true },
      vimState.currentMode
    );
    vimState.currentMode = ModeName.SearchInProgressMode;

    // Reset search history index
    vimState.globalState.searchStateIndex = vimState.globalState.searchStatePrevious.length;

    vimState.globalState.hl = true;

    return vimState;
  }
}

@RegisterAction
export class CommandSearchBackwards extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ['?'];
  isMotion = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.globalState.searchState = new SearchState(
      SearchDirection.Backward,
      vimState.cursorPosition,
      '',
      { isRegex: true },
      vimState.currentMode
    );
    vimState.currentMode = ModeName.SearchInProgressMode;

    // Reset search history index
    vimState.globalState.searchStateIndex = vimState.globalState.searchStatePrevious.length;

    vimState.globalState.hl = true;

    return vimState;
  }
}

@RegisterAction
export class MarkCommand extends BaseCommand {
  keys = ['m', '<character>'];
  modes = [ModeName.Normal];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const markName = this.keysPressed[1];

    vimState.historyTracker.addMark(position, markName);

    return vimState;
  }
}

@RegisterAction
export class PutCommand extends BaseCommand {
  keys = ['p'];
  modes = [ModeName.Normal];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  constructor(multicursorIndex?: number) {
    super();
    this.multicursorIndex = multicursorIndex;
  }
  public static async GetText(
    vimState: VimState,
    multicursorIndex: number | undefined = undefined
  ): Promise<string> {
    const register = await Register.get(vimState);

    if (vimState.isMultiCursor) {
      if (multicursorIndex === undefined) {
        console.log('ERROR: no multi cursor index when calling PutCommand#getText');

        throw new Error('Bad!');
      }

      if (vimState.isMultiCursor && typeof register.text === 'object') {
        return register.text[multicursorIndex];
      }
    }

    return register.text as string;
  }

  public async exec(
    position: Position,
    vimState: VimState,
    after: boolean = false,
    adjustIndent: boolean = false
  ): Promise<VimState> {
    const register = await Register.get(vimState);
    const dest = after ? position : position.getRight();

    if (register.text instanceof RecordedState) {
      /**
       *  Paste content from recordedState. This one is actually complex as
       *  Vim has internal key code for key strokes.For example, Backspace
       *  is stored as `<80>kb`. So if you replay a macro, which is stored
       *  in a register as `a1<80>kb2`, youshall just get `2` inserted as
       *  `a` represents entering Insert Mode, `<80>bk` represents
       *  Backspace. However here, we shall
       *  insert the plain text content of the register, which is `a1<80>kb2`.
       */
      vimState.recordedState.transformations.push({
        type: 'macro',
        register: vimState.recordedState.registerName,
        replay: 'keystrokes',
      });
      return vimState;
    } else if (typeof register.text === 'object' && vimState.currentMode === ModeName.VisualBlock) {
      return await this.execVisualBlockPaste(register.text, position, vimState, after);
    }

    let text = await PutCommand.GetText(vimState, this.multicursorIndex);

    let textToAdd: string;
    let whereToAddText: Position;
    let diff = new PositionDiff(0, 0);

    if (register.registerMode === RegisterMode.CharacterWise) {
      textToAdd = text;
      whereToAddText = dest;
    } else if (
      vimState.currentMode === ModeName.Visual &&
      register.registerMode === RegisterMode.LineWise
    ) {
      // in the specific case of linewise register data during visual mode,
      // we need extra newline feeds
      textToAdd = '\n' + text + '\n';
      whereToAddText = dest;
    } else {
      if (adjustIndent) {
        // Adjust indent to current line
        let indentationWidth = TextEditor.getIndentationLevel(TextEditor.getLineAt(position).text);
        let firstLineIdentationWidth = TextEditor.getIndentationLevel(text.split('\n')[0]);

        text = text
          .split('\n')
          .map(line => {
            let currentIdentationWidth = TextEditor.getIndentationLevel(line);
            let newIndentationWidth =
              currentIdentationWidth - firstLineIdentationWidth + indentationWidth;

            return TextEditor.setIndentationLevel(line, newIndentationWidth);
          })
          .join('\n');
      }

      if (after) {
        // P insert before current line
        textToAdd = text + '\n';
        whereToAddText = dest.getLineBegin();
      } else {
        // p paste after current line
        textToAdd = '\n' + text;
        whereToAddText = dest.getLineEnd();
      }
    }

    // More vim weirdness: If the thing you're pasting has a newline, the cursor
    // stays in the same place. Otherwise, it moves to the end of what you pasted.

    const numNewlines = text.split('\n').length - 1;
    const currentLineLength = TextEditor.getLineAt(position).text.length;

    if (register.registerMode === RegisterMode.LineWise) {
      const check = text.match(/^\s*/);
      let numWhitespace = 0;

      if (check) {
        numWhitespace = check[0].length;
      }

      if (after) {
        diff = PositionDiff.NewBOLDiff(-numNewlines - 1, numWhitespace);
      } else {
        diff = PositionDiff.NewBOLDiff(currentLineLength > 0 ? 1 : -numNewlines, numWhitespace);
      }
    } else {
      if (text.indexOf('\n') === -1) {
        if (!position.isLineEnd()) {
          if (after) {
            diff = new PositionDiff(0, -1);
          } else {
            diff = new PositionDiff(0, textToAdd.length);
          }
        }
      } else {
        if (position.isLineEnd()) {
          diff = PositionDiff.NewBOLDiff(-numNewlines, position.character);
        } else {
          if (after) {
            diff = PositionDiff.NewBOLDiff(-numNewlines, position.character);
          } else {
            diff = new PositionDiff(0, 1);
          }
        }
      }
    }

    vimState.recordedState.transformations.push({
      type: 'insertText',
      text: textToAdd,
      position: whereToAddText,
      diff: diff,
    });

    vimState.currentRegisterMode = register.registerMode;
    return vimState;
  }

  private async execVisualBlockPaste(
    block: string[],
    position: Position,
    vimState: VimState,
    after: boolean
  ): Promise<VimState> {
    if (after) {
      position = position.getRight();
    }

    // Add empty lines at the end of the document, if necessary.
    let linesToAdd = Math.max(0, block.length - (TextEditor.getLineCount() - position.line) + 1);

    if (linesToAdd > 0) {
      await TextEditor.insertAt(
        Array(linesToAdd).join('\n'),
        new Position(
          TextEditor.getLineCount() - 1,
          TextEditor.getLineAt(new Position(TextEditor.getLineCount() - 1, 0)).text.length
        )
      );
    }

    // paste the entire block.
    for (let lineIndex = position.line; lineIndex < position.line + block.length; lineIndex++) {
      const line = block[lineIndex - position.line];
      const insertPos = new Position(
        lineIndex,
        Math.min(position.character, TextEditor.getLineAt(new Position(lineIndex, 0)).text.length)
      );

      await TextEditor.insertAt(line, insertPos);
    }

    vimState.currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;
    return vimState;
  }

  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    const result = await super.execCount(position, vimState);

    if (
      vimState.effectiveRegisterMode() === RegisterMode.LineWise &&
      vimState.recordedState.count > 0
    ) {
      const numNewlines =
        (await PutCommand.GetText(vimState, this.multicursorIndex)).split('\n').length *
        vimState.recordedState.count;

      result.recordedState.transformations.push({
        type: 'moveCursor',
        diff: new PositionDiff(-numNewlines + 1, 0),
        cursorIndex: this.multicursorIndex,
      });
    }

    return result;
  }
}

@RegisterAction
export class GPutCommand extends BaseCommand {
  keys = ['g', 'p'];
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const result = await new PutCommand().exec(position, vimState);

    return result;
  }

  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    const register = await Register.get(vimState);
    let addedLinesCount: number;

    if (register.text instanceof RecordedState) {
      vimState.recordedState.transformations.push({
        type: 'macro',
        register: vimState.recordedState.registerName,
        replay: 'keystrokes',
      });

      return vimState;
    }
    if (typeof register.text === 'object') {
      // visual block mode
      addedLinesCount = register.text.length * vimState.recordedState.count;
    } else {
      addedLinesCount = register.text.split('\n').length;
    }

    const result = await super.execCount(position, vimState);

    if (vimState.effectiveRegisterMode() === RegisterMode.LineWise) {
      const line = TextEditor.getLineAt(position).text;
      const addAnotherLine = line.length > 0 && addedLinesCount > 1;

      result.recordedState.transformations.push({
        type: 'moveCursor',
        diff: PositionDiff.NewBOLDiff(1 + (addAnotherLine ? 1 : 0), 0),
        cursorIndex: this.multicursorIndex,
      });
    }

    return result;
  }
}

@RegisterAction
export class PutWithIndentCommand extends BaseCommand {
  keys = [']', 'p'];
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const result = await new PutCommand().exec(position, vimState, false, true);
    return result;
  }

  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    return await super.execCount(position, vimState);
  }
}

@RegisterAction
export class PutCommandVisual extends BaseCommand {
  keys = [['p'], ['P']];
  modes = [ModeName.Visual, ModeName.VisualLine];
  runsOnceForEachCountPrefix = true;

  public async exec(
    position: Position,
    vimState: VimState,
    after: boolean = false
  ): Promise<VimState> {
    let start = vimState.cursorStartPosition;
    let end = vimState.cursorPosition;
    const isLineWise = vimState.currentMode === ModeName.VisualLine;
    if (start.isAfter(end)) {
      [start, end] = [end, start];
    }

    // If the to be inserted text is linewise we have a seperate logic delete the
    // selection first than insert
    let register = await Register.get(vimState);
    if (register.registerMode === RegisterMode.LineWise) {
      let deleteResult = await new operator.DeleteOperator(this.multicursorIndex).run(
        vimState,
        start,
        end,
        false
      );
      // to ensure, that the put command nows this is
      // an linewise register insertion in visual mode
      let oldMode = deleteResult.currentMode;
      deleteResult.currentMode = ModeName.Visual;
      deleteResult = await new PutCommand().exec(start, deleteResult, true);
      deleteResult.currentMode = oldMode;
      return deleteResult;
    }

    // The reason we need to handle Delete and Yank separately is because of
    // linewise mode. If we're in visualLine mode, then we want to copy
    // linewise but not necessarily delete linewise.
    let putResult = await new PutCommand(this.multicursorIndex).exec(start, vimState, true);
    putResult.currentRegisterMode = isLineWise ? RegisterMode.LineWise : RegisterMode.CharacterWise;
    putResult.recordedState.registerName = Configuration.useSystemClipboard ? '*' : '"';
    putResult = await new operator.YankOperator(this.multicursorIndex).run(putResult, start, end);
    putResult.currentRegisterMode = RegisterMode.CharacterWise;
    putResult = await new operator.DeleteOperator(this.multicursorIndex).run(
      putResult,
      start,
      end.getLeftIfEOL(),
      false
    );
    putResult.currentRegisterMode = RegisterMode.FigureItOutFromCurrentMode;
    return putResult;
  }

  // TODO - execWithCount
}

@RegisterAction
export class PutBeforeCommand extends BaseCommand {
  public keys = ['P'];
  public modes = [ModeName.Normal];
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const command = new PutCommand();
    command.multicursorIndex = this.multicursorIndex;

    const result = await command.exec(position, vimState, true);

    return result;
  }
}

@RegisterAction
export class GPutBeforeCommand extends BaseCommand {
  keys = ['g', 'P'];
  modes = [ModeName.Normal];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const result = await new PutCommand().exec(position, vimState, true);
    const register = await Register.get(vimState);
    let addedLinesCount: number;

    if (register.text instanceof RecordedState) {
      vimState.recordedState.transformations.push({
        type: 'macro',
        register: vimState.recordedState.registerName,
        replay: 'keystrokes',
      });

      return vimState;
    } else if (typeof register.text === 'object') {
      // visual block mode
      addedLinesCount = register.text.length * vimState.recordedState.count;
    } else {
      addedLinesCount = register.text.split('\n').length;
    }

    if (vimState.effectiveRegisterMode() === RegisterMode.LineWise) {
      const line = TextEditor.getLineAt(position).text;
      const addAnotherLine = line.length > 0 && addedLinesCount > 1;

      result.recordedState.transformations.push({
        type: 'moveCursor',
        diff: PositionDiff.NewBOLDiff(1 + (addAnotherLine ? 1 : 0), 0),
        cursorIndex: this.multicursorIndex,
      });
    }

    return result;
  }
}

@RegisterAction
export class PutBeforeWithIndentCommand extends BaseCommand {
  keys = ['[', 'p'];
  modes = [ModeName.Normal];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const result = await new PutCommand().exec(position, vimState, true, true);

    if (vimState.effectiveRegisterMode() === RegisterMode.LineWise) {
      result.cursorPosition = result.cursorPosition
        .getPreviousLineBegin()
        .getFirstLineNonBlankChar();
    }

    return result;
  }
}

@RegisterAction
class CommandShowCommandLine extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = [':'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.recordedState.transformations.push({
      type: 'showCommandLine',
    });

    if (vimState.currentMode === ModeName.Normal) {
      vimState.commandInitialText = '';
    } else {
      vimState.commandInitialText = "'<,'>";
    }
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandDot extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['.'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.recordedState.transformations.push({
      type: 'dot',
    });

    return vimState;
  }
}

abstract class CommandFold extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  commandName: string;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand(this.commandName);
    vimState.currentMode = ModeName.Normal;
    return vimState;
  }
}

@RegisterAction
class CommandCloseFold extends CommandFold {
  keys = ['z', 'c'];
  commandName = 'editor.fold';
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;
    await vscode.commands.executeCommand('editor.fold', { levels: timesToRepeat, direction: 'up' });
    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();
    return vimState;
  }
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
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;
    await vscode.commands.executeCommand('editor.unfold', {
      levels: timesToRepeat,
      direction: 'up',
    });

    return vimState;
  }
}

@RegisterAction
class CommandOpenAllFolds extends CommandFold {
  keys = ['z', 'R'];
  commandName = 'editor.unfoldAll';
}

@RegisterAction
class CommandCloseAllFoldsRecursively extends CommandFold {
  modes = [ModeName.Normal];
  keys = ['z', 'C'];
  commandName = 'editor.foldRecursively';
}

@RegisterAction
class CommandOpenAllFoldsRecursively extends CommandFold {
  modes = [ModeName.Normal];
  keys = ['z', 'O'];
  commandName = 'editor.unfoldRecursively';
}

@RegisterAction
class CommandCenterScroll extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ['z', 'z'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // In these modes you want to center on the cursor position
    vimState.editor.revealRange(
      new vscode.Range(vimState.cursorPosition, vimState.cursorPosition),
      vscode.TextEditorRevealType.InCenter
    );

    return vimState;
  }
}

@RegisterAction
class CommandCenterScrollFirstChar extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ['z', '.'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // In these modes you want to center on the cursor position
    // This particular one moves cursor to first non blank char though
    vimState.editor.revealRange(
      new vscode.Range(vimState.cursorPosition, vimState.cursorPosition),
      vscode.TextEditorRevealType.InCenter
    );

    // Move cursor to first char of line
    vimState.cursorPosition = vimState.cursorPosition.getFirstLineNonBlankChar();

    return vimState;
  }
}

@RegisterAction
class CommandTopScroll extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['z', 't'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: 'revealLine',
      args: {
        lineNumber: position.line,
        at: 'top',
      },
    });
    return vimState;
  }
}

@RegisterAction
class CommandTopScrollFirstChar extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ['z', '\n'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
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
    vimState.cursorPosition = vimState.cursorPosition.getFirstLineNonBlankChar();

    return vimState;
  }
}

@RegisterAction
class CommandBottomScroll extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['z', 'b'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: 'revealLine',
      args: {
        lineNumber: position.line,
        at: 'bottom',
      },
    });
    return vimState;
  }
}

@RegisterAction
class CommandBottomScrollFirstChar extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ['z', '-'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
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
    vimState.cursorPosition = vimState.cursorPosition.getFirstLineNonBlankChar();

    return vimState;
  }
}

@RegisterAction
class CommandGoToOtherEndOfHighlightedText extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ['o'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    [vimState.cursorStartPosition, vimState.cursorPosition] = [
      vimState.cursorPosition,
      vimState.cursorStartPosition,
    ];

    return vimState;
  }
}

@RegisterAction
class CommandUndo extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['u'];
  runsOnceForEveryCursor() {
    return false;
  }
  mustBeFirstKey = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const newPositions = await vimState.historyTracker.goBackHistoryStep();

    if (newPositions !== undefined) {
      vimState.allCursors = newPositions.map(x => new Range(x, x));
    }

    vimState.alteredHistory = true;
    return vimState;
  }
}

@RegisterAction
class CommandRedo extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['<C-r>'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const newPositions = await vimState.historyTracker.goForwardHistoryStep();

    if (newPositions !== undefined) {
      vimState.allCursors = newPositions.map(x => new Range(x, x));
    }

    vimState.alteredHistory = true;
    return vimState;
  }
}

@RegisterAction
class CommandDeleteToLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['D'];
  canBeRepeatedWithDot = true;
  runsOnceForEveryCursor() {
    return true;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (position.isLineEnd()) {
      return vimState;
    }

    return await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      position,
      position.getLineEnd().getLeft()
    );
  }
}

@RegisterAction
export class CommandYankFullLine extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['Y'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const linesDown = (vimState.recordedState.count || 1) - 1;
    const start = position.getLineBegin();
    const end = new Position(position.line + linesDown, 0).getLineEnd().getLeft();

    vimState.currentRegisterMode = RegisterMode.LineWise;

    return await new operator.YankOperator().run(vimState, start, end);
  }
}

@RegisterAction
class CommandChangeToLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['C'];
  runsOnceForEachCountPrefix = false;
  mustBeFirstKey = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let count = vimState.recordedState.count || 1;

    return new operator.ChangeOperator().run(
      vimState,
      position,
      position
        .getDownByCount(Math.max(0, count - 1))
        .getLineEnd()
        .getLeft()
    );
  }
}

@RegisterAction
class CommandClearLine extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['S'];
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let count = vimState.recordedState.count || 1;
    let end = position
      .getDownByCount(Math.max(0, count - 1))
      .getLineEnd()
      .getLeft();
    return new operator.ChangeOperator().run(
      vimState,
      position.getLineBeginRespectingIndent(),
      end
    );
  }
}

@RegisterAction
class CommandExitVisualMode extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ['v'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandVisualMode extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['v'];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Visual;

    return vimState;
  }
}

@RegisterAction
class CommandReselectVisual extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['g', 'v'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // Try to restore selection only if valid
    if (
      vimState.lastVisualSelectionEnd !== undefined &&
      vimState.lastVisualSelectionStart !== undefined &&
      vimState.lastVisualMode !== undefined
    ) {
      if (vimState.lastVisualSelectionEnd.line <= TextEditor.getLineCount() - 1) {
        vimState.currentMode = vimState.lastVisualMode;
        vimState.cursorStartPosition = vimState.lastVisualSelectionStart;
        vimState.cursorPosition = vimState.lastVisualSelectionEnd.getLeft();
      }
    }
    return vimState;
  }
}

@RegisterAction
class CommandVisualBlockMode extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualBlock];
  keys = ['<C-v>'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.currentMode === ModeName.VisualBlock) {
      vimState.currentMode = ModeName.Normal;
    } else {
      vimState.currentMode = ModeName.VisualBlock;
    }

    return vimState;
  }
}

@RegisterAction
class CommandVisualLineMode extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ['V'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.VisualLine;

    return vimState;
  }
}

@RegisterAction
class CommandExitVisualLineMode extends BaseCommand {
  modes = [ModeName.VisualLine];
  keys = ['V'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandOpenFile extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ['g', 'f'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let fullFilePath: string = '';

    if (vimState.currentMode === ModeName.Visual) {
      const selection = TextEditor.getSelection();
      const end = new Position(selection.end.line, selection.end.character + 1);
      fullFilePath = TextEditor.getText(selection.with(selection.start, end));
    } else {
      const start = position.getFilePathLeft(true);
      const end = position.getFilePathRight();
      const range = new vscode.Range(start, end);

      fullFilePath = TextEditor.getText(range).trim();
    }
    const fileInfo = fullFilePath.match(/(.*?(?=:[0-9]+)|.*):?([0-9]*)$/);
    if (fileInfo) {
      const filePath = fileInfo[1];
      const lineNumber = parseInt(fileInfo[2], 10);
      const fileCommand = new FileCommand({ name: filePath, lineNumber: lineNumber });
      fileCommand.execute();
    }

    return vimState;
  }
}

@RegisterAction
class CommandGoToDefinition extends BaseCommand {
  modes = [ModeName.Normal];
  keys = [['g', 'd'], ['<C-]>']];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const oldActiveEditor = vimState.editor;

    await vscode.commands.executeCommand('editor.action.goToDeclaration');

    if (oldActiveEditor === vimState.editor) {
      vimState.cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.start);
    }

    return vimState;
  }
}

@RegisterAction
class CommandGoBackInChangelist extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['g', ';'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const originalIndex = vimState.historyTracker.changelistIndex;
    const prevPos = vimState.historyTracker.getChangePositionAtindex(originalIndex - 1);
    const currPos = vimState.historyTracker.getChangePositionAtindex(originalIndex);

    if (prevPos !== undefined) {
      vimState.cursorPosition = prevPos[0];
      vimState.historyTracker.changelistIndex = originalIndex - 1;
    } else if (currPos !== undefined) {
      vimState.cursorPosition = currPos[0];
    }

    return vimState;
  }
}

@RegisterAction
class CommandGoForwardInChangelist extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['g', ','];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const originalIndex = vimState.historyTracker.changelistIndex;
    const nextPos = vimState.historyTracker.getChangePositionAtindex(originalIndex + 1);
    const currPos = vimState.historyTracker.getChangePositionAtindex(originalIndex);

    if (nextPos !== undefined) {
      vimState.cursorPosition = nextPos[0];
      vimState.historyTracker.changelistIndex = originalIndex + 1;
    } else if (currPos !== undefined) {
      vimState.cursorPosition = currPos[0];
    }

    return vimState;
  }
}

@RegisterAction
class CommandGoLastChange extends BaseCommand {
  modes = [ModeName.Normal];
  keys = [['`', '.'], ["'", '.']];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const lastPos = vimState.historyTracker.getLastHistoryStartPosition();

    if (lastPos !== undefined) {
      vimState.cursorPosition = lastPos[0];
    }

    return vimState;
  }
}

@RegisterAction
class CommandInsertAtLastChange extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['g', 'i'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const lastPos = vimState.historyTracker.getLastChangeEndPosition();

    if (lastPos !== undefined) {
      vimState.cursorPosition = lastPos;
      vimState.currentMode = ModeName.Insert;
    }

    return vimState;
  }
}

@RegisterAction
export class CommandInsertAtFirstCharacter extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ['I'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getFirstLineNonBlankChar();

    return vimState;
  }
}

@RegisterAction
class CommandInsertAtLineBegin extends BaseCommand {
  modes = [ModeName.Normal];
  mustBeFirstKey = true;
  keys = ['g', 'I'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getLineBegin();

    return vimState;
  }
}

@RegisterAction
export class CommandInsertAfterCursor extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['a'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getRight();

    return vimState;
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
export class CommandInsertAtLineEnd extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ['A'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getLineEnd();

    return vimState;
  }
}

@RegisterAction
class CommandInsertNewLineAbove extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['O'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    let count = vimState.recordedState.count || 1;
    // Why do we do this? Who fucking knows??? If the cursor is at the
    // beginning of the line, then editor.action.insertLineBefore does some
    // weird things with following paste command. Refer to
    // https://github.com/VSCodeVim/Vim/pull/1663#issuecomment-300573129 for
    // more details.
    const tPos = Position.FromVSCodePosition(
      vscode.window.activeTextEditor!.selection.active
    ).getRight();
    vscode.window.activeTextEditor!.selection = new vscode.Selection(tPos, tPos);
    for (let i = 0; i < count; i++) {
      await vscode.commands.executeCommand('editor.action.insertLineBefore');
    }

    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();
    for (let i = 0; i < count; i++) {
      const newPos = new Position(
        vimState.allCursors[0].start.line + i,
        vimState.allCursors[0].start.character
      );
      vimState.allCursors.push(new Range(newPos, newPos));
    }
    vimState.allCursors = vimState.allCursors.reverse();
    vimState.isFakeMultiCursor = true;
    vimState.isMultiCursor = true;
    return vimState;
  }
}

@RegisterAction
class CommandInsertNewLineBefore extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['o'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    let count = vimState.recordedState.count || 1;

    for (let i = 0; i < count; i++) {
      await vscode.commands.executeCommand('editor.action.insertLineAfter');
    }
    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();
    for (let i = 1; i < count; i++) {
      const newPos = new Position(
        vimState.allCursors[0].start.line - i,
        vimState.allCursors[0].start.character
      );
      vimState.allCursors.push(new Range(newPos, newPos));

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
    vimState.allCursors = vimState.allCursors.reverse();
    vimState.isFakeMultiCursor = true;
    vimState.isMultiCursor = true;
    return vimState;
  }
}

@RegisterAction
class CommandNavigateBack extends BaseCommand {
  modes = [ModeName.Normal];
  keys = [['<C-o>'], ['<C-t>']];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const oldActiveEditor = vimState.editor;

    await vscode.commands.executeCommand('workbench.action.navigateBack');

    if (oldActiveEditor === vimState.editor) {
      vimState.cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.start);
    }

    return vimState;
  }
}

@RegisterAction
class CommandNavigateForward extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['<C-i>'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const oldActiveEditor = vimState.editor;

    await vscode.commands.executeCommand('workbench.action.navigateForward');

    if (oldActiveEditor === vimState.editor) {
      vimState.cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.start);
    }

    return vimState;
  }
}

@RegisterAction
class CommandNavigateLast extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['`', '`'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const oldActiveEditor = vimState.editor;

    await vscode.commands.executeCommand('workbench.action.navigateLast');

    if (oldActiveEditor === vimState.editor) {
      vimState.cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.start);
    }

    return vimState;
  }
}

@RegisterAction
class CommandNavigateLastBOL extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["'", "'"];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const oldActiveEditor = vimState.editor;

    await vscode.commands.executeCommand('workbench.action.navigateLast');

    if (oldActiveEditor === vimState.editor) {
      const pos = Position.FromVSCodePosition(vimState.editor.selection.start);
      vimState.cursorPosition = pos.getFirstLineNonBlankChar();
    }

    return vimState;
  }
}

@RegisterAction
class CommandQuit extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['<C-w>', 'q'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    new QuitCommand({}).execute();

    return vimState;
  }
}

@RegisterAction
class CommandOnly extends BaseCommand {
  modes = [ModeName.Normal];
  keys = [['<C-w>', 'o'], ['<C-w>', 'C-o']];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    new OnlyCommand({}).execute();

    return vimState;
  }
}

@RegisterAction
class MoveToRightPane extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = [['<C-w>', 'l'], ['<C-w>', '<right>'], ['<C-w l>']];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateRight',
      args: {},
    });

    return vimState;
  }
}

@RegisterAction
class MoveToLowerPane extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = [['<C-w>', 'j'], ['<C-w>', '<down>'], ['<C-w j>']];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateDown',
      args: {},
    });

    return vimState;
  }
}

@RegisterAction
class MoveToUpperPane extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = [['<C-w>', 'k'], ['<C-w>', '<up>'], ['<C-w k>']];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateUp',
      args: {},
    });

    return vimState;
  }
}

@RegisterAction
class MoveToLeftPane extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = [['<C-w>', 'h'], ['<C-w>', '<left>'], ['<C-w h>']];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateLeft',
      args: {},
    });

    return vimState;
  }
}

@RegisterAction
class CycleThroughPanes extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = [['<C-w>', '<C-w>'], ['<C-w>', 'w']];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.navigateEditorGroups',
      args: {},
    });

    return vimState;
  }
}

class BaseTabCommand extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  runsOnceForEachCountPrefix = true;
}

@RegisterAction
class VerticalSplit extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ['<C-w>', 'v'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: 'workbench.action.splitEditor',
      args: {},
    });

    return vimState;
  }
}

@RegisterAction
class CommandTabNext extends BaseTabCommand {
  keys = [['g', 't'], ['<C-pagedown>']];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    new TabCommand({
      tab: Tab.Next,
      count: vimState.recordedState.count,
    }).execute();

    return vimState;
  }
}

@RegisterAction
class CommandTabPrevious extends BaseTabCommand {
  keys = [['g', 'T'], ['<C-pageup>']];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    new TabCommand({
      tab: Tab.Previous,
      count: 1,
    }).execute();

    return vimState;
  }
}

@RegisterAction
class ActionDeleteChar extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['x'];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // If line is empty, do nothing
    if (TextEditor.getLineAt(position).text.length < 1) {
      return vimState;
    }

    const state = await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      position,
      position
    );

    state.currentMode = ModeName.Normal;

    return state;
  }
}

@RegisterAction
class ActionDeleteCharWithDeleteKey extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['<Del>'];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    // If <del> has a count in front of it, then <del> deletes a character
    // off the count. Therefore, 100<del>x, would apply 'x' 10 times.
    // http://vimdoc.sourceforge.net/htmldoc/change.html#<Del>
    if (vimState.recordedState.count !== 0) {
      vimState.recordedState.count = Math.floor(vimState.recordedState.count / 10);
      vimState.recordedState.actionKeys = vimState.recordedState.count.toString().split('');
      vimState.recordedState.commandList = vimState.recordedState.count.toString().split('');
      this.isCompleteAction = false;
      return vimState;
    }
    return await new ActionDeleteChar().execCount(position, vimState);
  }
}

@RegisterAction
class ActionDeleteLastChar extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['X'];
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (position.character === 0) {
      return vimState;
    }

    return await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      position.getLeft(),
      position.getLeft()
    );
  }
}

@RegisterAction
class ActionJoin extends BaseCommand {
  modes = [ModeName.Normal];
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
  ): Promise<VimState> {
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
        endLineNumber = startLineNumber + count;
        endColumn = TextEditor.getLineMaxColumn(endLineNumber);
      } else {
        startLineNumber = position.line;
        startColumn = 0;
        endLineNumber = position.line;
        endColumn = TextEditor.getLineMaxColumn(endLineNumber);
      }
    } else {
      startLineNumber = startPosition.line;
      startColumn = 0;
      endLineNumber = position.line;
      endColumn = TextEditor.getLineMaxColumn(endLineNumber);
    }

    let trimmedLinesContent = TextEditor.getLineAt(startPosition).text;

    for (let i = startLineNumber + 1; i <= endLineNumber; i++) {
      let lineText = TextEditor.getLineAt(new Position(i, 0)).text;

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
      } else {
        if (
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
    }

    let deleteStartPosition = new Position(startLineNumber, startColumn);
    let deleteEndPosition = new Position(endLineNumber, endColumn);

    if (!deleteStartPosition.isEqual(deleteEndPosition)) {
      if (startPosition.isEqual(position)) {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: trimmedLinesContent,
          start: deleteStartPosition,
          end: deleteEndPosition,
          diff: new PositionDiff(
            0,
            trimmedLinesContent.length - columnDeltaOffset - position.character
          ),
        });
      } else {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: trimmedLinesContent,
          start: deleteStartPosition,
          end: deleteEndPosition,
          manuallySetCursorPositions: true,
        });

        vimState.cursorPosition = new Position(
          startPosition.line,
          trimmedLinesContent.length - columnDeltaOffset
        );
        vimState.cursorStartPosition = vimState.cursorPosition;
        vimState.currentMode = ModeName.Normal;
      }
    }

    return vimState;
  }

  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;
    let resultingCursors: Range[] = [];
    let i = 0;

    const cursorsToIterateOver = vimState.allCursors
      .map(x => new Range(x.start, x.stop))
      .sort(
        (a, b) =>
          a.start.line > b.start.line ||
          (a.start.line === b.start.line && a.start.character > b.start.character)
            ? 1
            : -1
      );

    for (const { start, stop } of cursorsToIterateOver) {
      this.multicursorIndex = i++;

      vimState.cursorPosition = stop;
      vimState.cursorStartPosition = start;

      vimState = await this.execJoinLines(start, stop, vimState, timesToRepeat);

      resultingCursors.push(new Range(vimState.cursorStartPosition, vimState.cursorPosition));

      for (const transformation of vimState.recordedState.transformations) {
        if (isTextTransformation(transformation) && transformation.cursorIndex === undefined) {
          transformation.cursorIndex = this.multicursorIndex;
        }
      }
    }

    vimState.allCursors = resultingCursors;

    return vimState;
  }
}

@RegisterAction
class ActionJoinVisualMode extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ['J'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let actionJoin = new ActionJoin();
    let start = Position.FromVSCodePosition(vimState.editor.selection.start);
    let end = Position.FromVSCodePosition(vimState.editor.selection.end);

    if (start.isAfter(end)) {
      [start, end] = [end, start];
    }

    /**
     * For joining lines, Visual Line behaves the same as Visual so we align the register mode here.
     */
    vimState.currentRegisterMode = RegisterMode.CharacterWise;
    vimState = await actionJoin.execJoinLines(start, end, vimState, 1);

    return vimState;
  }
}

@RegisterAction
class ActionJoinNoWhitespace extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['g', 'J'];
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = true;

  // gJ is essentially J without the edge cases. ;-)

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (position.line === TextEditor.getLineCount() - 1) {
      return vimState; // TODO: bell
    }

    let lineOne = TextEditor.getLineAt(position).text;
    let lineTwo = TextEditor.getLineAt(position.getNextLineBegin()).text;

    lineTwo = lineTwo.substring(position.getNextLineBegin().getFirstLineNonBlankChar().character);

    let resultLine = lineOne + lineTwo;

    let newState = await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      position.getLineBegin(),
      lineTwo.length > 0
        ? position
            .getNextLineBegin()
            .getLineEnd()
            .getLeft()
        : position.getLineEnd()
    );

    vimState.recordedState.transformations.push({
      type: 'insertText',
      text: resultLine,
      position: position,
      diff: new PositionDiff(0, -lineTwo.length),
    });

    newState.cursorPosition = new Position(position.line, lineOne.length);

    return newState;
  }
}

@RegisterAction
class ActionJoinNoWhitespaceVisualMode extends BaseCommand {
  modes = [ModeName.Visual];
  keys = ['g', 'J'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let actionJoin = new ActionJoinNoWhitespace();
    let start = Position.FromVSCodePosition(vimState.editor.selection.start);
    let end = Position.FromVSCodePosition(vimState.editor.selection.end);

    if (start.line === end.line) {
      return vimState;
    }

    if (start.isAfter(end)) {
      [start, end] = [end, start];
    }

    for (let i = start.line; i < end.line; i++) {
      vimState = await actionJoin.exec(start, vimState);
    }

    return vimState;
  }
}

@RegisterAction
class ActionReplaceCharacter extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['r', '<character>'];
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;
    const toReplace = this.keysPressed[1];

    /**
     * <character> includes <BS>, <SHIFT+BS> and <TAB> but not any control keys,
     * so we ignore the former two keys and have a special handle for <tab>.
     */

    if (['<BS>', '<SHIFT+BS>'].indexOf(toReplace.toUpperCase()) >= 0) {
      return vimState;
    }

    if (position.character + timesToRepeat > position.getLineEnd().character) {
      return vimState;
    }

    let endPos = new Position(position.line, position.character + timesToRepeat);

    // Return if tried to repeat longer than linelength
    if (endPos.character > TextEditor.getLineAt(endPos).text.length) {
      return vimState;
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
        diff: new PositionDiff(0, -1),
      });
    } else {
      vimState.recordedState.transformations.push({
        type: 'replaceText',
        text: toReplace.repeat(timesToRepeat),
        start: position,
        end: endPos,
        diff: new PositionDiff(0, timesToRepeat - 1),
      });
    }
    return vimState;
  }

  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    return super.execCount(position, vimState);
  }
}

@RegisterAction
class ActionReplaceCharacterVisual extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ['r', '<character>'];
  runsOnceForEveryCursor() {
    return false;
  }
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const toInsert = this.keysPressed[1];

    let visualSelectionOffset = 1;
    let start = vimState.cursorStartPosition;
    let end = vimState.cursorPosition;

    // If selection is reversed, reorganize it so that the text replace logic always works
    if (end.isBeforeOrEqual(start)) {
      [start, end] = [end, start];
    }

    // Limit to not replace EOL
    const textLength = TextEditor.getLineAt(end).text.length;
    if (textLength <= 0) {
      visualSelectionOffset = 0;
    }
    end = new Position(end.line, Math.min(end.character, textLength > 0 ? textLength - 1 : 0));

    // Iterate over every line in the current selection
    for (var lineNum = start.line; lineNum <= end.line; lineNum++) {
      // Get line of text
      const lineText = TextEditor.getLineAt(new Position(lineNum, 0)).text;

      if (start.line === end.line) {
        // This is a visual section all on one line, only replace the part within the selection
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: Array(end.character - start.character + 2).join(toInsert),
          start: start,
          end: new Position(end.line, end.character + 1),
          manuallySetCursorPositions: true,
        });
      } else if (lineNum === start.line) {
        // This is the first line of the selection so only replace after the cursor
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: Array(lineText.length - start.character + 1).join(toInsert),
          start: start,
          end: new Position(start.line, lineText.length),
          manuallySetCursorPositions: true,
        });
      } else if (lineNum === end.line) {
        // This is the last line of the selection so only replace before the cursor
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: Array(end.character + 1 + visualSelectionOffset).join(toInsert),
          start: new Position(end.line, 0),
          end: new Position(end.line, end.character + visualSelectionOffset),
          manuallySetCursorPositions: true,
        });
      } else {
        // Replace the entire line length since it is in the middle of the selection
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: Array(lineText.length + 1).join(toInsert),
          start: new Position(lineNum, 0),
          end: new Position(lineNum, lineText.length),
          manuallySetCursorPositions: true,
        });
      }
    }

    vimState.cursorPosition = start;
    vimState.cursorStartPosition = start;
    vimState.currentMode = ModeName.Normal;
    return vimState;
  }
}

@RegisterAction
class ActionReplaceCharacterVisualBlock extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ['r', '<character>'];
  runsOnceForEveryCursor() {
    return false;
  }
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const toInsert = this.keysPressed[1];
    for (const { start, end } of Position.IterateLine(vimState)) {
      if (end.isBeforeOrEqual(start)) {
        continue;
      }

      vimState.recordedState.transformations.push({
        type: 'replaceText',
        text: Array(end.character - start.character + 1).join(toInsert),
        start: start,
        end: end,
        manuallySetCursorPositions: true,
      });
    }

    const topLeft = VisualBlockMode.getTopLeftPosition(
      vimState.cursorPosition,
      vimState.cursorStartPosition
    );
    vimState.allCursors = [new Range(topLeft, topLeft)];
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class ActionXVisualBlock extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ['x'];
  canBeRepeatedWithDot = true;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    for (const { start, end } of Position.IterateLine(vimState)) {
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(start, end),
        manuallySetCursorPositions: true,
      });
    }

    const topLeft = VisualBlockMode.getTopLeftPosition(
      vimState.cursorPosition,
      vimState.cursorStartPosition
    );

    vimState.allCursors = [new Range(topLeft, topLeft)];
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class ActionDVisualBlock extends ActionXVisualBlock {
  modes = [ModeName.VisualBlock];
  keys = ['d'];
  canBeRepeatedWithDot = true;
  runsOnceForEveryCursor() {
    return false;
  }
}

@RegisterAction
class ActionShiftDVisualBlock extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ['D'];
  canBeRepeatedWithDot = true;
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    for (const { start } of Position.IterateLine(vimState)) {
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(start, start.getLineEnd()),
        manuallySetCursorPositions: true,
      });
    }

    const topLeft = VisualBlockMode.getTopLeftPosition(
      vimState.cursorPosition,
      vimState.cursorStartPosition
    );

    vimState.allCursors = [new Range(topLeft, topLeft)];
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class ActionGoToInsertVisualBlockMode extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ['I'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.isMultiCursor = true;
    vimState.isFakeMultiCursor = true;

    for (const { line, start } of Position.IterateLine(vimState)) {
      if (line === '' && start.character !== 0) {
        continue;
      }
      vimState.allCursors.push(new Range(start, start));
    }
    vimState.allCursors = vimState.allCursors.slice(1);
    return vimState;
  }
}

@RegisterAction
class ActionChangeInVisualBlockMode extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = [['c'], ['s']];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    for (const { start, end } of Position.IterateLine(vimState)) {
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(start, end),
        manuallySetCursorPositions: true,
      });
    }

    vimState.currentMode = ModeName.Insert;
    vimState.isMultiCursor = true;
    vimState.isFakeMultiCursor = true;

    for (const { start } of Position.IterateLine(vimState)) {
      vimState.allCursors.push(new Range(start, start));
    }
    vimState.allCursors = vimState.allCursors.slice(1);

    return vimState;
  }
}

@RegisterAction
class ActionChangeToEOLInVisualBlockMode extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = [['C'], ['S']];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    for (const { start } of Position.IterateLine(vimState)) {
      vimState.recordedState.transformations.push({
        type: 'deleteRange',
        range: new Range(start, start.getLineEnd()),
        collapseRange: true,
      });
    }

    vimState.currentMode = ModeName.Insert;
    vimState.isMultiCursor = true;
    vimState.isFakeMultiCursor = true;

    for (const { end } of Position.IterateLine(vimState)) {
      vimState.allCursors.push(new Range(end, end));
    }
    vimState.allCursors = vimState.allCursors.slice(1);

    return vimState;
  }
}

@RegisterAction
class ActionGoToInsertVisualBlockModeAppend extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ['A'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.isMultiCursor = true;
    vimState.isFakeMultiCursor = true;

    for (const { line, end } of Position.IterateLine(vimState)) {
      if (line.trim() === '') {
        vimState.recordedState.transformations.push({
          type: 'replaceText',
          text: TextEditor.setIndentationLevel(line, end.character),
          start: new Position(end.line, 0),
          end: new Position(end.line, end.character),
          position: new Position(end.line, 0),
        });
      }
      vimState.allCursors.push(new Range(end, end));
    }
    vimState.allCursors = vimState.allCursors.slice(1);
    return vimState;
  }
}

@RegisterAction
class ActionDeleteLineVisualMode extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ['X'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.currentMode === ModeName.Visual) {
      return await new operator.DeleteOperator(this.multicursorIndex).run(
        vimState,
        vimState.cursorStartPosition.getLineBegin(),
        vimState.cursorPosition.getLineEnd()
      );
    } else {
      return await new operator.DeleteOperator(this.multicursorIndex).run(
        vimState,
        position.getLineBegin(),
        position.getLineEnd()
      );
    }
  }
}

@RegisterAction
class ActionChangeLineVisualMode extends BaseCommand {
  modes = [ModeName.Visual];
  keys = ['C'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      vimState.cursorStartPosition.getLineBegin(),
      vimState.cursorPosition.getLineEndIncludingEOL()
    );
  }
}

@RegisterAction
class ActionRemoveLineVisualMode extends BaseCommand {
  modes = [ModeName.Visual];
  keys = ['R'];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return await new operator.DeleteOperator(this.multicursorIndex).run(
      vimState,
      vimState.cursorStartPosition.getLineBegin(),
      vimState.cursorPosition.getLineEndIncludingEOL()
    );
  }
}

@RegisterAction
class ActionChangeChar extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['s'];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const state = await new operator.ChangeOperator().run(vimState, position, position);

    state.currentMode = ModeName.Insert;

    return state;
  }

  // Don't clash with surround mode!
  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && !vimState.recordedState.operator;
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) && !vimState.recordedState.operator;
  }
}

@RegisterAction
class ToggleCaseAndMoveForward extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['~'];
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await new operator.ToggleCaseOperator().run(
      vimState,
      vimState.cursorPosition,
      vimState.cursorPosition
    );

    vimState.cursorPosition = vimState.cursorPosition.getRight();
    return vimState;
  }
}

abstract class IncrementDecrementNumberAction extends BaseCommand {
  modes = [ModeName.Normal];
  canBeRepeatedWithDot = true;
  offset: number;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const text = TextEditor.getLineAt(position).text;

    // Start looking to the right for the next word to increment, unless we're
    // already on a word to increment, in which case start at the beginning of
    // that word.
    const whereToStart = text[position.character].match(/\s/)
      ? position
      : position.getWordLeft(true);

    for (let { start, end, word } of Position.IterateWords(whereToStart)) {
      // '-' doesn't count as a word, but is important to include in parsing
      // the number
      if (text[start.character - 1] === '-') {
        start = start.getLeft();
        word = text[start.character] + word;
      }
      // Strict number parsing so "1a" doesn't silently get converted to "1"
      do {
        const num = NumericString.parse(word);
        if (
          num !== null &&
          position.character < start.character + num.prefix.length + num.value.toString().length
        ) {
          vimState.cursorPosition = await this.replaceNum(
            num,
            this.offset * (vimState.recordedState.count || 1),
            start,
            end
          );
          vimState.cursorPosition = vimState.cursorPosition.getLeftByCount(num.suffix.length);
          return vimState;
        } else if (num !== null) {
          word = word.slice(num.prefix.length + num.value.toString().length);
          start = new Position(
            start.line,
            start.character + num.prefix.length + num.value.toString().length
          );
        } else {
          break;
        }
      } while (true);
    }
    // No usable numbers, return the original position
    return vimState;
  }

  public async replaceNum(
    start: NumericString,
    offset: number,
    startPos: Position,
    endPos: Position
  ): Promise<Position> {
    const oldWidth = start.toString().length;
    start.value += offset;
    const newNum = start.toString();

    const range = new vscode.Range(startPos, endPos.getRight());

    if (oldWidth === newNum.length) {
      await TextEditor.replace(range, newNum);
    } else {
      // Can't use replace, since new number is a different width than old
      await TextEditor.delete(range);
      await TextEditor.insertAt(newNum, startPos);
      // Adjust end position according to difference in width of number-string
      endPos = new Position(endPos.line, endPos.character + (newNum.length - oldWidth));
    }

    return endPos;
  }
}

@RegisterAction
class IncrementNumberAction extends IncrementDecrementNumberAction {
  keys = ['<C-a>'];
  offset = +1;
}

@RegisterAction
class DecrementNumberAction extends IncrementDecrementNumberAction {
  keys = ['<C-x>'];
  offset = -1;
}

@RegisterAction
class ActionTriggerHover extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ['g', 'h'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand('editor.action.showHover');

    return vimState;
  }
}

/**
 * Multi-Cursor Command Overrides
 *
 * We currently have to override the vscode key commands that get us into multi-cursor mode.
 *
 * Normally, we'd just listen for another cursor to be added in order to go into multi-cursor
 * mode rather than rewriting each keybinding one-by-one. We can't currently do that because
 * Visual Block Mode also creates additional cursors, but will get confused if you're in
 * multi-cursor mode.
 */

@RegisterAction
class ActionOverrideCmdD extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = [['<D-d>'], ['g', 'b']];
  runsOnceForEveryCursor() {
    return false;
  }
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();

    // If this is the first cursor, select 1 character less
    // so that only the word is selected, no extra character
    vimState.allCursors = vimState.allCursors.map(x => x.withNewStop(x.stop.getLeft()));

    vimState.currentMode = ModeName.Visual;

    return vimState;
  }
}

@RegisterAction
class ActionOverrideCmdDInsert extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ['<D-d>'];
  runsOnceForEveryCursor() {
    return false;
  }
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // Since editor.action.addSelectionToNextFindMatch uses the selection to
    // determine where to add a word, we need to do a hack and manually set the
    // selections to the word boundaries before we make the api call.
    vscode.window.activeTextEditor!.selections = vscode.window
      .activeTextEditor!.selections.map((x, idx) => {
      const curPos = Position.FromVSCodePosition(x.active);
      if (idx === 0) {
        return new vscode.Selection(
          curPos.getWordLeft(false),
          curPos
            .getLeft()
            .getCurrentWordEnd(true)
            .getRight()
        );
      } else {
        // Since we're adding the selections ourselves, we need to make sure
        // that our selection is actually over what our original word is
        const matchWordPos = Position.FromVSCodePosition(
          vscode.window.activeTextEditor!.selections[0].active
        );
        const matchWordLength =
          matchWordPos
            .getLeft()
            .getCurrentWordEnd(true)
            .getRight().character - matchWordPos.getWordLeft(false).character;
        const wordBegin = curPos.getLeftByCount(matchWordLength);
        return new vscode.Selection(wordBegin, curPos);
      }
    });
    await vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();
    return vimState;
  }
}

@RegisterAction
class ActionOverrideCmdAltDown extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = [
    ['<D-alt+down>'], // OSX
    ['<C-alt+down>'], // Windows
  ];
  runsOnceForEveryCursor() {
    return false;
  }
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand('editor.action.insertCursorBelow');
    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();

    return vimState;
  }
}

@RegisterAction
class ActionOverrideCmdAltUp extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = [
    ['<D-alt+up>'], // OSX
    ['<C-alt+up>'], // Windows
  ];
  runsOnceForEveryCursor() {
    return false;
  }
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand('editor.action.insertCursorAbove');
    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();

    return vimState;
  }
}
