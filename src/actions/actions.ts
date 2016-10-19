import { VimState, RecordedState } from './../mode/modeHandler';
import { SearchState, SearchDirection } from './../state/searchState';
import { ReplaceState } from './../state/replaceState';
import { VisualBlockMode } from './../mode/modeVisualBlock';
import { ModeName } from './../mode/mode';
import { VisualBlockInsertionType } from './../mode/modeVisualBlock';
import { Range } from './../motion/range';
import { TextEditor, EditorScrollByUnit, EditorScrollDirection, CursorMovePosition, CursorMoveByUnit } from './../textEditor';
import { Register, RegisterMode } from './../register/register';
import { NumericString } from './../number/numericString';
import { Position, PositionDiff } from './../motion/position';
import { PairMatcher } from './../matching/matcher';
import { QuoteMatcher } from './../matching/quoteMatcher';
import { TagMatcher } from './../matching/tagMatcher';
import { Tab, TabCommand } from './../cmd_line/commands/tab';
import { Configuration } from './../configuration/configuration';
import { allowVSCodeToPropagateCursorUpdatesAndReturnThem } from '../util';
import { isTextTransformation } from './../transformations/transformations';
import * as vscode from 'vscode';
import * as clipboard from 'copy-paste';

const is2DArray = function<T>(x: any): x is T[][] {
  return Array.isArray(x[0]);
};

let compareKeypressSequence = function (one: string[] | string[][], two: string[]): boolean {
  if (is2DArray(one)) {
    for (const sequence of one) {
      if (compareKeypressSequence(sequence, two)) {
        return true;
      }
    }

    return false;
  }

  if (one.length !== two.length) {
    return false;
  }

  const isSingleNumber = (s: string): boolean => {
    return s.length === 1 && "1234567890".indexOf(s) > -1;
  };

  const containsControlKey = (s: string): boolean => {
    return s.toUpperCase() !== "<BS>" &&
           s.toUpperCase() !== "<TAB>" &&
           s.startsWith("<") &&
           s.length > 1;
  };

  for (let i = 0, j = 0; i < one.length; i++, j++) {
    const left = one[i], right = two[j];

    if (left  === "<any>") { continue; }
    if (right === "<any>") { continue; }

    if (left  === "<number>" && isSingleNumber(right)) { continue; }
    if (right === "<number>" && isSingleNumber(left) ) { continue; }

    if (left  === "<character>" && !containsControlKey(right)) { continue; }
    if (right === "<character>" && !containsControlKey(left)) { continue; }

    if (left !== right) { return false; }
  }

  return true;
};

/**
 * The result of a (more sophisticated) Movement.
 */
export interface IMovement {
  start        : Position;
  stop         : Position;

  /**
   * Whether this motion succeeded. Some commands, like fx when 'x' can't be found,
   * will not move the cursor. Furthermore, dfx won't delete *anything*, even though
   * deleting to the current character would generally delete 1 character.
   */
  failed?      : boolean;

  diff?        : PositionDiff;

  // It /so/ annoys me that I have to put this here.
  registerMode?: RegisterMode;
}

export function isIMovement(o: IMovement | Position): o is IMovement {
    return (o as IMovement).start !== undefined &&
           (o as IMovement).stop  !== undefined;
}

export class BaseAction {
  /**
   * Can this action be paired with an operator (is it like w in dw)? All
   * BaseMovements can be, and some more sophisticated commands also can be.
   */
  public isMotion = false;

  public canBeRepeatedWithDot = false;

  /**
   * Modes that this action can be run in.
   */
  public modes: ModeName[];

  /**
   * The sequence of keys you use to trigger the action, or a list of such sequences.
   */
  public keys: string[] | string[][];

  public mustBeFirstKey = false;

  /**
   * The keys pressed at the time that this action was triggered.
   */
  public keysPressed: string[] = [];

  /**
   * Is this action valid in the current Vim state?
   */
  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) { return false; }
    if (!compareKeypressSequence(this.keys, keysPressed)) { return false; }
    if (vimState.recordedState.actionsRun.length > 0 &&
        this.mustBeFirstKey) { return false; }
    if (this instanceof BaseOperator && vimState.recordedState.operator) { return false; }

    return true;
  }

  /**
   * Could the user be in the process of doing this action.
   */
  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) { return false; }
    if (!compareKeypressSequence(this.keys.slice(0, keysPressed.length), keysPressed)) { return false; }
    if (vimState.recordedState.actionsRun.length > 0 &&
        this.mustBeFirstKey) { return false; }
    if (this instanceof BaseOperator && vimState.recordedState.operator) { return false; }

    return true;
  }

  public toString(): string {
    return this.keys.join("");
  }
}

export class DocumentContentChangeAction extends BaseAction {
  contentChanges: vscode.TextDocumentContentChangeEvent[] = [];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (this.contentChanges.length === 0) {
      return vimState;
    }

    let originalLeftBoundary: vscode.Position;

    if (this.contentChanges[0].text === "" && this.contentChanges[0].rangeLength === 1) {
      originalLeftBoundary = this.contentChanges[0].range.end;
    } else {
      originalLeftBoundary = this.contentChanges[0].range.start;
    }

    let rightBoundary: vscode.Position = position;

    for (let i = 0; i < this.contentChanges.length; i++) {
      let contentChange = this.contentChanges[i];
      let newStart: vscode.Position;
      let newEnd: vscode.Position;

      if (contentChange.range.start.line < originalLeftBoundary.line) {
        // This change should be ignored
        let linesEffected = contentChange.range.end.line - contentChange.range.start.line + 1;
        let resultLines = contentChange.text.split("\n").length;
        originalLeftBoundary = originalLeftBoundary.with(originalLeftBoundary.line + resultLines - linesEffected);
        continue;
      }

      if (contentChange.range.start.line === originalLeftBoundary.line) {
        newStart = position.with(position.line, position.character + contentChange.range.start.character - originalLeftBoundary.character);

        if (contentChange.range.end.line === originalLeftBoundary.line) {
          newEnd = position.with(position.line, position.character + contentChange.range.end.character - originalLeftBoundary.character);
        } else {
          newEnd = position.with(position.line + contentChange.range.end.line - originalLeftBoundary.line,
           contentChange.range.end.character);
        }
      } else {
        newStart = position.with(position.line + contentChange.range.start.line - originalLeftBoundary.line,
          contentChange.range.start.character);
        newEnd = position.with(position.line + contentChange.range.end.line - originalLeftBoundary.line,
          contentChange.range.end.character);
      }

      if (newStart.isAfter(rightBoundary)) {
        // This change should be ignored as it's out of boundary
        continue;
      }

      // Calculate new right boundary
      let newLineCount = contentChange.text.split('\n').length;
      let newRightBoundary: vscode.Position;

      if (newLineCount === 1) {
        newRightBoundary = newStart.with(newStart.line, newStart.character + contentChange.text.length);
      } else {
        newRightBoundary = new vscode.Position(newStart.line + newLineCount - 1, contentChange.text.split('\n').pop().length);
      }

      if (newRightBoundary.isAfter(rightBoundary)) {
        rightBoundary = newRightBoundary;
      }

      vscode.window.activeTextEditor.selection = new vscode.Selection(newStart, newEnd);

      if (newStart.isEqual(newEnd)) {
        await TextEditor.insert(contentChange.text, Position.FromVSCodePosition(newStart));
      } else {
        await TextEditor.replace(vscode.window.activeTextEditor.selection, contentChange.text);
      }
    }

    vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.active);
    vimState.currentMode = ModeName.Insert;
    return vimState;
  }
}
/**
 * A movement is something like 'h', 'k', 'w', 'b', 'gg', etc.
 */
export abstract class BaseMovement extends BaseAction {
  modes = [
    ModeName.Normal,
    ModeName.Visual,
    ModeName.VisualLine,
    ModeName.VisualBlock,
  ];

  isMotion = true;

  canBePrefixedWithCount = false;

  /**
   * Whether we should change lastRepeatableMovement in VimState.
   */
  public canBeRepeatedWithSemicolon(vimState: VimState, result: Position | IMovement) {
    return false;
  }

  /**
   * Whether we should change desiredColumn in VimState.
   */
  public doesntChangeDesiredColumn = false;

  /**
   * This is for commands like $ which force the desired column to be at
   * the end of even the longest line.
   */
  public setsDesiredColumnToEOL = false;

  /**
   * Run the movement a single time.
   *
   * Generally returns a new Position. If necessary, it can return an IMovement instead.
   */
  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    throw new Error("Not implemented!");
   }

  /**
   * Run the movement in an operator context a single time.
   *
   * Some movements operate over different ranges when used for operators.
   */
  public async execActionForOperator(position: Position,  vimState: VimState): Promise<Position | IMovement> {
    return await this.execAction(position, vimState);
  }

  /**
   * Run a movement count times.
   *
   * count: the number prefix the user entered, or 0 if they didn't enter one.
   */
  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
      let recordedState = vimState.recordedState;
      let result: Position | IMovement = new Position(0, 0);  // bogus init to satisfy typechecker

      if (count < 1) {
          count = 1;
      } else if (count > 99999) {
          count = 99999;
      }

      for (let i = 0; i < count; i++) {
          const firstIteration = (i === 0);
          const lastIteration = (i === count - 1);
          const temporaryResult = (recordedState.operator && lastIteration) ?
              await this.execActionForOperator(position, vimState) :
              await this.execAction           (position, vimState);

          if (temporaryResult instanceof Position) {
            result = temporaryResult;
            position = temporaryResult;
          } else if (isIMovement(temporaryResult)) {
            if (result instanceof Position) {
              result = {
                start  : new Position(0, 0),
                stop   : new Position(0, 0),
                failed : false
              };
            }

            result.failed = result.failed || temporaryResult.failed;

            if (firstIteration) {
              (result as IMovement).start = temporaryResult.start;
            }

            if (lastIteration) {
              (result as IMovement).stop = temporaryResult.stop;
            } else {
              position = temporaryResult.stop.getRightThroughLineBreaks();
            }
          }
      }

      return result;
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
    throw new Error("Not implemented!");
  }

  /**
   * Run the command the number of times VimState wants us to.
   */
  public async execCount(position: Position, vimState: VimState): Promise<VimState> {
    if (!this.runsOnceForEveryCursor()) {
      let timesToRepeat = this.runsOnceForEachCountPrefix ? vimState.recordedState.count || 1 : 1;

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

    let timesToRepeat  = this.runsOnceForEachCountPrefix ? vimState.recordedState.count || 1 : 1;
    let resultingCursors: Range[] = [];
    let i              = 0;

    const cursorsToIterateOver = vimState.allCursors
      .map(x => new Range(x.start, x.stop))
      .sort((a, b) => a.start.line > b.start.line || (a.start.line === b.start.line && a.start.character > b.start.character) ? 1 : -1);

    for (const { start, stop } of cursorsToIterateOver) {
      this.multicursorIndex = i++;

      vimState.cursorPosition      = stop;
      vimState.cursorStartPosition = start;

      for (let j = 0; j < timesToRepeat; j++) {
        vimState = await this.exec(stop, vimState);
      }

      resultingCursors.push(new Range(
        vimState.cursorStartPosition,
        vimState.cursorPosition,
      ));

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

export class BaseOperator extends BaseAction {
    canBeRepeatedWithDot = true;

    /**
     * If this is being run in multi cursor mode, the index of the cursor
     * this operator is being applied to.
     */
    multicursorIndex: number | undefined = undefined;

    /**
     * Run this operator on a range, returning the new location of the cursor.
     */
    run(vimState: VimState, start: Position, stop: Position): Promise<VimState> {
      throw new Error("You need to override this!");
    }
}

export enum KeypressState {
  WaitingOnKeys,
  NoPossibleMatch
}

export class Actions {

  /**
   * Every Vim action will be added here with the @RegisterAction decorator.
   */
  public static allActions: { type: typeof BaseAction, action: BaseAction }[] = [];

  /**
   * Gets the action that should be triggered given a key
   * sequence.
   *
   * If there is a definitive action that matched, returns that action.
   *
   * If an action could potentially match if more keys were to be pressed, returns true. (e.g.
   * you pressed "g" and are about to press "g" action to make the full action "gg".)
   *
   * If no action could ever match, returns false.
   */
  public static getRelevantAction(keysPressed: string[], vimState: VimState): BaseAction | KeypressState {
    let couldPotentiallyHaveMatch = false;

    for (const thing of Actions.allActions) {
      const { type, action } = thing!;

      if (action.doesActionApply(vimState, keysPressed)) {
        const result = new type();

        result.keysPressed = vimState.recordedState.actionKeys.slice(0);

        return result;
      }

      if (action.couldActionApply(vimState, keysPressed)) {
        couldPotentiallyHaveMatch = true;
      }
    }

    return couldPotentiallyHaveMatch ? KeypressState.WaitingOnKeys : KeypressState.NoPossibleMatch;
  }
}

export function RegisterAction(action: typeof BaseAction): void {
  Actions.allActions.push({ type: action, action: new action() });
}





// begin actions










@RegisterAction
export class CommandInsertInInsertMode extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<character>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const char = this.keysPressed[this.keysPressed.length - 1];

    if (char === "<BS>") {
      vimState.recordedState.transformations.push({
        type           : "deleteText",
        position       : position,
      });

      vimState.cursorPosition      = vimState.cursorPosition.getLeft();
      vimState.cursorStartPosition = vimState.cursorStartPosition.getLeft();
    } else {
      if (vimState.isMultiCursor) {
        vimState.recordedState.transformations.push({
          type     : "insertText",
          text     : char,
          position : vimState.cursorPosition,
        });
      } else {
        vimState.recordedState.transformations.push({
          type : "insertTextVSCode",
          text : char,
        });
      }
    }

    return vimState;
  }

  public toString(): string {
    return this.keysPressed[this.keysPressed.length - 1];
  }
}

@RegisterAction
class CommandNumber extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["<number>"];
  isCompleteAction = false;
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const number = parseInt(this.keysPressed[0], 10);

    vimState.recordedState.count = vimState.recordedState.count * 10 + number;

    return vimState;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const isZero = keysPressed[0] === "0";

    return super.doesActionApply(vimState, keysPressed) &&
      ((isZero && vimState.recordedState.count > 0) || !isZero);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const isZero = keysPressed[0] === "0";

    return super.couldActionApply(vimState, keysPressed) &&
      ((isZero && vimState.recordedState.count > 0) || !isZero);
  }
}

