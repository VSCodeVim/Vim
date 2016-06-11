import { VimCommandActions, VimState } from './../mode/modeHandler';
import { ModeName } from './../mode/mode';
import { TextEditor } from './../textEditor';
import { Register, RegisterMode } from './../register/register';
import { Position } from './../motion/position';
import * as vscode from 'vscode';

const controlKeys: string[] = [
  "ctrl",
  "alt",
  "shift",
  "esc",
  "delete"
];

const containsControlKey = function(s: string): boolean {
  for (const controlKey of controlKeys) {
    if (s.indexOf(controlKey) !== -1) {
      return true;
    }
  }

  return false;
};

const compareKeypressSequence = function (one: string[], two: string[]): boolean {
  if (one.length !== two.length) {
    return false;
  }

  for (let i = 0, j = 0; i < one.length; i++, j++) {
    const left = one[i], right = two[j];

    if (left  === "<any>") { continue; }
    if (right === "<any>") { continue; }

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

  // It /so/ annoys me that I have to put this here.
  registerMode?: RegisterMode;
}

export function isIMovement(o: IMovement | Position): o is IMovement {
    return (o as IMovement).start !== undefined &&
           (o as IMovement).stop  !== undefined;
}

export class BaseAction {
  /**
   * Modes that this action can be run in.
   */
  public modes: ModeName[];

  /**
   * The sequence of keys you use to trigger the action.
   */
  public keys: string[];

  /**
   * Is this action valid in the current Vim state?
   */
  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) { return false; }
    if (!compareKeypressSequence(this.keys, keysPressed)) { return false; }
    // TODO - this is not exactly correct and will eventually make me rage
    // It's for cases like daw where a would otherwise by treated as append and insert.
    if (this instanceof BaseCommand &&
      !vimState.actionState.isInInitialState &&
      !(this instanceof CommandInsertInSearchMode)) { return false; }
    if (this instanceof BaseOperator && vimState.actionState.operator) { return false; }

    return true;
  }

  /**
   * Could the user be in the process of doing this action.
   */
  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) { return false; }
    if (!compareKeypressSequence(this.keys.slice(0, keysPressed.length), keysPressed)) { return false; }
    if (this instanceof BaseCommand &&
      !vimState.actionState.isInInitialState &&
      !(this instanceof CommandInsertInSearchMode)) { return false; }
    if (this instanceof BaseOperator && vimState.actionState.operator) { return false; }

    return true;
  }
}

/**
 * A movement is something like 'h', 'k', 'w', 'b', 'gg', etc.
 */
export abstract class BaseMovement extends BaseAction {
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
   * Run the movement.
   *
   * Generally returns a new Position. If necessary, it can return an IMovement instead.
   */
  public abstract async execAction(position: Position, vimState: VimState): Promise<Position | IMovement>;

  /**
   * Run the movement in an operator context. 99% of the time, this function can be
   * ignored, as it is exactly the same as the above function.
   */
  public async execActionForOperator(position: Position,  vimState: VimState): Promise<Position | IMovement> {
    return await this.execAction(position, vimState);
  }
}

/**
 * A command is something like <esc>, :, v, i, etc.
 */
export abstract class BaseCommand extends BaseAction {
  /**
   * Run the command.
   */
  public abstract async exec(position: Position, vimState: VimState): Promise<VimState>;
}

export class BaseOperator extends BaseAction {
    /**
     * Run this operator on a range, returning the new location of the cursor.
     */
    run(vimState: VimState, start: Position, stop: Position): Promise<VimState> { return; }
}

export enum KeypressState {
  WaitingOnKeys,
  NoPossibleMatch
}

export class Actions {

  /**
   * Every Vim action will be added here with the @RegisterAction decorator.
   */
  public static allActions: BaseMovement[] = [];

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

    for (const action of Actions.allActions) {
      if (action.doesActionApply(vimState, keysPressed)) {
        return action;
      }

      if (action.couldActionApply(vimState, keysPressed)) {
        couldPotentiallyHaveMatch = true;
      }
    }

    return couldPotentiallyHaveMatch ? KeypressState.WaitingOnKeys : KeypressState.NoPossibleMatch;
  }
}

export function RegisterAction(action) {
  Actions.allActions.push(new action());
}





// begin actions