@RegisterAction
class CommandRegister extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["\"", "<character>"];
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
class CommandInsertRegisterContent extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-r>", "<character>"];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.recordedState.registerName = this.keysPressed[1];
    const register = await Register.get(vimState);
    let text: string;

    if (register.text instanceof Array) {
       text = (register.text as string []).join("\n");
    } else if (register.text instanceof RecordedState) {
      vimState.recordedState.transformations.push({
        type: "macro",
        register: vimState.recordedState.registerName,
        replay: "keystrokes"
      });

      return vimState;
    } else {
       text = register.text;
    }

    if (register.registerMode === RegisterMode.LineWise) {
      text += "\n";
    }

    await TextEditor.insertAt(text, position);
    vimState.currentMode = ModeName.Insert;
    vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);

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
class CommandRecordMacro extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["q", "<character>"];

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

    return super.doesActionApply(vimState, keysPressed) && Register.isValidRegisterForMacro(register);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = this.keysPressed[1];

    return super.couldActionApply(vimState, keysPressed) && Register.isValidRegisterForMacro(register);
  }
}

@RegisterAction
export class CommandQuitRecordMacro extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["q"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let existingMacro = (await Register.getByKey(vimState.recordedMacro.registerName)).text as RecordedState;
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
  keys = ["@", "<character>"];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const register = this.keysPressed[1];
    vimState.recordedState.transformations.push({
      type: "macro",
      register: register,
      replay: "contentChange"
    });

    return vimState;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = keysPressed[1];

    return super.doesActionApply(vimState, keysPressed) && Register.isValidRegisterForMacro(register);
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = keysPressed[1];

    return super.couldActionApply(vimState, keysPressed) && Register.isValidRegisterForMacro(register);
  }
}

@RegisterAction
class CommandExecuteLastMacro extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["@", "@"];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let lastInvokedMacro = vimState.historyTracker.lastInvokedMacro;

    if (lastInvokedMacro) {
      vimState.recordedState.transformations.push({
        type: "macro",
        register: lastInvokedMacro.registerName,
        replay: "contentChange"
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
    ModeName.VisualBlockInsertMode,
    ModeName.VisualBlock,
    ModeName.Normal,
    ModeName.SearchInProgressMode,
  ];
  keys = [
    ["<Esc>"],
    ["<C-c>"],
    ["<C-[>"],
  ];

  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.currentMode === ModeName.Normal && !vimState.isMultiCursor) {
      return vimState;
    }

    if (vimState.currentMode !== ModeName.Visual &&
        vimState.currentMode !== ModeName.VisualLine) {

      // Normally, you don't have to iterate over all cursors,
      // as that is handled for you by the state machine. ESC is
      // a special case since runsOnceForEveryCursor is false.

      for (let i = 0; i < vimState.allCursors.length; i++) {
        vimState.allCursors[i] = vimState.allCursors[i].withNewStop(
          vimState.allCursors[i].stop.getLeft()
        );
      }
    }

    if (vimState.currentMode === ModeName.SearchInProgressMode) {
      if (vimState.searchState) {
        vimState.cursorPosition = vimState.searchState.searchCursorStartPosition;
      }
    }

    if (vimState.currentMode === ModeName.Normal && vimState.isMultiCursor) {
      vimState.isMultiCursor = false;
    }

    vimState.currentMode = ModeName.Normal;

    if (!vimState.isMultiCursor) {
      vimState.allCursors = [ vimState.allCursors[0] ];
    }

    return vimState;
  }
}

@RegisterAction
class CommandEscInsertMode extends BaseCommand {
  modes = [
    ModeName.Insert
  ];
  keys = [
    ["<Esc>"],
    ["<C-c>"],
    ["<C-[>"],
  ];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLeft();
    vimState.currentMode = ModeName.Normal;

    if (vimState.historyTracker.currentContentChanges.length > 0) {
      vimState.historyTracker.lastContentChanges = vimState.historyTracker.currentContentChanges;
      vimState.historyTracker.currentContentChanges = [];
    }

    return vimState;
  }
}

@RegisterAction
class CommandEscReplaceMode extends BaseCommand {
  modes = [ModeName.Replace];
  keys = [
    ["<Esc>"],
    ["<C-c>"],
  ];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const timesToRepeat = vimState.replaceState!.timesToRepeat;
    let textToAdd = "";

    for (let i = 1; i < timesToRepeat; i++) {
      textToAdd += vimState.replaceState!.newChars.join("");
    }

    vimState.recordedState.transformations.push({
      type    : "insertText",
      text    : textToAdd,
      position: position,
      diff    : new PositionDiff(0, -1),
    });

    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandCtrlOpenBracket extends CommandEsc {
  modes = [
    ModeName.Insert,
    ModeName.Visual,
    ModeName.VisualLine,
    ModeName.VisualBlockInsertMode,
    ModeName.VisualBlock,
    ModeName.Replace
  ];
  keys = [["<C-[>"]];
}

@RegisterAction
class CommandCtrlW extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-w>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const wordBegin = position.getWordLeft();
    await TextEditor.delete(new vscode.Range(wordBegin, position));

    vimState.cursorPosition = wordBegin;

    return vimState;
  }
}

abstract class CommandEditorScroll extends BaseCommand {
  modes = [ModeName.Normal];
  runsOnceForEachCountPrefix = false;
  keys: string[];
  to: EditorScrollDirection;
  by: EditorScrollByUnit;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;

    vimState.postponedCodeViewChanges.push({
      command: "editorScroll",
      args: {
        to: this.to,
        by: this.by,
        value: timesToRepeat,
        revealCursor: true
      }
    });

    return vimState;
  }
}

@RegisterAction
export class CommandInsertPreviousText extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-a>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let actions = ((await Register.getByKey('.')).text as RecordedState).actionsRun.slice(0);
    // let actions = Register.lastContentChange.actionsRun.slice(0);
    // The first action is entering Insert Mode, which is not necessary in this case
    actions.shift();
    // The last action is leaving Insert Mode, which is not necessary in this case
    // actions.pop();

    if (actions.length > 0 && actions[0] instanceof ArrowsInInsertMode) {
      // Note, arrow keys are the only Insert action command that can't be repeated here as far as @rebornix knows.
      actions.shift();
    }

    for (let action of actions) {
      if (action instanceof BaseCommand) {
        vimState = await action.execCount(vimState.cursorPosition, vimState);
      }

      if (action instanceof DocumentContentChangeAction) {
        vimState = await action.exec(vimState.cursorPosition, vimState);
      }
    }

    vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.end);
    vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    vimState.currentMode = ModeName.Insert;
    return vimState;
  }
}

@RegisterAction
class CommandInsertPreviousTextAndQuit extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-shift+2>"]; // <C-@>

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState = await new CommandInsertPreviousText().exec(position, vimState);
    vimState.currentMode = ModeName.Normal;
    return vimState;
  }
}

@RegisterAction
class CommandInsertBelowChar extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-e>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (TextEditor.isLastLine(position)) {
      return vimState;
    }

    const charBelowCursorPosition = position.getDownByCount(1);

    if (charBelowCursorPosition.isLineEnd()) {
      return vimState;
    }

    const char = TextEditor.getText(new vscode.Range(charBelowCursorPosition, charBelowCursorPosition.getRight()));
    await TextEditor.insert(char, position);

    vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);

    return vimState;
  }
}

@RegisterAction
class CommandInsertIndentInCurrentLine extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-t>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const originalText = TextEditor.getLineAt(position).text;
    const indentationWidth = TextEditor.getIndentationLevel(originalText);
    const tabSize = Configuration.getInstance().tabstop;
    const newIndentationWidth = (indentationWidth / tabSize + 1) * tabSize;
    await TextEditor.replace(new vscode.Range(position.getLineBegin(), position.getLineEnd()),
      TextEditor.setIndentationLevel(originalText, newIndentationWidth));

    const cursorPosition = Position.FromVSCodePosition(position.with(position.line,
      position.character + (newIndentationWidth - indentationWidth) / tabSize));
    vimState.cursorPosition = cursorPosition;
    vimState.cursorStartPosition = cursorPosition;
    vimState.currentMode = ModeName.Insert;
    return vimState;
  }
}

@RegisterAction
class CommandDeleteIndentInCurrentLine extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-d>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const originalText = TextEditor.getLineAt(position).text;
    const indentationWidth = TextEditor.getIndentationLevel(originalText);

    if (indentationWidth === 0) {
      return vimState;
    }

    const tabSize = Configuration.getInstance().tabstop;
    const newIndentationWidth = (indentationWidth / tabSize - 1) * tabSize;
    await TextEditor.replace(new vscode.Range(position.getLineBegin(), position.getLineEnd()),
      TextEditor.setIndentationLevel(originalText, newIndentationWidth < 0 ? 0 : newIndentationWidth));

    const cursorPosition = Position.FromVSCodePosition(position.with(position.line,
      position.character + (newIndentationWidth - indentationWidth) / tabSize ));
    vimState.cursorPosition = cursorPosition;
    vimState.cursorStartPosition = cursorPosition;
    vimState.currentMode = ModeName.Insert;
    return vimState;
  }
}

@RegisterAction
class CommandCtrlE extends CommandEditorScroll {
  keys = ["<C-e>"];
  to: EditorScrollDirection = "down";
  by: EditorScrollByUnit = "line";
}

@RegisterAction
class CommandCtrlY extends CommandEditorScroll {
  keys = ["<C-y>"];
  to: EditorScrollDirection = "up";
  by: EditorScrollByUnit = "line";
}

@RegisterAction
class CommandMoveFullPageUp extends CommandEditorScroll {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ["<C-b>"];
  to: EditorScrollDirection = "up";
  by: EditorScrollByUnit = "page";
}

@RegisterAction
class CommandMoveFullPageDown extends CommandEditorScroll {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ["<C-f>"];
  to: EditorScrollDirection = "down";
  by: EditorScrollByUnit = "page";
}

@RegisterAction
class CommandMoveHalfPageDown extends CommandEditorScroll {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ["<C-d>"];
  to: EditorScrollDirection = "down";
  by: EditorScrollByUnit = "halfPage";
}

@RegisterAction
class CommandMoveHalfPageUp extends CommandEditorScroll {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ["<C-u>"];
  to: EditorScrollDirection = "up";
  by: EditorScrollByUnit = "halfPage";
}

@RegisterAction
class CommandInsertAboveChar extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-y>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (TextEditor.isFirstLine(position)) {
      return vimState;
    }

    const charAboveCursorPosition = position.getUpByCount(1);

    if (charAboveCursorPosition.isLineEnd()) {
      return vimState;
    }

    const char = TextEditor.getText(new vscode.Range(charAboveCursorPosition, charAboveCursorPosition.getRight()));
    await TextEditor.insert(char, position);

    vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);

    return vimState;
  }
}

@RegisterAction
class CommandInsertAtCursor extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["i"];
  mustBeFirstKey = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    return vimState;
  }
}

@RegisterAction
class CommandReplaceAtCursor extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["R"];
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
  keys = ["<character>"];
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const char = this.keysPressed[0];
    const replaceState = vimState.replaceState!;

    if (char === "<BS>") {
      if (position.isBeforeOrEqual(replaceState.replaceCursorStartPosition)) {
        // If you backspace before the beginning of where you started to replace,
        // just move the cursor back.

        vimState.cursorPosition = position.getLeft();
        vimState.cursorStartPosition = position.getLeft();
      } else if (position.line > replaceState.replaceCursorStartPosition.line ||
        position.character > replaceState.originalChars.length) {

        vimState.recordedState.transformations.push({
          type: "deleteText",
          position: position,
        });
      } else {
        vimState.recordedState.transformations.push({
          type: "replaceText",
          text: replaceState.originalChars[position.character - 1],
          start: position.getLeft(),
          end: position,
          diff: new PositionDiff(0, -1),
        });
      }

      replaceState.newChars.pop();
    } else {
      if (!position.isLineEnd() && char !== "\n") {
        vimState.recordedState.transformations.push({
          type: "replaceText",
          text: char,
          start: position,
          end: position.getRight(),
          diff: new PositionDiff(0, 1),
        });
      } else {
        vimState.recordedState.transformations.push({
          type: "insertText",
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
class ArrowsInReplaceMode extends BaseMovement {
  modes = [ModeName.Replace];
  keys = [
    ["<up>"],
    ["<down>"],
    ["<left>"],
    ["<right>"],
  ];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    let newPosition: Position = position;

    switch (this.keysPressed[0]) {
      case "<up>":
        newPosition = await new MoveUpArrow().execAction(position, vimState);
        break;
      case "<down>":
        newPosition = await new MoveDownArrow().execAction(position, vimState);
        break;
      case "<left>":
        newPosition = await new MoveLeftArrow().execAction(position, vimState);
        break;
      case "<right>":
        newPosition = await new MoveRightArrow().execAction(position, vimState);
        break;
      default:
        break;
    }
    vimState.replaceState = new ReplaceState(newPosition);
    return newPosition;
  }
}

@RegisterAction
class UpArrowInReplaceMode extends ArrowsInReplaceMode {
  keys = [["<up>"]];
}

@RegisterAction
class DownArrowInReplaceMode extends ArrowsInReplaceMode {
  keys = [["<down>"]];
}

@RegisterAction
class LeftArrowInReplaceMode extends ArrowsInReplaceMode {
  keys = [["<left>"]];
}

@RegisterAction
class RightArrowInReplaceMode extends ArrowsInReplaceMode {
  keys = [["<right>"]];
}

export class ArrowsInInsertMode extends BaseMovement {
  modes = [ModeName.Insert];
  keys: string[];
  canBePrefixedWithCount = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    // we are in Insert Mode and arrow keys will clear all other actions except the first action, which enters Insert Mode.
    // Please note the arrow key movement can be repeated while using `.` but it can't be repeated when using `<C-A>` in Insert Mode.
    vimState.recordedState.actionsRun = [vimState.recordedState.actionsRun.shift(), vimState.recordedState.actionsRun.pop()];
    let newPosition: Position = position;

    switch (this.keys[0]) {
      case "<up>":
        newPosition = await new MoveUpArrow().execAction(position, vimState);
        break;
      case "<down>":
        newPosition = await new MoveDownArrow().execAction(position, vimState);
        break;
      case "<left>":
        newPosition = await new MoveLeftArrow().execAction(position, vimState);
        break;
      case "<right>":
        newPosition = await new MoveRightArrow().execAction(position, vimState);
        break;
      default:
        break;
    }
    vimState.replaceState = new ReplaceState(newPosition);
    return newPosition;
  }
}

@RegisterAction
class UpArrowInInsertMode extends ArrowsInInsertMode {
  keys = ["<up>"];
}

@RegisterAction
class DownArrowInInsertMode extends ArrowsInInsertMode {
  keys = ["<down>"];
}

@RegisterAction
class LeftArrowInInsertMode extends ArrowsInInsertMode {
  keys = ["<left>"];
}

@RegisterAction
class RightArrowInInsertMode extends ArrowsInInsertMode {
  keys = ["<right>"];
}

@RegisterAction
class CommandInsertInSearchMode extends BaseCommand {
  modes = [ModeName.SearchInProgressMode];
  keys = ["<any>"];
  runsOnceForEveryCursor() { return this.keysPressed[0] === '\n'; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const key = this.keysPressed[0];
    const searchState = vimState.searchState!;

    // handle special keys first
    if (key === "<BS>") {
      searchState.searchString = searchState.searchString.slice(0, -1);
    } else if (key === "\n") {
      vimState.currentMode = ModeName.Normal;

      // Repeat the previous search if no new string is entered
      if (searchState.searchString === "") {
        const prevSearch = vimState.searchStatePrevious!;
        if (prevSearch) {
          searchState.searchString = prevSearch.searchString;
        }
      }
      // Store this search
      vimState.searchStatePrevious = searchState;

      // Move cursor to next match
      vimState.cursorPosition = searchState.getNextSearchMatchPosition(vimState.cursorPosition).pos;

      return vimState;
    } else if (key === "<Esc>") {
      vimState.currentMode = ModeName.Normal;
      vimState.searchState = undefined;

      return vimState;
    } else if (key === "<C-v>") {
      const text = await new Promise<string>((resolve, reject) =>
        clipboard.paste((err, text) => err ? reject(err) : resolve(text))
      );

      searchState.searchString += text;
    } else {
      searchState.searchString += this.keysPressed[0];
    }

    return vimState;
  }
}

@RegisterAction
class CommandNextSearchMatch extends BaseMovement {
  keys = ["n"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const searchState = vimState.searchState;

    if (!searchState || searchState.searchString === "") {
      return position;
    }

    return searchState.getNextSearchMatchPosition(vimState.cursorPosition).pos;
  }
}

@RegisterAction
class CommandStar extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["*"];
  isMotion = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const currentWord = TextEditor.getWord(position);
    if (currentWord === undefined) {
      return vimState;
    }

    vimState.searchState = new SearchState(SearchDirection.Forward, vimState.cursorPosition, currentWord);

    do {
      vimState.cursorPosition = vimState.searchState.getNextSearchMatchPosition(vimState.cursorPosition).pos;
    } while (TextEditor.getWord(vimState.cursorPosition) !== currentWord);

    return vimState;
  }
}

@RegisterAction
class CommandHash extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["#"];
  isMotion = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const currentWord = TextEditor.getWord(position);
    if (currentWord === undefined) {
      return vimState;
    }

    vimState.searchState = new SearchState(SearchDirection.Backward, vimState.cursorPosition, currentWord);

    do {
      // use getWordLeft() on position to start at the beginning of the word.
      // this ensures that any matches happen ounside of the word currently selected,
      // which are the desired semantics for this motion.
      vimState.cursorPosition = vimState.searchState.getNextSearchMatchPosition(vimState.cursorPosition.getWordLeft()).pos;
    } while (TextEditor.getWord(vimState.cursorPosition) !== currentWord);

    return vimState;
  }
}

@RegisterAction
class CommandPreviousSearchMatch extends BaseMovement {
  keys = ["N"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const searchState = vimState.searchState;

    if (!searchState || searchState.searchString === "") {
      return position;
    }

    return searchState.getNextSearchMatchPosition(vimState.cursorPosition, -1).pos;
  }
}

@RegisterAction
class CommandCtrlHInInsertMode extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-h>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.recordedState.transformations.push({
      type     : "deleteText",
      position : position,
    });

    return vimState;
  }
}

@RegisterAction
class CommandCtrlUInInsertMode extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-u>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const start = position.getLineBegin();
    const stop = position.getLineEnd();
    await TextEditor.delete(new vscode.Range(start, stop));
    vimState.cursorPosition = start;
    vimState.cursorStartPosition = start;
    return vimState;
  }
}

@RegisterAction
export class CommandSearchForwards extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["/"];
  isMotion = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.searchState = new SearchState(SearchDirection.Forward, vimState.cursorPosition, "", { isRegex: true });
    vimState.currentMode = ModeName.SearchInProgressMode;

    return vimState;
  }
}

@RegisterAction
export class CommandSearchBackwards extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["?"];
  isMotion = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.searchState = new SearchState(SearchDirection.Backward, vimState.cursorPosition, "", { isRegex: true });
    vimState.currentMode = ModeName.SearchInProgressMode;

    return vimState;
  }
}

@RegisterAction
class CommandFormatCode extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ["="];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.format");
    let line = vimState.cursorStartPosition.line;

    if (vimState.cursorStartPosition.isAfter(vimState.cursorPosition)) {
      line = vimState.cursorPosition.line;
    }

    let newCursorPosition = new Position(line, 0);
    vimState.cursorPosition = newCursorPosition;
    vimState.cursorStartPosition = newCursorPosition;
    vimState.currentMode = ModeName.Normal;
    return vimState;
  }
}

@RegisterAction
export class DeleteOperator extends BaseOperator {
    public keys = ["d"];
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    /**
     * Deletes from the position of start to 1 past the position of end.
     */
    public async delete(start: Position, end: Position, currentMode: ModeName,
                        registerMode: RegisterMode, vimState: VimState, yank = true): Promise<Position> {
        if (registerMode === RegisterMode.LineWise) {
          start = start.getLineBegin();
          end   = end.getLineEnd();
        }

        end = new Position(end.line, end.character + 1);

        const isOnLastLine = end.line === TextEditor.getLineCount() - 1;

        // Vim does this weird thing where it allows you to select and delete
        // the newline character, which it places 1 past the last character
        // in the line. Here we interpret a character position 1 past the end
        // as selecting the newline character. Don't allow this in visual block mode
        if (vimState.currentMode !== ModeName.VisualBlock) {
          if (end.character === TextEditor.getLineAt(end).text.length + 1) {
            end = end.getDown(0);
          }
        }

        // If we delete linewise to the final line of the document, we expect the line
        // to be removed. This is actually a special case because the newline
        // character we've selected to delete is the newline on the end of the document,
        // but we actually delete the newline on the second to last line.

        // Just writing about this is making me more confused. -_-
        if (isOnLastLine &&
            start.line !== 0 &&
            registerMode === RegisterMode.LineWise) {
          start = start.getPreviousLineBegin().getLineEnd();
        }

        let text = vscode.window.activeTextEditor.document.getText(new vscode.Range(start, end));

        if (registerMode === RegisterMode.LineWise) {
          // slice final newline in linewise mode - linewise put will add it back.
          text = text.endsWith("\r\n") ? text.slice(0, -2) : text.slice(0, -1);
        }

        if (yank) {
          Register.put(text, vimState);
        }

        let diff = new PositionDiff(0, 0);
        let resultingPosition: Position;

        if (currentMode === ModeName.Visual) {
          resultingPosition = Position.EarlierOf(start, end);
        }

        if (start.character > TextEditor.getLineAt(start).text.length) {
          resultingPosition = start.getLeft();
          diff = new PositionDiff(0, -1);
        } else {
          resultingPosition = start;
        }

        if (registerMode === RegisterMode.LineWise) {
          resultingPosition = resultingPosition.getLineBegin();
          diff = PositionDiff.NewBOLDiff();
        }

        vimState.recordedState.transformations.push({
          type  : "deleteRange",
          range : new Range(start, end),
          diff  : diff,
        });

        return resultingPosition;
    }

    public async run(vimState: VimState, start: Position, end: Position, yank = true): Promise<VimState> {
        await this.delete(start, end, vimState.currentMode, vimState.effectiveRegisterMode(), vimState, yank);

        vimState.currentMode = ModeName.Normal;

        /*
          vimState.cursorPosition      = result;
          vimState.cursorStartPosition = result;
        */

        return vimState;
    }
}

@RegisterAction
export class DeleteOperatorVisual extends BaseOperator {
    public keys = ["D"];
    public modes = [ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      return await new DeleteOperator().run(vimState, start, end);
    }
}

@RegisterAction
export class YankOperator extends BaseOperator {
    public keys = ["y"];
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
    canBeRepeatedWithDot = false;

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      const originalMode = vimState.currentMode;

      if (start.compareTo(end) <= 0) {
        end = new Position(end.line, end.character + 1);
      } else {
        const tmp = start;
        start = end;
        end = tmp;

        end = new Position(end.line, end.character + 1);
      }

      if (vimState.currentRegisterMode === RegisterMode.LineWise) {
        start = start.getLineBegin();
        end = end.getLineEnd();
      }

      let text = TextEditor.getText(new vscode.Range(start, end));

      // If we selected the newline character, add it as well.
      if (vimState.currentMode === ModeName.Visual &&
          end.character === TextEditor.getLineAt(end).text.length + 1) {
        text = text + "\n";
      }

      if (!vimState.isMultiCursor) {
        Register.put(text, vimState);
      } else {
        if (this.multicursorIndex === 0) {
          Register.put([], vimState);
        }

        Register.add(text, vimState);
      }

      vimState.currentMode = ModeName.Normal;
      vimState.cursorStartPosition = start;

      if (originalMode === ModeName.Normal) {
        vimState.allCursors = vimState.cursorPositionJustBeforeAnythingHappened.map(x => new Range(x, x));
      } else {
        vimState.cursorPosition = start;
      }

      return vimState;
    }
}

@RegisterAction
export class ShiftYankOperatorVisual extends BaseOperator {
    public keys = ["Y"];
    public modes = [ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      vimState.currentRegisterMode = RegisterMode.LineWise;

      return await new YankOperator().run(vimState, start, end);
    }
}

@RegisterAction
export class DeleteOperatorXVisual extends BaseOperator {
    public keys = ["x"];
    public modes = [ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      return await new DeleteOperator().run(vimState, start, end);
    }
}

@RegisterAction
export class ChangeOperatorSVisual extends BaseOperator {
    public keys = ["s"];
    public modes = [ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      return await new ChangeOperator().run(vimState, start, end);
    }
}


@RegisterAction
export class UpperCaseOperator extends BaseOperator {
    public keys = ["U"];
    public modes = [ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      const range = new vscode.Range(start, new Position(end.line, end.character + 1));
      let text = vscode.window.activeTextEditor.document.getText(range);

      await TextEditor.replace(range, text.toUpperCase());

      vimState.currentMode = ModeName.Normal;
      vimState.cursorPosition = start;

      return vimState;
    }
}

@RegisterAction
export class UpperCaseWithMotion extends UpperCaseOperator {
  public keys = ["g", "U"];
  public modes = [ModeName.Normal];
}