@RegisterAction
class CommandInsertAtCursor extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["i"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;

    return vimState;
  }
}

@RegisterAction
class CommandInsertInSearchMode extends BaseCommand {
  modes = [ModeName.SearchInProgressMode];
  keys = ["<any>"];

  public static GetNextSearchMatch(startPosition: Position, searchString: string): Position {
    for (let line = startPosition.line; line < TextEditor.getLineCount(); line++) {
      const text = TextEditor.getLineAt(new Position(line, 0)).text;

      // TODO: Do better implementation!!!
      for (let char = (line === startPosition.line ? startPosition.character + 1 : 0); char < text.length; char++) {
        const index = text.indexOf(searchString, char);

        if (index > -1) {
          return new Position(line, index);
        }
      }
    }

    return undefined;
  }

  public static GetPreviousSearchMatch(startPosition: Position, searchString: string): Position {
    for (let line = startPosition.line; line >= 0; line--) {
      const text = TextEditor.getLineAt(new Position(line, 0)).text;

      // TODO: Do better implementation!!!
      for (let char = (line === startPosition.line ? startPosition.character - 1 : text.length - 1); char >= 0; char--) {
        const index = text.lastIndexOf(searchString, char);

        if (index > -1) {
          return new Position(line, index);
        }
      }
    }

    return undefined;
  }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const key = vimState.actionState.actionKeys[0];

    // handle special keys first
    if (key === "<backspace>") {
      vimState.searchString = vimState.searchString.slice(0, -1);
    } else if (key === "<enter>") {
      vimState.currentMode = ModeName.Normal;

      if (vimState.nextSearchMatchPosition) {
        vimState.cursorPosition = vimState.nextSearchMatchPosition;
      } else {
        vimState.cursorPosition = vimState.searchCursorStartPosition;
      }

      return vimState;
    } else if (key === "<esc>") {
      vimState.currentMode = ModeName.Normal;
      vimState.searchString = "";
      vimState.nextSearchMatchPosition = undefined;
      vimState.cursorPosition = vimState.searchCursorStartPosition;

      return vimState;
    } else {
      vimState.searchString += vimState.actionState.actionKeys[0];
    }

    // console.log(vimState.searchString); (TODO: Show somewhere!)
    vimState.nextSearchMatchPosition = undefined;

    const startPosition = vimState.searchCursorStartPosition;

    if (vimState.searchDirection === 1) {
      vimState.nextSearchMatchPosition = CommandInsertInSearchMode.GetNextSearchMatch(
        startPosition,
        vimState.searchString);
    } else {
      vimState.nextSearchMatchPosition = CommandInsertInSearchMode.GetPreviousSearchMatch(
        startPosition,
        vimState.searchString);
    }

    if (vimState.nextSearchMatchPosition) {
      vimState.cursorPosition = vimState.nextSearchMatchPosition;
    } else {
      vimState.cursorPosition = vimState.searchCursorStartPosition;
    }

    return vimState;
  }
}

@RegisterAction
class CommandNextSearchMatch extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["n"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (vimState.searchString === "") {
      return position;
    }

    let nextPosition: Position;

    if (vimState.searchDirection === 1) {
      nextPosition = CommandInsertInSearchMode.GetNextSearchMatch(
        position, vimState.searchString);
    } else {
      nextPosition = CommandInsertInSearchMode.GetPreviousSearchMatch(
        position, vimState.searchString);
    }

    if (!nextPosition) {
      // TODO(bell)

      return position;
    }

    return nextPosition;
  }
}


@RegisterAction
class CommandPreviousSearchMatch extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["N"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (vimState.searchString === "") {
      return position;
    }

    let prevPosition: Position;

    if (vimState.searchDirection === -1) {
      prevPosition = CommandInsertInSearchMode.GetNextSearchMatch(
        position, vimState.searchString);
    } else {
      prevPosition = CommandInsertInSearchMode.GetPreviousSearchMatch(
        position, vimState.searchString);
    }

    if (!prevPosition) {
      // TODO(bell)

      return position;
    }

    vimState.cursorPosition = prevPosition;
    return position;
  }
}