@RegisterAction
export class LowerCaseOperator extends BaseOperator {
    public keys = ["u"];
    public modes = [ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      const range = new vscode.Range(start, new Position(end.line, end.character + 1));
      let text = vscode.window.activeTextEditor.document.getText(range);

      await TextEditor.replace(range, text.toLowerCase());

      vimState.currentMode = ModeName.Normal;
      vimState.cursorPosition = start;

      return vimState;
    }
}

@RegisterAction
export class LowerCaseWithMotion extends LowerCaseOperator {
  public keys = ["g", "u"];
  public modes = [ModeName.Normal];
}

@RegisterAction
export class MarkCommand extends BaseCommand {
  keys = ["m", "<character>"];
  modes = [ModeName.Normal];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const markName = this.keysPressed[1];

    vimState.historyTracker.addMark(position, markName);

    return vimState;
  }
}

@RegisterAction
export class MarkMovementBOL extends BaseMovement {
  keys = ["'", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const markName = this.keysPressed[1];
    const mark = vimState.historyTracker.getMark(markName);

    return mark.position.getFirstLineNonBlankChar();
  }
}

@RegisterAction
export class MarkMovement extends BaseMovement {
  keys = ["`", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const markName = this.keysPressed[1];
    const mark = vimState.historyTracker.getMark(markName);

    return mark.position;
  }
}

@RegisterAction
export class ChangeOperator extends BaseOperator {
    public keys = ["c"];
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
        const isEndOfLine = end.character === TextEditor.getLineAt(end).text.length - 1;
        let state = vimState;

        // If we delete to EOL, the block cursor would end on the final character,
        // which means the insert cursor would be one to the left of the end of
        // the line. We do want to run delete if it is a multiline change though ex. c}
        if (Position.getLineLength(TextEditor.getLineAt(start).lineNumber) !== 0 || (end.line !== start.line)) {
          state = await new DeleteOperator().run(vimState, start, end);
        }

        state.currentMode = ModeName.Insert;

        if (isEndOfLine) {
          state.cursorPosition = state.cursorPosition.getRight();
        }

        return state;
    }
}

@RegisterAction
export class PutCommand extends BaseCommand {
    keys = ["p"];
    modes = [ModeName.Normal];
    runsOnceForEachCountPrefix = true;
    canBeRepeatedWithDot = true;

    public static async GetText(vimState: VimState, multicursorIndex: number | undefined = undefined): Promise<string> {
      const register = await Register.get(vimState);

      if (vimState.isMultiCursor) {
        if (multicursorIndex === undefined) {
          console.log("ERROR: no multi cursor index when calling PutCommand#getText");

          throw new Error("Bad!");
        }

        if (vimState.isMultiCursor && typeof register.text === "object") {
          return register.text[multicursorIndex];
        }
      }

      return register.text as string;
    }

    public async exec(position: Position, vimState: VimState, after: boolean = false, adjustIndent: boolean = false): Promise<VimState> {
        const register = await Register.get(vimState);
        const dest = after ? position : position.getRight();

        if (register.text instanceof RecordedState) {
          /**
           *  Paste content from recordedState. This one is actually complex as Vim has internal key code for key strokes.
           *  For example, Backspace is stored as `<80>kb`. So if you replay a macro, which is stored in a register as `a1<80>kb2`, you
           *  shall just get `2` inserted as `a` represents entering Insert Mode, `<80>bk` represents Backspace. However here, we shall
           *  insert the plain text content of the register, which is `a1<80>kb2`.
           */
          vimState.recordedState.transformations.push({
            type: "macro",
            register: vimState.recordedState.registerName,
            replay: "keystrokes"
          });
          return vimState;
        } else if (typeof register.text === "object") {
          return await this.execVisualBlockPaste(register.text, position, vimState, after);
        }

        let text = await PutCommand.GetText(vimState, this.multicursorIndex);

        let textToAdd: string;
        let whereToAddText: Position;
        let diff = new PositionDiff(0, 0);

        if (register.registerMode === RegisterMode.CharacterWise) {
          textToAdd = text;
          whereToAddText = dest;
        } else {
          if (adjustIndent) {
            // Adjust indent to current line
            let indentationWidth = TextEditor.getIndentationLevel(TextEditor.getLineAt(position).text);
            let firstLineIdentationWidth = TextEditor.getIndentationLevel(text.split('\n')[0]);

            text = text.split('\n').map(line => {
              let currentIdentationWidth = TextEditor.getIndentationLevel(line);
              let newIndentationWidth = currentIdentationWidth - firstLineIdentationWidth + indentationWidth;

              return TextEditor.setIndentationLevel(line, newIndentationWidth);
            }).join('\n');
          }

          if (after) {
            textToAdd = text + "\n";
            whereToAddText = dest.getLineBegin();
          } else {
            textToAdd = "\n" + text;
            whereToAddText = dest.getLineEnd();
          }
        }

        // More vim weirdness: If the thing you're pasting has a newline, the cursor
        // stays in the same place. Otherwise, it moves to the end of what you pasted.

        const numNewlines = text.split("\n").length - 1;
        const currentLineLength = TextEditor.getLineAt(position).text.length;

        if (register.registerMode === RegisterMode.LineWise) {
          const numWhitespace = text.match(/^\s*/)[0].length;

          if (after) {
            diff = PositionDiff.NewBOLDiff(-numNewlines - 1, numWhitespace);
          } else {
            diff = PositionDiff.NewBOLDiff(currentLineLength > 0 ? 1 : 0, numWhitespace);
          }
        } else {
          if (text.indexOf("\n") === -1) {
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
          type    : "insertText",
          text    : textToAdd,
          position: whereToAddText,
          diff    : diff,
        });

        vimState.currentRegisterMode = register.registerMode;
        return vimState;
    }

    private async execVisualBlockPaste(block: string[], position: Position, vimState: VimState, after: boolean): Promise<VimState> {
      if (after) {
        position = position.getRight();
      }

      // Add empty lines at the end of the document, if necessary.
      let linesToAdd = Math.max(0, block.length - (TextEditor.getLineCount() - position.line) + 1);

      if (linesToAdd > 0) {
        await TextEditor.insertAt(Array(linesToAdd).join("\n"),
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

      if (vimState.effectiveRegisterMode() === RegisterMode.LineWise &&
          vimState.recordedState.count > 0) {
        const numNewlines = (await PutCommand.GetText(vimState, this.multicursorIndex)).split("\n").length * vimState.recordedState.count;

        result.recordedState.transformations.push({
          type       : "moveCursor",
          diff       : new PositionDiff(-numNewlines + 1, 0),
          cursorIndex: this.multicursorIndex
        });
      }

      return result;
    }
}

@RegisterAction
export class GPutCommand extends BaseCommand {
  keys = ["g", "p"];
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
        type: "macro",
        register: vimState.recordedState.registerName,
        replay: "keystrokes"
      });

      return vimState;
    }
    if (typeof register.text === "object") { // visual block mode
      addedLinesCount = register.text.length * vimState.recordedState.count;
    } else {
      addedLinesCount = register.text.split('\n').length;
    }

    const result = await super.execCount(position, vimState);

    if (vimState.effectiveRegisterMode() === RegisterMode.LineWise) {
      const line = TextEditor.getLineAt(position).text;
      const addAnotherLine = line.length > 0 && addedLinesCount > 1;

      result.recordedState.transformations.push({
        type       : "moveCursor",
        diff       : PositionDiff.NewBOLDiff(1 + (addAnotherLine ? 1 : 0), 0),
        cursorIndex: this.multicursorIndex
      });
    }

    return result;
  }
}

@RegisterAction
export class PutWithIndentCommand extends BaseCommand {
  keys = ["]", "p"];
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
  keys = [
    ["p"],
    ["P"],
  ];
  modes = [ModeName.Visual, ModeName.VisualLine];
  runsOnceForEachCountPrefix = true;
  canBePrefixedWithDot = true;

  public async exec(position: Position, vimState: VimState, after: boolean = false): Promise<VimState> {
    const result = await new DeleteOperator().run(vimState, vimState.cursorStartPosition, vimState.cursorPosition, false);

    return await new PutCommand().exec(vimState.cursorStartPosition, result, true);
  }

  // TODO - execWithCount
}

@RegisterAction
class IndentOperator extends BaseOperator {
  modes = [ModeName.Normal];
  keys = [">"];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    vscode.window.activeTextEditor.selection = new vscode.Selection(start, end);

    await vscode.commands.executeCommand("editor.action.indentLines");

    vimState.currentMode    = ModeName.Normal;
    vimState.cursorPosition = start.getFirstLineNonBlankChar();

    return vimState;
  }
}

/**
 * `3>` to indent a line 3 times in visual mode is actually a bit of a special case.
 *
 * > is an operator, and generally speaking, you don't run operators multiple times, you run motions multiple times.
 * e.g. `d3w` runs `w` 3 times, then runs d once.
 *
 * Same with literally every other operator motion combination... until `3>`in visual mode
 * walked into my life.
 */
@RegisterAction
class IndentOperatorInVisualModesIsAWeirdSpecialCase extends BaseOperator {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = [">"];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    for (let i = 0; i < (vimState.recordedState.count || 1); i++) {
      await vscode.commands.executeCommand("editor.action.indentLines");
    }

    vimState.currentMode    = ModeName.Normal;
    vimState.cursorPosition = start.getFirstLineNonBlankChar();

    return vimState;
  }
}

@RegisterAction
class OutdentOperator extends BaseOperator {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["<"];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    vscode.window.activeTextEditor.selection = new vscode.Selection(start, end);

    await vscode.commands.executeCommand("editor.action.outdentLines");
    vimState.currentMode  = ModeName.Normal;
    vimState.cursorPosition = vimState.cursorStartPosition;

    return vimState;
  }
}


@RegisterAction
export class PutBeforeCommand extends BaseCommand {
    public keys = ["P"];
    public modes = [ModeName.Normal];

    public async exec(position: Position, vimState: VimState): Promise<VimState> {
        const command = new PutCommand();
        command.multicursorIndex = this.multicursorIndex;

        const result = await command.exec(position, vimState, true);

        return result;
    }
}

@RegisterAction
export class GPutBeforeCommand extends BaseCommand {
  keys = ["g", "P"];
  modes = [ModeName.Normal];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const result = await new PutCommand().exec(position, vimState, true);
    const register = await Register.get(vimState);
    let addedLinesCount: number;

    if (register.text instanceof RecordedState) {
      vimState.recordedState.transformations.push({
        type: "macro",
        register: vimState.recordedState.registerName,
        replay: "keystrokes"
      });

      return vimState;
    } else if (typeof register.text === "object") { // visual block mode
      addedLinesCount = register.text.length * vimState.recordedState.count;
    } else {
      addedLinesCount = register.text.split('\n').length;
    }

    if (vimState.effectiveRegisterMode() === RegisterMode.LineWise) {
      const line = TextEditor.getLineAt(position).text;
      const addAnotherLine = line.length > 0 && addedLinesCount > 1;

      result.recordedState.transformations.push({
        type       : "moveCursor",
        diff       : PositionDiff.NewBOLDiff(1 + (addAnotherLine ? 1 : 0), 0),
        cursorIndex: this.multicursorIndex
      });
    }

    return result;
  }
}

@RegisterAction
export class PutBeforeWithIndentCommand extends BaseCommand {
    keys = ["[", "p"];
    modes = [ModeName.Normal];

    public async exec(position: Position, vimState: VimState): Promise<VimState> {
      const result = await new PutCommand().exec(position, vimState, true, true);

      if (vimState.effectiveRegisterMode() === RegisterMode.LineWise) {
        result.cursorPosition = result.cursorPosition.getPreviousLineBegin().getFirstLineNonBlankChar();
      }

      return result;
    }
}

@RegisterAction
class CommandShowCommandLine extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = [":"];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.recordedState.transformations.push({
      type: "showCommandLine"
    });

    if (vimState.currentMode === ModeName.Normal) {
      vimState.commandInitialText = "";
    } else {
      vimState.commandInitialText = "'<,'>";
    }

    return vimState;
  }
}

@RegisterAction
class CommandDot extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["."];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.recordedState.transformations.push({
      type: "dot"
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
  keys = ["z", "c"];
  commandName = "editor.fold";
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;
    await vscode.commands.executeCommand("editor.fold", {levels: timesToRepeat, direction: "up"});

    return vimState;
  }
}

@RegisterAction
class CommandCloseAllFolds extends CommandFold {
  keys = ["z", "M"];
  commandName = "editor.foldAll";
}

@RegisterAction
class CommandOpenFold extends CommandFold {
  keys = ["z", "o"];
  commandName = "editor.unfold";
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;
    await vscode.commands.executeCommand("editor.unfold", {levels: timesToRepeat, direction: "up"});

    return vimState;
  }
}

@RegisterAction
class CommandOpenAllFolds extends CommandFold {
  keys = ["z", "R"];
  commandName = "editor.unfoldAll";
}

@RegisterAction
class CommandCloseAllFoldsRecursively extends CommandFold {
  modes = [ModeName.Normal];
  keys = ["z", "C"];
  commandName = "editor.foldRecursively";
}

@RegisterAction
class CommandOpenAllFoldsRecursively extends CommandFold {
  modes = [ModeName.Normal];
  keys = ["z", "O"];
  commandName = "editor.unFoldRecursively";
}

@RegisterAction
class CommandCenterScroll extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ["z", "z"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // In these modes you want to center on the cursor position
    vscode.window.activeTextEditor.revealRange(
      new vscode.Range(vimState.cursorPosition,
        vimState.cursorPosition),
      vscode.TextEditorRevealType.InCenter);

    return vimState;
  }
}

@RegisterAction
class CommandTopScroll extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["z", "t"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: "revealLine",
      args: {
        lineNumber: position.line,
        at: "top"
      }
    });

    return vimState;
  }
}

@RegisterAction
class CommandBottomScroll extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["z", "b"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: "revealLine",
      args: {
        lineNumber: position.line,
        at: "bottom"
      }
    });

    return vimState;
  }
}

@RegisterAction
class CommandGoToOtherEndOfHighlightedText extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ["o"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    [vimState.cursorStartPosition, vimState.cursorPosition] =
    [vimState.cursorPosition, vimState.cursorStartPosition];

    return vimState;
  }
}

@RegisterAction
class CommandUndo extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["u"];
  runsOnceForEveryCursor() { return false; }

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
  keys = ["<C-r>"];
  runsOnceForEveryCursor() { return false; }

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
  keys = ["D"];
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(vimState, position, position.getLineEnd().getLeft());
  }
}

@RegisterAction
class CommandYankFullLine extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["Y"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const linesDown = (vimState.recordedState.count || 1) - 1;
    const start = position.getLineBegin();
    const end = new Position(position.line + linesDown, 0).getLineEnd().getLeft();

    vimState.currentRegisterMode = RegisterMode.LineWise;

    return await new YankOperator().run(vimState, start, end);
  }
}

@RegisterAction
class CommandChangeToLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["C"];
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let count = vimState.recordedState.count || 1;
    return new ChangeOperator().run(vimState, position, position.getDownByCount(Math.max(0, count - 1)).getLineEnd().getLeft());
  }
}

@RegisterAction
class CommandClearLine extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["S"];
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let count = vimState.recordedState.count || 1;
    let end = position.getDownByCount(Math.max(0, count - 1)).getLineEnd().getLeft();
    return new ChangeOperator().run(vimState, position.getLineBeginRespectingIndent(), end);
  }
}

@RegisterAction
class CommandExitVisualMode extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ["v"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandVisualMode extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["v"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Visual;

    return vimState;
  }
}

@RegisterAction
class CommandVisualBlockMode extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualBlock];
  keys = ["<C-v>"];

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
  keys = ["V"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.VisualLine;

    return vimState;
  }
}

@RegisterAction
class CommandExitVisualLineMode extends BaseCommand {
  modes = [ModeName.VisualLine];
  keys = ["V"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandGoToDefinition extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["g", "d"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const startPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);

    await vscode.commands.executeCommand("editor.action.goToDeclaration");

    // Unfortuantely, the above does not necessarily have to have finished executing
    // (even though we do await!). THe only way to ensure it's done is to poll, which is
    // a major bummer.

    let maxIntervals = 10;

    await new Promise(resolve => {
      let interval = setInterval(() => {
        const positionNow = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);

        if (!startPosition.isEqual(positionNow) || maxIntervals-- < 0) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

    vimState.focusChanged = true;
    vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);

    return vimState;
  }
}

// begin insert commands

@RegisterAction
class CommandInsertAtFirstCharacter extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ["I"];

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
  keys = ["g", "I"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getLineBegin();

    return vimState;
  }
}

@RegisterAction
class CommandInsertAfterCursor extends BaseCommand {
  modes = [ModeName.Normal];
  mustBeFirstKey = true;
  keys = ["a"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getRight();

    return vimState;
  }
}

@RegisterAction
class CommandInsertAtLineEnd extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ["A"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getLineEnd();

    return vimState;
  }
}

@RegisterAction
class CommandInsertNewLineAbove extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["O"];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    await vscode.commands.executeCommand('editor.action.insertLineBefore');

    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();

    return vimState;
  }
}

@RegisterAction
class CommandInsertNewLineBefore extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["o"];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    await vscode.commands.executeCommand('editor.action.insertLineAfter');

    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();

    return vimState;
  }
}

@RegisterAction
class MoveLeft extends BaseMovement {
  keys = ["h"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLeft();
  }
}

@RegisterAction
class MoveLeftArrow extends MoveLeft {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ["<left>"];
}

@RegisterAction
class BackSpaceInNormalMode extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["<BS>"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLeftThroughLineBreaks();
  }
}

@RegisterAction
class MoveUp extends BaseMovement {
  keys = ["k"];
  doesntChangeDesiredColumn = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getUp(vimState.desiredColumn);
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getUp(position.getLineEnd().character);
  }
}

@RegisterAction
class MoveUpArrow extends MoveUp {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ["<up>"];
}

@RegisterAction
class MoveDown extends BaseMovement {
  keys = ["j"];
  doesntChangeDesiredColumn = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getDown(vimState.desiredColumn);
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;
    return position.getDown(position.getLineEnd().character);
  }
}

@RegisterAction
class MoveDownArrow extends MoveDown {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ["<down>"];
}

@RegisterAction
class MoveRight extends BaseMovement {
  keys = ["l"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return new Position(position.line, position.character + 1);
  }
}

@RegisterAction
class MoveRightArrow extends MoveRight {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock];
  keys = ["<right>"];
}

@RegisterAction
class MoveRightWithSpace extends BaseMovement {
  keys = [" "];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getRightThroughLineBreaks();
  }
}

@RegisterAction
class MoveToRightPane extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["<C-w>", "l"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: "workbench.action.focusNextGroup",
      args: {}
    });

    return vimState;
  }
}

@RegisterAction
class MoveToLeftPane  extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["<C-w>", "h"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.postponedCodeViewChanges.push({
      command: "workbench.action.focusPreviousGroup",
      args: {}
    });

    return vimState;
  }
}

class BaseTabCommand extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  runsOnceForEachCountPrefix = true;
}

@RegisterAction
class CommandTabNext extends BaseTabCommand {
  keys = [
    ["g", "t"],
    ["<C-pagedown>"],
  ];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    (new TabCommand({
      tab: Tab.Next,
      count: vimState.recordedState.count
    })).execute();

    return vimState;
  }
}

@RegisterAction
class CommandTabPrevious extends BaseTabCommand {
  keys = [
    ["g", "T"],
    ["<C-pageup>"],
  ];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    (new TabCommand({
      tab: Tab.Previous,
      count: 1
    })).execute();

    return vimState;
  }
}

@RegisterAction
class MoveDownNonBlank extends BaseMovement {
  keys = ["+"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    return position.getDownByCount(Math.max(count, 1))
             .getFirstLineNonBlankChar();
  }
}

@RegisterAction
class MoveUpNonBlank extends BaseMovement {
  keys = ["-"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    return position.getUpByCount(Math.max(count, 1))
             .getFirstLineNonBlankChar();
  }
}

@RegisterAction
class MoveDownUnderscore extends BaseMovement {
  keys = ["_"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    return position.getDownByCount(Math.max(count - 1, 0))
             .getFirstLineNonBlankChar();
  }
}

@RegisterAction
class MoveToColumn extends BaseMovement {
  keys = ["|"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    return new Position(position.line, Math.max(0, count - 1));
  }
}

@RegisterAction
class MoveFindForward extends BaseMovement {
  keys = ["f", "<character>"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    count = count || 1;
    const toFind = this.keysPressed[1];
    let result = position.findForwards(toFind, count);

    if (!result) {
      return { start: position, stop: position, failed: true };
    }

    if (vimState.recordedState.operator) {
      result = result.getRight();
    }

    return result;
  }

  public canBeRepeatedWithSemicolon(vimState: VimState, result: Position | IMovement) {
    return !vimState.recordedState.operator || !(isIMovement(result) && result.failed);
  }
}

@RegisterAction
class MoveFindBackward extends BaseMovement {
  keys = ["F", "<character>"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    count = count || 1;
    const toFind = this.keysPressed[1];
    let result = position.findBackwards(toFind, count);

    if (!result) {
      return { start: position, stop: position, failed: true };
    }

    return result;
  }

  public canBeRepeatedWithSemicolon(vimState: VimState, result: Position | IMovement) {
    return !vimState.recordedState.operator || !(isIMovement(result) && result.failed);
  }
}


@RegisterAction
class MoveTilForward extends BaseMovement {
  keys = ["t", "<character>"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    count = count || 1;
    const toFind = this.keysPressed[1];
    let result = position.tilForwards(toFind, count);

    if (!result) {
      return { start: position, stop: position, failed: true };
    }

    if (vimState.recordedState.operator) {
      result = result.getRight();
    }

    return result;
  }

  public canBeRepeatedWithSemicolon(vimState: VimState, result: Position | IMovement) {
    return !vimState.recordedState.operator || !(isIMovement(result) && result.failed);
  }
}

@RegisterAction
class MoveTilBackward extends BaseMovement {
  keys = ["T", "<character>"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    count = count || 1;
    const toFind = this.keysPressed[1];
    let result = position.tilBackwards(toFind, count);

    if (!result) {
      return { start: position, stop: position, failed: true };
    }

    return result;
  }

  public canBeRepeatedWithSemicolon(vimState: VimState, result: Position | IMovement) {
    return !vimState.recordedState.operator || !(isIMovement(result) && result.failed);
  }
}

@RegisterAction
class MoveRepeat extends BaseMovement {
  keys = [";"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    const movement = VimState.lastRepeatableMovement;
    if (movement) {
      const result = await movement.execActionWithCount(position, vimState, count);
      /**
       * For t<character> and T<character> commands vim executes ; as 2;
       * This way the cursor will get to the next instance of <character>
       */
      if (result instanceof Position && position.isEqual(result) && count <= 1) {
        return await movement.execActionWithCount(position, vimState, 2);
      }
      return result;
    }
    return position;
  }
}


@RegisterAction
class MoveRepeatReversed extends BaseMovement {
  keys = [","];
  static reverseMotionMapping : Map<Function, () => BaseMovement> = new Map([
    [MoveFindForward, () => new MoveFindBackward()],
    [MoveFindBackward, () => new MoveFindForward()],
    [MoveTilForward, () => new MoveTilBackward()],
    [MoveTilBackward, () => new MoveTilForward()]
  ]);

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    const movement = VimState.lastRepeatableMovement;
    if (movement) {
      const reverse = MoveRepeatReversed.reverseMotionMapping.get(movement.constructor)();
      reverse.keysPressed = [(reverse.keys as string[])[0], movement.keysPressed[1]];

      let result = await reverse.execActionWithCount(position, vimState, count);
      // For t<character> and T<character> commands vim executes ; as 2;
      if (result instanceof Position && position.isEqual(result) && count <= 1) {
        result = await reverse.execActionWithCount(position, vimState, 2);
      }
      return result;
    }
    return position;
  }
}

@RegisterAction
class MoveLineEnd extends BaseMovement {
  keys = ["$"];
  setsDesiredColumnToEOL = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLineEnd();
  }
}

@RegisterAction
class MoveLineBegin extends BaseMovement {
  keys = ["0"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLineBegin();
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.doesActionApply(vimState, keysPressed) &&
      vimState.recordedState.count === 0;
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    return super.couldActionApply(vimState, keysPressed) &&
      vimState.recordedState.count === 0;
  }
}

abstract class MoveByScreenLine extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  movementType: CursorMovePosition;
  by: CursorMoveByUnit;
  value: number = 1;

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    await vscode.commands.executeCommand("cursorMove", {
      to: this.movementType,
      select: vimState.currentMode !== ModeName.Normal,
      by: this.by,
      value: this.value
    });

    if (vimState.currentMode === ModeName.Normal) {
      return Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.active);
    } else {
      /**
       * cursorMove command is handling the selection for us.
       * So we are not following our design principal (do no real movement inside an action) here.
       */

      let start = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
      let stop = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.end);

      // We want to swap the cursor start stop positions based on which direction we are moving, up or down
      if (start.line < position.line) {
        [start, stop] = [stop, start];
      }

      return { start, stop };
    }
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<IMovement> {
    await vscode.commands.executeCommand("cursorMove", {
      to: this.movementType,
      select: true,
      by: this.by,
      value: this.value
    });

    return {
      start: Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start),
      stop: Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.end)
    };
  }
}

@RegisterAction
class MoveScreenLineBegin extends MoveByScreenLine {
  keys = ["g", "0"];
  movementType: CursorMovePosition = "wrappedLineStart";
}

@RegisterAction
class MoveScreenNonBlank extends MoveByScreenLine {
  keys = ["g", "^"];
  movementType: CursorMovePosition = "wrappedLineFirstNonWhitespaceCharacter";
}

@RegisterAction
class MoveScreenLineEnd extends MoveByScreenLine {
  keys = ["g", "$"];
  movementType: CursorMovePosition = "wrappedLineEnd";
}

@RegisterAction
class MoveScreenLineEndNonBlank extends MoveByScreenLine {
  keys = ["g", "_"];
  movementType: CursorMovePosition = "wrappedLineLastNonWhitespaceCharacter";
  canBePrefixedWithCount = true;

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    count = count || 1;
    const pos = await this.execAction(position, vimState) as Position;
    return pos.getDownByCount(count - 1);
  }
}

@RegisterAction
class MoveScreenLineCenter extends MoveByScreenLine {
  keys = ["g", "m"];
  movementType: CursorMovePosition = "wrappedLineColumnCenter";
}