@RegisterAction
class CommandInsertInInsertMode extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<character>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const char = vimState.actionState.actionKeys[0];

    if (char === "<enter>") {
      await TextEditor.insert("\n");
    } else if (char === "<backspace>") {
      await TextEditor.delete(new vscode.Range(position, position.getLeft()));
    } else {
      await TextEditor.insert(char);
    }

    vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);

    return vimState;
  }
}

@RegisterAction
class CommandSearchForwards extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["/"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.searchString = "";
    vimState.searchDirection = 1;
    vimState.searchCursorStartPosition = position;
    vimState.nextSearchMatchPosition = undefined;
    vimState.currentMode = ModeName.SearchInProgressMode;
    vimState.actionState.actionKeys = [];

    return vimState;
  }
}


@RegisterAction
class CommandSearchBackward extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["?"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.searchString = "";
    vimState.searchDirection = -1;
    vimState.searchCursorStartPosition = position;
    vimState.nextSearchMatchPosition = undefined;
    vimState.currentMode = ModeName.SearchInProgressMode;
    vimState.actionState.actionKeys = [];

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
    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
        if (start.compareTo(end) <= 0) {
          end = new Position(end.line, end.character + 1);
        } else {
          const tmp = start;
          start = end;
          end = tmp;

          end = new Position(end.line, end.character + 1);
        }

        // Vim does this weird thing where it allows you to select and delete
        // the newline character, which it places 1 past the last character
        // in the line. Here we interpret a character position 1 past the end
        // as selecting the newline character.
        if (end.character === TextEditor.getLineAt(end).text.length + 1) {
          end = end.getDown(0);
        }

        // If we do dd on the final line of the document, we expect the line
        // to be removed. This is actually a special case because the newline
        // character we've selected to delete is the newline on the end of the document,
        // but we actually delete the newline on the second to last line.

        // Just writing about this is making me more confused. -_-
        if (start.line === end.line && start.line !== 0 && vimState.currentRegisterMode === RegisterMode.LineWise) {
          start = start.getPreviousLineBegin().getLineEnd();
        }

        const text = vscode.window.activeTextEditor.document.getText(new vscode.Range(start, end));
        Register.put(text, vimState);

        await TextEditor.delete(new vscode.Range(start, end));

        if (vimState.currentMode === ModeName.Visual) {
          vimState.cursorPosition = Position.EarlierOf(start, end);
        }

        if (start.character >= TextEditor.getLineAt(start).text.length) {
          vimState.cursorPosition = start.getLeft();
        } else {
          vimState.cursorPosition = start;
        }

        vimState.currentMode = ModeName.Normal;

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

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
        if (start.compareTo(end) <= 0) {
          end = new Position(end.line, end.character + 1);
        } else {
          const tmp = start;
          start = end;
          end = tmp;

          end = new Position(end.line, end.character + 1);
        }

        let text = TextEditor.getText(new vscode.Range(start, end));

        // If we selected the newline character, add it as well.
        if (vimState.currentMode === ModeName.Visual &&
            end.character === TextEditor.getLineAt(end).text.length + 1) {
          text = text + "\n";
        }

        Register.put(text, vimState);

        vimState.currentMode = ModeName.Normal;
        vimState.cursorPosition = start;
        return vimState;
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
export class ChangeOperator extends BaseOperator {
    public keys = ["c"];
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
        const state = await new DeleteOperator().run(vimState, start, end);
        state.currentMode = ModeName.Insert;

        return state;
    }
}

@RegisterAction
export class PutCommand extends BaseCommand {
    public keys = ["p"];
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    public async exec(position: Position, vimState: VimState, before: boolean = false): Promise<VimState> {
        const register = Register.get(vimState);
        const text = register.text;
        const dest = before ? position : position.getRight();

        if (register.registerMode === RegisterMode.CharacterWise) {
          await TextEditor.insertAt(text, dest);
        } else {
          if (before) {
            await TextEditor.insertAt(text + "\n", dest.getLineBegin());
          } else {
            await TextEditor.insertAt("\n" + text, dest.getLineEnd());
          }
        }

        // More vim weirdness: If the thing you're pasting has a newline, the cursor
        // stays in the same place. Otherwise, it moves to the end of what you pasted.

        if (register.registerMode === RegisterMode.LineWise) {
          vimState.cursorPosition = new Position(dest.line + 1, 0);
        } else {
          if (text.indexOf("\n") === -1) {
            vimState.cursorPosition = new Position(dest.line, dest.character + text.length - 1);
          } else {
            vimState.cursorPosition = dest;
          }
        }

        return vimState;
    }
}