@RegisterAction
class MoveUpByScreenLine extends MoveByScreenLine {
  modes = [ModeName.Insert, ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["g", "k"];
  movementType: CursorMovePosition = "up";
  by: CursorMoveByUnit = "wrappedLine";
  value = 1;
}

@RegisterAction
class MoveDownByScreenLine extends MoveByScreenLine {
  modes = [ModeName.Insert, ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["g", "j"];
  movementType: CursorMovePosition = "down";
  by: CursorMoveByUnit = "wrappedLine";
  value = 1;
}

@RegisterAction
class MoveScreenToRight extends MoveByScreenLine {
  modes = [ModeName.Insert, ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["z", "h"];
  movementType: CursorMovePosition = "right";
  by: CursorMoveByUnit = "character";
  value = 1;
}

@RegisterAction
class MoveScreenToLeft extends MoveByScreenLine {
  modes = [ModeName.Insert, ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["z", "l"];
  movementType: CursorMovePosition = "left";
  by: CursorMoveByUnit = "character";
  value = 1;
}

@RegisterAction
class MoveScreenToRightHalf extends MoveByScreenLine {
  modes = [ModeName.Insert, ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["z", "H"];
  movementType: CursorMovePosition = "right";
  by: CursorMoveByUnit = "halfLine";
  value = 1;
}

@RegisterAction
class MoveScreenToLeftHalf extends MoveByScreenLine {
  modes = [ModeName.Insert, ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["z", "L"];
  movementType: CursorMovePosition = "left";
  by: CursorMoveByUnit = "halfLine";
  value = 1;
}

@RegisterAction
class MoveToLineFromViewPortTop extends MoveByScreenLine {
  keys = ["H"];
  movementType: CursorMovePosition = "viewPortTop";
  by: CursorMoveByUnit = "line";
  value = 1;
  canBePrefixedWithCount = true;

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    this.value = count < 1 ? 1 : count;
    return await this.execAction(position, vimState);
  }
}

@RegisterAction
class MoveToLineFromViewPortBottom extends MoveByScreenLine {
  keys = ["L"];
  movementType: CursorMovePosition = "viewPortBottom";
  by: CursorMoveByUnit = "line";
  value = 1;
  canBePrefixedWithCount = true;

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    this.value = count < 1 ? 1 : count;
    return await this.execAction(position, vimState);
  }
}

@RegisterAction
class MoveToMiddleLineInViewPort extends MoveByScreenLine {
  keys = ["M"];
  movementType: CursorMovePosition = "viewPortCenter";
  by: CursorMoveByUnit = "line";
}

@RegisterAction
class MoveNonBlank extends BaseMovement {
  keys = ["^"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getFirstLineNonBlankChar();
  }
}

@RegisterAction
class MoveNextLineNonBlank extends BaseMovement {
  keys = ["\n"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position> {
    vimState.currentRegisterMode = RegisterMode.LineWise;

    // Count === 0 if just pressing enter in normal mode, need to still go down 1 line
    if (count === 0) {
      count++;
    }

    return position.getDownByCount(count).getFirstLineNonBlankChar();
  }
}

@RegisterAction
class MoveNonBlankFirst extends BaseMovement {
  keys = ["g", "g"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    if (count === 0) {
      return position.getDocumentStart();
    }

    return new Position(count - 1, 0);
  }
}

@RegisterAction
class MoveNonBlankLast extends BaseMovement {
  keys = ["G"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    let stop: Position;

    if (count === 0) {
      stop = new Position(TextEditor.getLineCount() - 1, 0);
    } else {
      stop = new Position(Math.min(count, TextEditor.getLineCount()) - 1, 0);
    }

    return {
      start: vimState.cursorStartPosition,
      stop: stop,
      registerMode: RegisterMode.LineWise
    };
  }
}

@RegisterAction
export class MoveWordBegin extends BaseMovement {
  keys = ["w"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (vimState.recordedState.operator instanceof ChangeOperator) {
      if (TextEditor.getLineAt(position).text.length < 1) {
        return position;
      }

      const line = TextEditor.getLineAt(position).text;
      const char = line[position.character];

      /*
      From the Vim manual:

      Special case: "cw" and "cW" are treated like "ce" and "cE" if the cursor is
      on a non-blank.  This is because "cw" is interpreted as change-word, and a
      word does not include the following white space.
      */

      if (" \t".indexOf(char) >= 0) {
        return position.getWordRight();
      } else {
        return position.getCurrentWordEnd(true).getRight();
      }
    } else {
      return position.getWordRight();
    }
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    const result = await this.execAction(position, vimState);

    /*
    From the Vim documentation:

    Another special case: When using the "w" motion in combination with an
    operator and the last word moved over is at the end of a line, the end of
    that word becomes the end of the operated text, not the first word in the
    next line.
    */

    if (result.line > position.line + 1 || (result.line === position.line + 1 && result.isFirstWordOfLine())) {
      return position.getLineEnd();
    }

    if (result.isLineEnd()) {
        return new Position(result.line, result.character + 1);
    }

    return result;
  }
}

@RegisterAction
class MoveFullWordBegin extends BaseMovement {
  keys = ["W"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (vimState.recordedState.operator instanceof ChangeOperator) {
      // TODO use execForOperator? Or maybe dont?

      // See note for w
      return position.getCurrentBigWordEnd().getRight();
    } else {
      return position.getBigWordRight();
    }
  }
}

@RegisterAction
class MoveWordEnd extends BaseMovement {
  keys = ["e"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentWordEnd();
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    let end = position.getCurrentWordEnd();

    return new Position(end.line, end.character + 1);
  }
}

@RegisterAction
class MoveFullWordEnd extends BaseMovement {
  keys = ["E"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentBigWordEnd();
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentBigWordEnd().getRight();
  }
}

@RegisterAction
class MoveLastWordEnd  extends BaseMovement {
  keys = ["g", "e"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLastWordEnd();
  }
}

@RegisterAction
class MoveLastFullWordEnd extends BaseMovement {
  keys = ["g", "E"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLastBigWordEnd();
  }
}

@RegisterAction
class MoveBeginningWord extends BaseMovement {
  keys = ["b"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getWordLeft();
  }
}

@RegisterAction
class MoveBeginningFullWord extends BaseMovement {
  keys = ["B"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getBigWordLeft();
  }
}

@RegisterAction
class MovePreviousSentenceBegin extends BaseMovement {
  keys = ["("];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getSentenceBegin({forward: false});
  }
}

@RegisterAction
class MoveNextSentenceBegin extends BaseMovement {
  keys = [")"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getSentenceBegin({forward: true});
  }
}

@RegisterAction
class MoveParagraphEnd extends BaseMovement {
  keys = ["}"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentParagraphEnd();
  }
}

@RegisterAction
class MoveParagraphBegin extends BaseMovement {
  keys = ["{"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentParagraphBeginning();
  }
}

abstract class MoveSectionBoundary extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  boundary: string;
  forward: boolean;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getSectionBoundary({
      forward: this.forward,
      boundary: this.boundary
    });
  }
}

@RegisterAction
class MoveNextSectionBegin extends MoveSectionBoundary {
  keys = ["]", "]"];
  boundary = "{";
  forward = true;
}

@RegisterAction
class MoveNextSectionEnd extends MoveSectionBoundary {
  keys = ["]", "["];
  boundary = "}";
  forward = true;
}

@RegisterAction
class MovePreviousSectionBegin extends MoveSectionBoundary {
  keys = ["[", "["];
  boundary = "{";
  forward = false;
}

@RegisterAction
class MovePreviousSectionEnd extends MoveSectionBoundary {
  keys = ["[", "]"];
  boundary = "}";
  forward = false;
}

@RegisterAction
class ActionDeleteChar extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["x"];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // If line is empty, do nothing
    if (TextEditor.getLineAt(position).text.length < 1) {
      return vimState;
    }

    const state = await new DeleteOperator().run(vimState, position, position);

    state.currentMode = ModeName.Normal;

    return state;
  }
}

@RegisterAction
class ActionDeleteCharWithDeleteKey extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["<Del>"];
  runsOnceForEachCountPrefix = true;
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    // N<del> is a no-op in Vim
    if (vimState.recordedState.count !== 0) {
      return vimState;
    }

    const state = await new DeleteOperator().run(vimState, position, position);

    state.currentMode = ModeName.Normal;

    return state;
  }
}

@RegisterAction
class ActionDeleteLastChar extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["X"];
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (position.character === 0) {
      return vimState;
    }

    return await new DeleteOperator().run(vimState, position.getLeft(), position.getLeft());
  }
}

@RegisterAction
class ActionJoin extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["J"];
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (position.line === TextEditor.getLineCount() - 1) {
      return vimState; // TODO: bell
    }

    let lineOne = TextEditor.getLineAt(position).text;
    let lineTwo = TextEditor.getLineAt(position.getNextLineBegin()).text;

    let lineTwoTrimmedStart = lineTwo.substring(position.getNextLineBegin().getFirstLineNonBlankChar().character);

    // TODO(whitespace): need a better way to check for whitespace
    let oneEndsWithWhitespace = lineOne.length > 0 && " \t".indexOf(lineOne[lineOne.length - 1]) > -1;
    let isParenthesisPair = (lineOne[lineOne.length - 1] === '(' && lineTwoTrimmedStart[0] === ')');

    const addSpace = !oneEndsWithWhitespace && !isParenthesisPair;

    let resultLine = lineOne + (addSpace ? " " : "") + lineTwoTrimmedStart;

    let newState = await new DeleteOperator().run(
      vimState,
      position.getLineBegin(),
      lineTwo.length > 0 ?
        position.getNextLineBegin().getLineEnd().getLeft() :
        position.getLineEnd()
    );

    vimState.recordedState.transformations.push({
      type    : "insertText",
      text    : resultLine,
      position: position,
      diff    : new PositionDiff(0, -lineTwoTrimmedStart.length - 1 + (addSpace ? 0 : 1)),
    });

    newState.cursorPosition = new Position(position.line,
      lineOne.length + (addSpace ? 1 : 0) + (isParenthesisPair ? 1 : 0) - 1 + (oneEndsWithWhitespace ? 1 : 0));

    return newState;
  }
}

@RegisterAction
class ActionJoinVisualMode extends BaseCommand {
  modes = [ModeName.Visual];
  keys = ["J"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let actionJoin = new ActionJoin();
    let start = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    let end = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.end);

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
class ActionJoinNoWhitespace extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["g", "J"];
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

    let newState = await new DeleteOperator().run(
      vimState,
      position.getLineBegin(),
      lineTwo.length > 0 ?
        position.getNextLineBegin().getLineEnd().getLeft() :
        position.getLineEnd()
    );

    vimState.recordedState.transformations.push({
      type     : "insertText",
      text     : resultLine,
      position : position,
      diff     : new PositionDiff(0, -lineTwo.length),
    });

    newState.cursorPosition = new Position(position.line, lineOne.length);

    return newState;
  }
}

@RegisterAction
class ActionJoinNoWhitespaceVisualMode extends BaseCommand {
  modes = [ModeName.Visual];
  keys = ["g", "J"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let actionJoin = new ActionJoinNoWhitespace();
    let start = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    let end = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.end);

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
  keys = ["r", "<character>"];
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let timesToRepeat = vimState.recordedState.count || 1;
    const toReplace = this.keysPressed[1];

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

    vimState.recordedState.transformations.push({
      type    : "replaceText",
      text    : toReplace.repeat(timesToRepeat),
      start   : position,
      end     : endPos,
      diff    : new PositionDiff(0, timesToRepeat - 1),
    });

    return vimState;
  }

  public async execCount(position: Position, vimState: VimState): Promise<VimState> {

    return super.execCount(position, vimState);
  }
}

@RegisterAction
class ActionReplaceCharacterVisualBlock extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ["r", "<character>"];
  runsOnceForEveryCursor() { return false; }
  canBeRepeatedWithDot = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const toInsert   = this.keysPressed[1];

    for (const { pos } of Position.IterateBlock(vimState.topLeft, vimState.bottomRight)) {
      vimState.recordedState.transformations.push({
        type  : "replaceText",
        text  : toInsert,
        start : pos,
        end   : pos.getRight(),
      });
    }

    const topLeft = VisualBlockMode.getTopLeftPosition(vimState.cursorPosition, vimState.cursorStartPosition);

    vimState.allCursors = [ new Range(topLeft, topLeft) ];
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class ActionXVisualBlock extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ["x"];
  canBeRepeatedWithDot = true;
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    for (const { start, end } of Position.IterateLine(vimState)) {
      vimState.recordedState.transformations.push({
        type  : "deleteRange",
        range : new Range(start, end),
        manuallySetCursorPositions: true,
      });
    }

    const topLeft = VisualBlockMode.getTopLeftPosition(vimState.cursorPosition, vimState.cursorStartPosition);

    vimState.allCursors = [ new Range(topLeft, topLeft) ];
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class ActionDVisualBlock extends ActionXVisualBlock {
  modes = [ModeName.VisualBlock];
  keys = ["d"];
  canBeRepeatedWithDot = true;
  runsOnceForEveryCursor() { return false; }
}

@RegisterAction
class ActionGoToInsertVisualBlockMode extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ["I"];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.cursorPosition.character < vimState.cursorStartPosition.character) {
      vimState.cursorPosition = vimState.cursorPosition.getRight();
    }

    vimState.currentMode = ModeName.VisualBlockInsertMode;
    vimState.recordedState.visualBlockInsertionType = VisualBlockInsertionType.Insert;
    vimState.cursorPosition = vimState.cursorPosition.getLeft();
    return vimState;
  }
}

@RegisterAction
class ActionChangeInVisualBlockMode extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ["c"];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    for (const { start, end } of Position.IterateLine(vimState)) {
      vimState.recordedState.transformations.push({
        type         : "deleteRange",
        range        : new Range(start, end),
        collapseRange: true,
      });
    }

    vimState.currentMode = ModeName.VisualBlockInsertMode;
    vimState.recordedState.visualBlockInsertionType = VisualBlockInsertionType.Insert;

    return vimState;
  }
}

// TODO - this is basically a duplicate of the above command

@RegisterAction
class ActionChangeToEOLInVisualBlockMode extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ["C"];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    for (const { start } of Position.IterateLine(vimState)) {
      vimState.recordedState.transformations.push({
        type: "deleteRange",
        range: new Range(start, start.getLineEnd()),
        collapseRange: true
      });
    }

    vimState.currentMode = ModeName.VisualBlockInsertMode;
    vimState.recordedState.visualBlockInsertionType = VisualBlockInsertionType.Insert;

    return vimState;
  }
}

@RegisterAction
class ActionGoToInsertVisualBlockModeAppend extends BaseCommand {
  modes = [ModeName.VisualBlock];
  keys = ["A"];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.cursorPosition.character < vimState.cursorStartPosition.character) {
      vimState.cursorPosition = vimState.cursorPosition.getRight();
    }

    vimState.currentMode = ModeName.VisualBlockInsertMode;
    vimState.recordedState.visualBlockInsertionType = VisualBlockInsertionType.Append;
    vimState.cursorPosition = vimState.cursorPosition.getRight();

    return vimState;
  }
}

@RegisterAction
export class YankVisualBlockMode extends BaseOperator {
    public keys = ["y"];
    public modes = [ModeName.VisualBlock];
    canBeRepeatedWithDot = false;
    runsOnceForEveryCursor() { return false; }

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      let toCopy: string[] = [];

      for ( const { line } of Position.IterateLine(vimState)) {
        toCopy.push(line);
      }

      Register.put(toCopy, vimState);

      vimState.currentMode = ModeName.Normal;
      vimState.cursorPosition = start;
      return vimState;
    }
}


@RegisterAction
class InsertInInsertVisualBlockMode extends BaseCommand {
  modes = [ModeName.VisualBlockInsertMode];
  keys = ["<any>"];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let char = this.keysPressed[0];
    let insertAtStart = vimState.recordedState.visualBlockInsertionType === VisualBlockInsertionType.Insert;

    if (char === '\n') {
      return vimState;
    }

    if (char === '<BS>' && vimState.topLeft.character === 0) {
      return vimState;
    }

    for (const { start, end } of Position.IterateLine(vimState)) {
      const insertPos = insertAtStart ? start : end;

      if (char === '<BS>') {
        vimState.recordedState.transformations.push({
          type     : "deleteText",
          position : insertPos,
          diff     : new PositionDiff(0, -1),
        });
      } else {
        let positionToInsert: Position;

        if (vimState.recordedState.visualBlockInsertionType === VisualBlockInsertionType.Append) {
          positionToInsert = insertPos.getLeft();
        } else {
          positionToInsert = insertPos;
        }

        vimState.recordedState.transformations.push({
          type    : "insertText",
          text    : char,
          position: positionToInsert,
          diff     : new PositionDiff(0, 1),
        });
      }
    }

    return vimState;
  }
}

// DOUBLE MOTIONS
// (dd yy cc << >>)
// These work because there is a check in does/couldActionApply where
// you can't run an operator if you already have one going (which is logical).
// However there is the slightly weird behavior where dy actually deletes the whole
// line, lol.
@RegisterAction
class MoveDD extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["d"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<Position | IMovement> {
    return {
      start        : position.getLineBegin(),
      stop         : position.getDownByCount(Math.max(0, count - 1)).getLineEnd(),
      registerMode : RegisterMode.LineWise
    };
  }
}

@RegisterAction
class MoveYY extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["y"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<IMovement> {
    return {
      start       : position.getLineBegin(),
      stop        : position.getDownByCount(Math.max(0, count - 1)).getLineEnd(),
      registerMode: RegisterMode.LineWise,
    };
  }
}

@RegisterAction
class MoveCC extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["c"];

  public async execActionWithCount(position: Position, vimState: VimState, count: number): Promise<IMovement> {
    return {
      start       : position.getLineBeginRespectingIndent(),
      stop        : position.getDownByCount(Math.max(0, count - 1)).getLineEnd(),
      registerMode: RegisterMode.CharacterWise
    };
  }
}

@RegisterAction
class MoveIndent extends BaseMovement {
  modes = [ModeName.Normal];
  keys = [">"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    return {
      start       : position.getLineBegin(),
      stop        : position.getLineEnd(),
    };
  }
}

@RegisterAction
class MoveOutdent extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["<"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    return {
      start       : position.getLineBegin(),
      stop        : position.getLineEnd(),
    };
  }
}

@RegisterAction
class ActionDeleteLineVisualMode extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ["X"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(vimState, position.getLineBegin(), position.getLineEnd());
  }
}

@RegisterAction
class ActionChangeChar extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["s"];
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const state = await new ChangeOperator().run(vimState, position, position);

    state.currentMode = ModeName.Insert;

    return state;
  }
}

abstract class TextObjectMovement extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualBlock];
  canBePrefixedWithCount = true;

  public async execActionForOperator(position: Position, vimState: VimState): Promise<IMovement> {
    const res = await this.execAction(position, vimState) as IMovement;
    // Since we need to handle leading spaces, we cannot use MoveWordBegin.execActionForOperator
    // In normal mode, the character on the stop position will be the first character after the operator executed
    // and we do left-shifting in operator-pre-execution phase, here we need to right-shift the stop position accordingly.
    res.stop = new Position(res.stop.line, res.stop.character + 1);

    return res;
  }
}