@RegisterAction
class IndentOperator extends BaseOperator {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = [">"];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.indentLines");
    vimState.currentMode  = ModeName.Normal;
    vimState.cursorPosition = vimState.cursorStartPosition;

    return vimState;
  }
}

@RegisterAction
class OutdentOperator extends BaseOperator {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["<"];

  public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
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
        return await new PutCommand().exec(position, vimState, true);
    }
}

@RegisterAction
class CommandShowCommandLine extends BaseCommand {
  modes = [ModeName.Normal];
  keys = [":"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.ShowCommandLine;

    return vimState;
  }
}

@RegisterAction
class CommandDot extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["."];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Dot;

    return vimState;
  }
}

@RegisterAction
class CommandFold extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  keys = ["z", "c"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Fold;

    return vimState;
  }
}

@RegisterAction
class CommandCenterScroll extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["z", "z"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.ScrollCursorToCenter;

    return vimState;
  }
}

@RegisterAction
class CommandUnfold extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["z", "o"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Unfold;

    return vimState;
  }
}

@RegisterAction
class CommandFoldAll extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["z", "C"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.FoldAll;

    return vimState;
  }
}

@RegisterAction
class CommandUnfoldAll extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["z", "O"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.UnfoldAll;

    return vimState;
  }
}

@RegisterAction
class CommandUndo extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["u"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Undo;

    return vimState;
  }
}

@RegisterAction
class CommandRedo extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["ctrl+r"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Redo;

    return vimState;
  }
}

@RegisterAction
class CommandMoveFullPageDown extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["ctrl+f"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.MoveFullPageDown;

    return vimState;
  }
}


@RegisterAction
class CommandMoveFullPageUp extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["ctrl+b"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.MoveFullPageUp;

    return vimState;
  }
}

@RegisterAction
class CommandEsc extends BaseCommand {
  modes = [ModeName.Insert, ModeName.Visual, ModeName.VisualLine];
  keys = ["<esc>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.currentMode !== ModeName.Visual &&
        vimState.currentMode !== ModeName.VisualLine) {
      vimState.cursorPosition = position.getLeft();
    }

    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandDeleteToLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["D"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(vimState, position, position.getLineEnd().getLeft());
  }
}

@RegisterAction
class CommandChangeToLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["C"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const state = await new DeleteOperator().run(vimState, position, position.getLineEnd());
    state.cursorPosition = state.cursorPosition.getRight();
    state.currentMode = ModeName.Insert;

    return state;
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
class CommandVisualLineMode extends BaseCommand {
  modes = [ModeName.Normal];
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
class CommandOpenSquareBracket extends BaseCommand {
  modes = [ModeName.Insert, ModeName.Visual, ModeName.VisualLine];
  keys = ["<ctrl-[>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

// begin insert commands

@RegisterAction
class CommandInsertAtLineBegin extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["I"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getLineBegin();

    return vimState;
  }
}

@RegisterAction
class CommandInsertAfterCursor extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["a"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getRight();

    return vimState;
  }
}

@RegisterAction
class CommandInsertAtLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["A"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const pos = new Position(position.line,
                position.getLineEnd().character + 1);

    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = pos;

    return vimState;
  }
}

@RegisterAction
class CommandInsertNewLineAbove extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["O"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.insertLineBefore");

    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = new Position(position.line, TextEditor.getLineAt(position).text.length);
    return vimState;
  }
}

@RegisterAction
class CommandInsertNewLineBefore extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["o"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.insertLineAfter");

    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = new Position(
      position.line + 1,
      TextEditor.getLineAt(new Position(position.line + 1, 0)).text.length);

    return vimState;
  }
}

@RegisterAction
class MoveLeft extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["h"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLeft();
  }
}

@RegisterAction
class MoveUp extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["k"];
  doesntChangeDesiredColumn = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getUp(vimState.desiredColumn);
  }
}

@RegisterAction
class MoveDown extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["j"];
  doesntChangeDesiredColumn = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getDown(vimState.desiredColumn);
  }
}