@RegisterAction
class SelectWord extends TextObjectMovement {
  keys = ["a", "w"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentChar = TextEditor.getLineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
        start = position.getLastWordEnd().getRight();
        stop = position.getCurrentWordEnd();
    } else {
        stop = position.getWordRight().getLeftThroughLineBreaks();

        if (stop.isEqual(position.getCurrentWordEnd())) {
          start = position.getLastWordEnd().getRight();
        } else {
          start = position.getWordLeft(true);
        }
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
        start = vimState.cursorStartPosition;

        if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
          // If current cursor postion is before cursor start position, we are selecting words in reverser order.
          if (/\s/.test(currentChar)) {
            stop = position.getWordLeft(true);
          } else {
            stop = position.getLastWordEnd().getRight();
          }
        }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
class SelectABigWord extends TextObjectMovement {
  keys = ["a", "W"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentChar = TextEditor.getLineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
        start = position.getLastBigWordEnd().getRight();
        stop = position.getCurrentBigWordEnd();
    } else {
        start = position.getBigWordLeft();
        stop = position.getBigWordRight().getLeft();
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
        start = vimState.cursorStartPosition;

        if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
          // If current cursor postion is before cursor start position, we are selecting words in reverser order.
          if (/\s/.test(currentChar)) {
            stop = position.getBigWordLeft();
          } else {
            stop = position.getLastBigWordEnd().getRight();
          }
        }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
class SelectInnerWord extends TextObjectMovement {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ["i", "w"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = TextEditor.getLineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
        start = position.getLastWordEnd().getRight();
        stop = position.getWordRight().getLeft();
    } else {
        start = position.getWordLeft(true);
        stop = position.getCurrentWordEnd(true);
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.getLastWordEnd().getRight();
        } else {
          stop = position.getWordLeft(true);
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
class SelectInnerBigWord extends TextObjectMovement {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ["i", "W"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;
    const currentChar = TextEditor.getLineAt(position).text[position.character];

    if (/\s/.test(currentChar)) {
        start = position.getLastBigWordEnd().getRight();
        stop = position.getBigWordRight().getLeft();
    } else {
        start = position.getBigWordLeft();
        stop = position.getCurrentBigWordEnd(true);
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting words in reverser order.
        if (/\s/.test(currentChar)) {
          stop = position.getLastBigWordEnd().getRight();
        } else {
          stop = position.getBigWordLeft();
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
class SelectSentence extends TextObjectMovement {
  keys = ["a", "s"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentSentenceBegin = position.getSentenceBegin({forward: false});
    const currentSentenceNonWhitespaceEnd = currentSentenceBegin.getCurrentSentenceEnd();

    if (currentSentenceNonWhitespaceEnd.isBefore(position)) {
      // The cursor is on a trailing white space.
      start = currentSentenceNonWhitespaceEnd.getRight();
      stop = currentSentenceBegin.getSentenceBegin({forward: true}).getCurrentSentenceEnd();
    } else {
      const nextSentenceBegin = currentSentenceBegin.getSentenceBegin({forward: true});

      // If the sentence has no trailing white spaces, `as` should include its leading white spaces.
      if (nextSentenceBegin.isEqual(currentSentenceBegin.getCurrentSentenceEnd())) {
        start = currentSentenceBegin.getSentenceBegin({forward: false}).getCurrentSentenceEnd().getRight();
        stop = nextSentenceBegin;
      } else {
        start = currentSentenceBegin;
        stop = nextSentenceBegin.getLeft();
      }
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting sentences in reverser order.
        if (currentSentenceNonWhitespaceEnd.isAfter(vimState.cursorPosition)) {
          stop = currentSentenceBegin.getSentenceBegin({forward: false}).getCurrentSentenceEnd().getRight();
        } else {
          stop = currentSentenceBegin;
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
class SelectInnerSentence extends TextObjectMovement {
  keys = ["i", "s"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position;

    const currentSentenceBegin = position.getSentenceBegin({forward: false});
    const currentSentenceNonWhitespaceEnd = currentSentenceBegin.getCurrentSentenceEnd();

    if (currentSentenceNonWhitespaceEnd.isBefore(position)) {
      // The cursor is on a trailing white space.
      start = currentSentenceNonWhitespaceEnd.getRight();
      stop = currentSentenceBegin.getSentenceBegin({forward: true}).getLeft();
    } else {
      start = currentSentenceBegin;
      stop = currentSentenceNonWhitespaceEnd;
    }

    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      start = vimState.cursorStartPosition;

      if (vimState.cursorPosition.isBefore(vimState.cursorStartPosition)) {
        // If current cursor postion is before cursor start position, we are selecting sentences in reverser order.
        if (currentSentenceNonWhitespaceEnd.isAfter(vimState.cursorPosition)) {
          stop = currentSentenceBegin;
        } else {
          stop = currentSentenceNonWhitespaceEnd.getRight();
        }
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
class SelectParagraph extends TextObjectMovement {
  keys = ["a", "p"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    const currentParagraphBegin = position.getCurrentParagraphBeginning();

    if (position.isLineBeginning() && position.isLineEnd()) {
      // The cursor is at an empty line, it can be both the start of next paragraph and the end of previous paragraph
      start = position.getCurrentParagraphBeginning().getCurrentParagraphEnd();
    } else {
      if (currentParagraphBegin.isLineBeginning() && currentParagraphBegin.isLineEnd()) {
        start = currentParagraphBegin.getRightThroughLineBreaks();
      } else {
        start = currentParagraphBegin;
      }
    }

    return {
      start: start,
      stop: position.getCurrentParagraphEnd()
    };
  }
}

@RegisterAction
class SelectInnerParagraph extends TextObjectMovement {
  keys = ["i", "p"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    let start: Position;
    let stop: Position = position.getCurrentParagraphEnd();

    if (stop.isLineBeginning() && stop.isLineEnd()) {
      stop = stop.getLeftThroughLineBreaks();
    }

    const currentParagraphBegin = position.getCurrentParagraphBeginning();

    if (position.isLineBeginning() && position.isLineEnd()) {
      // The cursor is at an empty line, it can be both the start of next paragraph and the end of previous paragraph
      start = position.getCurrentParagraphBeginning().getCurrentParagraphEnd();
      stop = position.getCurrentParagraphEnd().getCurrentParagraphBeginning();
    } else {
      if (currentParagraphBegin.isLineBeginning() && currentParagraphBegin.isLineEnd()) {
        start = currentParagraphBegin.getRightThroughLineBreaks();
      } else {
        start = currentParagraphBegin;
      }
    }

    return {
      start: start,
      stop: stop
    };
  }
}

@RegisterAction
class MoveToMatchingBracket extends BaseMovement {
  keys = ["%"];

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const text = TextEditor.getLineAt(position).text;
    const charToMatch = text[position.character];
    const toFind = PairMatcher.pairings[charToMatch];
    const failure = { start: position, stop: position, failed: true };

    if (!toFind || !toFind.matchesWithPercentageMotion) {
      // If we're not on a match, go right until we find a
      // pairable character or hit the end of line.

      for (let i = position.character; i < text.length; i++) {
        if (PairMatcher.pairings[text[i]]) {
          // We found an opening char, now move to the matching closing char
          const openPosition = new Position(position.line, i);
          const result = PairMatcher.nextPairedChar(openPosition, text[i], true);

          if (!result) { return failure; }
          return result;
        }
      }

      return failure;
    }

    const result = PairMatcher.nextPairedChar(position, charToMatch, true);
    if (!result) { return failure; }
    return result;
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const result = await this.execAction(position, vimState);

    if (isIMovement(result)) {
      if (result.failed) {
        return result;
      } else {
        throw new Error("Did not ever handle this case!");
      }
    }

    if (position.compareTo(result) > 0) {
      return {
        start: result,
        stop: position.getRight(),
      };
    } else {
      return result.getRight();
    }
  }
}

abstract class MoveInsideCharacter extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualBlock];
  protected charToMatch: string;
  protected includeSurrounding = false;

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const failure = { start: position, stop: position, failed: true };
    const text = TextEditor.getLineAt(position).text;
    const closingChar = PairMatcher.pairings[this.charToMatch].match;
    const closedMatch = text[position.character] === closingChar;

    // First, search backwards for the opening character of the sequence
    let startPos = PairMatcher.nextPairedChar(position, closingChar, closedMatch);
    if (startPos === undefined) { return failure; }

    const startPlusOne = new Position(startPos.line, startPos.character + 1);

    let endPos = PairMatcher.nextPairedChar(startPlusOne, this.charToMatch, false);
    if (endPos === undefined) { return failure; }

    if (this.includeSurrounding) {
      endPos = new Position(endPos.line, endPos.character + 1);
    } else {
      startPos = startPlusOne;
    }

    // If the closing character is the first on the line, don't swallow it.
    if (endPos.character === 0) {
      endPos = endPos.getLeftThroughLineBreaks();
    }

    if (position.isBefore(startPos)) {
      vimState.recordedState.operatorPositionDiff = startPos.subtract(position);
    }

    return {
      start : startPos,
      stop  : endPos,
      diff  : new PositionDiff(0, startPos === position ? 1 : 0)
    };
  }
}

@RegisterAction
class MoveIParentheses extends MoveInsideCharacter {
  keys = ["i", "("];
  charToMatch = "(";
}

@RegisterAction
class MoveIClosingParentheses extends MoveInsideCharacter {
  keys = ["i", ")"];
  charToMatch = "(";
}

@RegisterAction
class MoveIClosingParenthesesBlock extends MoveInsideCharacter {
  keys = ["i", "b"];
  charToMatch = "(";
}

@RegisterAction
class MoveAParentheses extends MoveInsideCharacter {
  keys = ["a", "("];
  charToMatch = "(";
  includeSurrounding = true;
}

@RegisterAction
class MoveAClosingParentheses extends MoveInsideCharacter {
  keys = ["a", ")"];
  charToMatch = "(";
  includeSurrounding = true;
}

@RegisterAction
class MoveAParenthesesBlock extends MoveInsideCharacter {
  keys = ["a", "b"];
  charToMatch = "(";
  includeSurrounding = true;
}

@RegisterAction
class MoveICurlyBrace extends MoveInsideCharacter {
  keys = ["i", "{"];
  charToMatch = "{";
}

@RegisterAction
class MoveIClosingCurlyBrace extends MoveInsideCharacter {
  keys = ["i", "}"];
  charToMatch = "{";
}

@RegisterAction
class MoveIClosingCurlyBraceBlock extends MoveInsideCharacter {
  keys = ["i", "B"];
  charToMatch = "{";
}

@RegisterAction
class MoveACurlyBrace extends MoveInsideCharacter {
  keys = ["a", "{"];
  charToMatch = "{";
  includeSurrounding = true;
}

@RegisterAction
class MoveAClosingCurlyBrace extends MoveInsideCharacter {
  keys = ["a", "}"];
  charToMatch = "{";
  includeSurrounding = true;
}

@RegisterAction
class MoveAClosingCurlyBraceBlock extends MoveInsideCharacter {
  keys = ["a", "B"];
  charToMatch = "{";
  includeSurrounding = true;
}

@RegisterAction
class MoveICaret extends MoveInsideCharacter {
  keys = ["i", "<"];
  charToMatch = "<";
}

@RegisterAction
class MoveIClosingCaret extends MoveInsideCharacter {
  keys = ["i", ">"];
  charToMatch = "<";
}

@RegisterAction
class MoveACaret extends MoveInsideCharacter {
  keys = ["a", "<"];
  charToMatch = "<";
  includeSurrounding = true;
}

@RegisterAction
class MoveAClosingCaret extends MoveInsideCharacter {
  keys = ["a", ">"];
  charToMatch = "<";
  includeSurrounding = true;
}

@RegisterAction
class MoveISquareBracket extends MoveInsideCharacter {
  keys = ["i", "["];
  charToMatch = "[";
}

@RegisterAction
class MoveIClosingSquareBraket extends MoveInsideCharacter {
  keys = ["i", "]"];
  charToMatch = "[";
}

@RegisterAction
class MoveASquareBracket extends MoveInsideCharacter {
  keys = ["a", "["];
  charToMatch = "[";
  includeSurrounding = true;
}

@RegisterAction
class MoveAClosingSquareBracket extends MoveInsideCharacter {
  keys = ["a", "]"];
  charToMatch = "[";
  includeSurrounding = true;
}

abstract class MoveQuoteMatch extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualBlock];
  protected charToMatch: string;
  protected includeSurrounding = false;

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const text = TextEditor.getLineAt(position).text;
    const quoteMatcher = new QuoteMatcher(this.charToMatch, text);
    const start = quoteMatcher.findOpening(position.character);
    const end = quoteMatcher.findClosing(start + 1);

    if (start === -1 || end === -1 || end === start || end < position.character) {
      return {
        start: position,
        stop: position,
        failed: true
      };
    }

    let startPos = new Position(position.line, start);
    let endPos = new Position(position.line, end);

    if (!this.includeSurrounding) {
      startPos = startPos.getRight();
      endPos = endPos.getLeft();
    }

    if (position.isBefore(startPos)) {
      vimState.recordedState.operatorPositionDiff = startPos.subtract(position);
    }

    return {
      start: startPos,
      stop: endPos
    };
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<IMovement> {
    const res = await this.execAction(position, vimState);

    res.stop = res.stop.getRight();

    return res;
  }
}

@RegisterAction
class MoveInsideSingleQuotes extends MoveQuoteMatch {
  keys = ["i", "'"];
  charToMatch = "'";
  includeSurrounding = false;
}

@RegisterAction
class MoveASingleQuotes extends MoveQuoteMatch {
  keys = ["a", "'"];
  charToMatch = "'";
  includeSurrounding = true;
}

@RegisterAction
class MoveInsideDoubleQuotes extends MoveQuoteMatch {
  keys = ["i", "\""];
  charToMatch = "\"";
  includeSurrounding = false;
}

@RegisterAction
class MoveADoubleQuotes extends MoveQuoteMatch {
  keys = ["a", "\""];
  charToMatch = "\"";
  includeSurrounding = true;
}

@RegisterAction
class MoveInsideBacktick extends MoveQuoteMatch {
  keys = ["i", "`"];
  charToMatch = "`";
  includeSurrounding = false;
}

@RegisterAction
class MoveABacktick extends MoveQuoteMatch {
  keys = ["a", "`"];
  charToMatch = "`";
  includeSurrounding = true;
}

@RegisterAction
class MoveToUnclosedRoundBracketBackward extends MoveToMatchingBracket {
  keys = ["[", "("];

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const failure = { start: position, stop: position, failed: true };
    const charToMatch = ")";
    const result = PairMatcher.nextPairedChar(position.getLeftThroughLineBreaks(), charToMatch, false);

    if (!result) { return failure; }
    return result;
  }
}

@RegisterAction
class MoveToUnclosedRoundBracketForward extends MoveToMatchingBracket {
  keys = ["]", ")"];

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const failure = { start: position, stop: position, failed: true };
    const charToMatch = "(";
    const result = PairMatcher.nextPairedChar(position.getRightThroughLineBreaks(), charToMatch, false);

    if (!result) { return failure; }
    return result;
  }
}

@RegisterAction
class MoveToUnclosedCurlyBracketBackward extends MoveToMatchingBracket {
  keys = ["[", "{"];

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const failure = { start: position, stop: position, failed: true };
    const charToMatch = "}";
    const result = PairMatcher.nextPairedChar(position.getLeftThroughLineBreaks(), charToMatch, false);

    if (!result) { return failure; }
    return result;
  }
}

@RegisterAction
class MoveToUnclosedCurlyBracketForward extends MoveToMatchingBracket {
  keys = ["]", "}"];

  public async execAction(position: Position, vimState: VimState): Promise<Position | IMovement> {
    const failure = { start: position, stop: position, failed: true };
    const charToMatch = "{";
    const result = PairMatcher.nextPairedChar(position.getRightThroughLineBreaks(), charToMatch, false);

    if (!result) { return failure; }
    return result;
  }
}

@RegisterAction
class ToggleCaseOperator extends BaseOperator {
  public keys = ["~"];
  public modes = [ModeName.Visual, ModeName.VisualLine];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    const range = new vscode.Range(start, end.getRight());

    await ToggleCaseOperator.toggleCase(range);

    const cursorPosition = start.isBefore(end) ? start : end;
    vimState.cursorPosition = cursorPosition;
    vimState.cursorStartPosition = cursorPosition;
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }

  static async toggleCase(range: vscode.Range) {
    const text = TextEditor.getText(range);

    let newText = "";
    for (var i = 0; i < text.length; i++) {
      var char = text[i];
      // Try lower-case
      let toggled = char.toLocaleLowerCase();
      if (toggled === char) {
        // Try upper-case
        toggled = char.toLocaleUpperCase();
      }
      newText += toggled;
    }
    await TextEditor.replace(range, newText);
  }
}

@RegisterAction
class ToggleCaseVisualBlockOperator extends BaseOperator {
  public keys = ["~"];
  public modes = [ModeName.VisualBlock];

  public async run(vimState: VimState, startPos: Position, endPos: Position): Promise<VimState> {
    for (const { start, end } of Position.IterateLine(vimState)) {
      const range = new vscode.Range(start, end);
      await ToggleCaseOperator.toggleCase(range);
    }

    const cursorPosition = startPos.isBefore(endPos) ? startPos : endPos;
    vimState.cursorPosition = cursorPosition;
    vimState.cursorStartPosition = cursorPosition;
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class ToggleCaseWithMotion extends ToggleCaseOperator {
  public keys = ["g", "~"];
  public modes = [ModeName.Normal];
}

@RegisterAction
class ToggleCaseAndMoveForward extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["~"];
  canBeRepeatedWithDot = true;
  runsOnceForEachCountPrefix = true;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await new ToggleCaseOperator().run(vimState, vimState.cursorPosition, vimState.cursorPosition);

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

    for (let { start, end, word } of Position.IterateWords(position.getWordLeft(true))) {
      // '-' doesn't count as a word, but is important to include in parsing the number
      if (text[start.character - 1] === '-') {
        start = start.getLeft();
        word = text[start.character] + word;
      }
      // Strict number parsing so "1a" doesn't silently get converted to "1"
      const num = NumericString.parse(word);

      if (num !== null) {
        vimState.cursorPosition = await this.replaceNum(num, this.offset * (vimState.recordedState.count || 1), start, end);
        return vimState;
      }
    }
    // No usable numbers, return the original position
    return vimState;
  }

  public async replaceNum(start: NumericString, offset: number, startPos: Position, endPos: Position): Promise<Position> {
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
  keys = ["<C-a>"];
  offset = +1;
}

@RegisterAction
class DecrementNumberAction extends IncrementDecrementNumberAction {
  keys = ["<C-x>"];
  offset = -1;
}

abstract class MoveTagMatch extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualBlock];
  protected includeTag = false;

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    const text = TextEditor.getLineAt(position).text;
    const tagMatcher = new TagMatcher(text, position.character);
    const start = tagMatcher.findOpening(this.includeTag);
    const end = tagMatcher.findClosing(this.includeTag);

    if (start === undefined || end === undefined || end === start) {
      return {
        start: position,
        stop: position,
        failed: true
      };
    }

    let startPos = new Position(position.line, start);
    let endPos = new Position(position.line, end - 1);

    if (position.isBefore(startPos)) {
      vimState.recordedState.operatorPositionDiff = startPos.subtract(position);
    }

    return {
      start: startPos,
      stop: endPos
    };
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<IMovement> {
    const res = await this.execAction(position, vimState);

    res.stop = res.stop.getRight();

    return res;
  }
}

@RegisterAction
class MoveInsideTag extends MoveTagMatch {
  keys = ["i", "t"];
  includeTag = false;
}

@RegisterAction
class MoveAroundTag extends MoveTagMatch {
  keys = ["a", "t"];
  includeTag = true;
}

@RegisterAction
class ActionTriggerHover extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["g", "h"];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.showHover");

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
  keys = [
    ["<D-d>"],
    ["g", "c"]
  ];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand('editor.action.addSelectionToNextFindMatch');
    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();

    vimState.currentMode = ModeName.Visual;

    return vimState;
  }
}

@RegisterAction
class ActionOverrideCmdAltDown extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = [
    ["<D-alt+down>"], // OSX
    ["<C-alt+down>"], // Windows
  ];
  runsOnceForEveryCursor() { return false; }

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
    ["<D-alt+up>"], // OSX
    ["<C-alt+up>"], // Windows
  ];
  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand('editor.action.insertCursorAbove');
    vimState.allCursors = await allowVSCodeToPropagateCursorUpdatesAndReturnThem();

    return vimState;
  }
}