@RegisterAction
class MoveRight extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["l"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return new Position(position.line, position.character + 1);
  }
}

@RegisterAction
class MoveFindForward extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["f", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const toFind = vimState.actionState.actionKeys[1];

    return position.findForwards(toFind);
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    const pos = await this.execAction(position, vimState);
    return pos.getRight();
  }
}

@RegisterAction
class MoveFindBackward extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["F", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const toFind = vimState.actionState.actionKeys[1];

    return position.findBackwards(toFind);
  }
}


@RegisterAction
class MoveTilForward extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["t", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const toFind = vimState.actionState.actionKeys[1];

    return position.tilForwards(toFind);
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<Position> {
    return (await this.execAction(position, vimState)).getRight();
  }
}

@RegisterAction
class MoveTilBackward extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["T", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    const toFind = vimState.actionState.actionKeys[1];

    return position.tilBackwards(toFind);
  }
}

@RegisterAction
class MoveLineEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["$"];
  setsDesiredColumnToEOL = true;

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLineEnd();
  }
}

@RegisterAction
class MoveLineBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["0"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLineBegin();
  }
}

@RegisterAction
class MoveNonBlank extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["^"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getFirstLineNonBlankChar();
  }
}

@RegisterAction
class MoveNonBlankFirst extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["g", "g"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getDocumentStart();
  }
}

@RegisterAction
class MoveNonBlankLast extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["G"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getDocumentEnd();
  }
}

@RegisterAction
export class MoveWordBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["w"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (vimState.actionState.operator instanceof ChangeOperator) {

      /*
      From the Vim manual:

      Special case: "cw" and "cW" are treated like "ce" and "cE" if the cursor is
      on a non-blank.  This is because "cw" is interpreted as change-word, and a
      word does not include the following white space.
      */
      return position.getCurrentWordEnd().getRight();
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

    if (result.isLineBeginning()) {
        return result.getLeftThroughLineBreaks();
    }

    if (result.isLineEnd()) {
        return new Position(result.line, result.character + 1);
    }

    return result;
  }
}

@RegisterAction
class MoveFullWordBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["W"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    if (vimState.actionState.operator instanceof ChangeOperator) {

      // See note for w
      return position.getCurrentBigWordEnd().getRight();
    } else {
      return position.getBigWordRight();
    }
  }
}

@RegisterAction
class MoveWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["e"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentWordEnd();
  }

  public async execActionForOperator(position: Position,
                                     vimState: VimState): Promise<Position> {
    let end = position.getCurrentWordEnd();

    return new Position(end.line, end.character + 1);
  }
}

@RegisterAction
class MoveFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["E"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentBigWordEnd();
  }
}

@RegisterAction
class MoveLastWordEnd  extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["g", "e"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLastWordEnd();
  }
}

@RegisterAction
class MoveLastFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["g", "E"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getLastBigWordEnd();
  }
}

@RegisterAction
class MoveBeginningWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["b"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getWordLeft();
  }
}

@RegisterAction
class MoveBeginningFullWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["B"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getBigWordLeft();
  }
}

@RegisterAction
class MoveParagraphEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["}"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentParagraphEnd();
  }
}

@RegisterAction
class MoveParagraphBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["{"];

  public async execAction(position: Position, vimState: VimState): Promise<Position> {
    return position.getCurrentParagraphBeginning();
  }
}

@RegisterAction
class ActionDeleteChar extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["x"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const state = await new DeleteOperator().run(vimState, position, position);

    state.currentMode = ModeName.Normal;

    return state;
  }
}

@RegisterAction
class ActionDeleteLastChar extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["X"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(vimState, position.getLeft(), position.getLeft());
  }
}

@RegisterAction
class ActionJoin extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["J"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    if (position.line === TextEditor.getLineCount() - 1) {
      return vimState; // TODO: bell
    }

    // TODO(whitespace): need a better way to check for whitespace
    const char = TextEditor.getLineAt(position.getNextLineBegin()).text[0];
    const lastCharCurrentLine = TextEditor.getLineAt(position).text[TextEditor.getLineAt(position).text.length - 1];
    const startsWithWhitespace =
      " \t".indexOf(char) !== -1;
    const dontAddSpace =
      (" \t()".indexOf(char) !== -1) || (" \t".indexOf(lastCharCurrentLine) !== -1);

    const positionToDeleteTo =
      startsWithWhitespace ?
        position.getNextLineBegin().getFirstLineNonBlankChar().getLeft().getLeft() :
        position.getLineEnd();

    if (!dontAddSpace) {
      await TextEditor.insertAt(" ", position.getNextLineBegin());
    }

    return await new DeleteOperator().run(
      vimState,
      position.getLineEnd(),
      positionToDeleteTo
    );
  }
}

@RegisterAction
class ActionReplaceCharacter extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["r", "<character>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const toReplace = vimState.actionState.actionKeys[1];
    const state = await new DeleteOperator().run(vimState, position, position);

    await TextEditor.insertAt(toReplace, position);

    state.cursorPosition = position;

    return state;
  }
}

// DOUBLE MOTIONS
// (dd yy cc << >>)
// These work because there is a check in does/couldActionApply where
// you can't run an operator if you already have one going (which is logical).

@RegisterAction
class MoveDD extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["d"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    return {
      start       : position.getLineBegin(),
      stop        : position.getLineEndIncludingEOL(),
      registerMode: RegisterMode.LineWise,
    };
  }
}

@RegisterAction
class MoveYY extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["y"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    return {
      start       : position.getLineBegin(),
      stop        : position.getLineEndIncludingEOL(),
      registerMode: RegisterMode.LineWise,
    };
  }
}

@RegisterAction
class MoveCC extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["c"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    return {
      start       : position.getLineBegin(),
      stop        : position.getLineEnd(),
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

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const state = await new ChangeOperator().run(vimState, position, position);

    state.currentMode = ModeName.Insert;

    return state;
  }
}

@RegisterAction
class MovementAWordTextObject extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ["a", "w"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      // TODO: This is kind of a bad way to do this, but text objects only work in
      // visual mode if you JUST entered visual mode
      // TODO TODO: I just looked at this again and omg this is awful what was I smoking plz get rid of this asap
      return {
        start: vimState.searchCursorStartPosition,
        stop: await new MoveWordBegin().execAction(position, vimState),
      };
    }

    const currentChar = TextEditor.getLineAt(position).text[position.character];

    // TODO(whitespace) - this is a bad way to do this. we need some sort of global
    // white space checking function.
    if (currentChar === ' ' || currentChar === '\t') {
      return {
        start: position.getLastWordEnd().getRight(),
        stop: position.getCurrentWordEnd()
      };
    } else {
      return {
        start: position.getWordLeft(true),
        stop: position.getWordRight().getLeft()
      };
    }
  }


  public async execActionForOperator(position: Position, vimState: VimState): Promise<IMovement> {
    const res = await this.execAction(position, vimState);

    res.stop = res.stop.getRight();

    return res;
  }
}

@RegisterAction
class MovementIWordTextObject extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ["i", "w"];

  public async execAction(position: Position, vimState: VimState): Promise<IMovement> {
    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      // TODO: This is kind of a bad way to do this, but text objects only work in
      // visual mode if you JUST entered visual mode
      return {
        start: vimState.searchCursorStartPosition,
        stop: await new MoveWordBegin().execAction(position, vimState),
      };
    }

    const currentChar = TextEditor.getLineAt(position).text[position.character];

    // TODO(whitespace)  - this is a bad way to do this. we need some sort of global
    // white space checking function.
    if (currentChar === ' ' || currentChar === '\t') {
      return {
        start: position.getLastWordEnd().getRight(),
        stop:  position.getWordRight().getLeft()
      };
    } else {
      return {
        start: position.getWordLeft(true),
        stop: position.getCurrentWordEnd(true),
      };
    }
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<IMovement> {
    const res = await this.execAction(position, vimState);

    res.stop = res.stop.getRight();

    return res;
  }
}

/*
// Doing this correctly is very difficult.
   https://github.com/Microsoft/vscode/issues/7177

@RegisterAction
class MoveToMatchingBracket extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = ["%"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {

    vscode.window.activeTextEditor.setDecorations

     await vscode.commands.executeCommand("editor.action.jumpToBracket");
     await vscode.commands.executeCommand("editor.action.jumpToBracket");


    vimState.cursorPosition = position.getLineEnd();

    return vimState;
  }
}
*/
