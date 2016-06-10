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
  "enter",
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

  for (let i = 0; i < one.length; i++) {
    if (one[i] === "<any>" || two[i] === "<any>") { continue; }
    if (one[i] === "<character>" && !containsControlKey(two[i])) { continue; }
    if (two[i] === "<character>" && !containsControlKey(one[i])) { continue; }
    if (one[i] !== two[i]) { return false; }
  }

  return true;
};

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
    if (this instanceof BaseCommand && !vimState.actionState.isInInitialState) { return false; }
    if (this instanceof BaseOperator && vimState.actionState.operator) { return false; }

    return true;
  }

  /**
   * Could the user be in the process of doing this action.
   */
  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) { return false; }
    if (!compareKeypressSequence(this.keys.slice(0, keysPressed.length), keysPressed)) { return false; }
    if (this instanceof BaseCommand && !vimState.actionState.isInInitialState) { return false; }
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
   */
  public abstract async execAction(position: Position, vimState: VimState): Promise<VimState>;

  /**
   * Run the action in an operator context. 99% of the time, this function can be
   * ignored, as it is exactly the same as the above function. (But pay attention
   * to e!)
   */
  public async execActionForOperator(position: Position,  vimState: VimState): Promise<VimState> {
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
class CommandInsertInInsertMode extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<character>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await TextEditor.insert(vimState.actionState.actionKeys[0]);

    vimState.cursorStartPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);
    vimState.cursorPosition = Position.FromVSCodePosition(vscode.window.activeTextEditor.selection.start);

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
class CommandFind extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["/"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Find;

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
    return await new DeleteOperator().run(vimState, position, position.getLineEnd());
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
class CommandInsertAtCursor extends BaseCommand {
  modes = [ModeName.Normal];
  keys = ["i"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;

    return vimState;
  }
}

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

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLeft();

    return vimState;
  }
}

@RegisterAction
class MoveUp extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["k"];
  doesntChangeDesiredColumn = true;

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getUp(vimState.desiredColumn);

    return vimState;
  }
}

@RegisterAction
class MoveDown extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["j"];
  doesntChangeDesiredColumn = true;

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getDown(vimState.desiredColumn);

    return vimState;
  }
}

@RegisterAction
class MoveRight extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["l"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = new Position(position.line, position.character + 1);

    return vimState;
  }
}

@RegisterAction
class MoveFindForward extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["f", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    const toFind = vimState.actionState.actionKeys[1];

    vimState.cursorPosition = position.findForwards(toFind);

    return vimState;
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<VimState> {
    const state = await this.execAction(position, vimState);
    state.cursorPosition = state.cursorPosition.getRight();

    return state;
  }
}

@RegisterAction
class MoveFindBackward extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["F", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    const toFind = vimState.actionState.actionKeys[1];

    vimState.cursorPosition = position.findBackwards(toFind);

    return vimState;
  }
}


@RegisterAction
class MoveTilForward extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["t", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    const toFind = vimState.actionState.actionKeys[1];

    vimState.cursorPosition = position.tilForwards(toFind);

    return vimState;
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<VimState> {
    const state = await this.execAction(position, vimState);
    state.cursorPosition = state.cursorPosition.getRight();

    return state;
  }
}

@RegisterAction
class MoveTilBackward extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["T", "<character>"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    const toFind = vimState.actionState.actionKeys[1];

    vimState.cursorPosition = position.tilBackwards(toFind);

    return vimState;
  }
}

@RegisterAction
class MoveLineEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["$"];
  setsDesiredColumnToEOL = true;

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLineEnd();

    return vimState;
  }
}

@RegisterAction
class MoveLineBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["0"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLineBegin();
    return vimState;
  }
}

@RegisterAction
class MoveNonBlank extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["^"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getFirstLineNonBlankChar();
    return vimState;
  }
}

@RegisterAction
class MoveNonBlankFirst extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["g", "g"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getDocumentStart();
    return vimState;
  }
}

@RegisterAction
class MoveNonBlankLast extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["G"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getDocumentEnd();
    return vimState;
  }
}

@RegisterAction
export class MoveWordBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["w"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.actionState.operator instanceof ChangeOperator) {

      /*
        From the Vim manual:

        Special case: "cw" and "cW" are treated like "ce" and "cE" if the cursor is
        on a non-blank.  This is because "cw" is interpreted as change-word, and a
        word does not include the following white space.
      */
      vimState.cursorPosition = position.getCurrentWordEnd().getRight();
    } else {
      vimState.cursorPosition = position.getWordRight();
    }

    return vimState;
  }

  public async execActionForOperator(position: Position, vimState: VimState): Promise<VimState> {
    const result = await this.execAction(position, vimState);

      /*
          From the Vim documentation:

          Another special case: When using the "w" motion in combination with an
          operator and the last word moved over is at the end of a line, the end of
          that word becomes the end of the operated text, not the first word in the
          next line.

          TODO - move this into actions.ts, add test.
      */

      if (result.cursorPosition.isLineBeginning()) {
          result.cursorPosition = result.cursorPosition.getLeftThroughLineBreaks();
      }

      if (result.cursorPosition.isLineEnd()) {
          result.cursorPosition = new Position(result.cursorPosition.line, result.cursorPosition.character + 1);
      }

    return vimState;
  }

}

@RegisterAction
class MoveFullWordBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["W"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.actionState.operator instanceof ChangeOperator) {

      // See note for w
      vimState.cursorPosition = position.getCurrentBigWordEnd().getRight();
    } else {
      vimState.cursorPosition = position.getBigWordRight();
    }

    return vimState;
  }
}

@RegisterAction
class MoveWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["e"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentWordEnd();
    return vimState;
  }

  public async execActionForOperator(position: Position,
                                     vimState: VimState): Promise<VimState> {
    let end = position.getCurrentWordEnd();

    vimState.cursorPosition = new Position(end.line, end.character + 1);
    return vimState;
  }
}

@RegisterAction
class MoveFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["E"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentBigWordEnd();
    return vimState;
  }
}

@RegisterAction
class MoveLastWordEnd  extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["g", "e"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLastWordEnd();
    return vimState;
  }
}

@RegisterAction
class MoveLastFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["g", "E"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLastBigWordEnd();
    return vimState;
  }
}

@RegisterAction
class MoveBeginningWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["b"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getWordLeft();
    return vimState;
  }
}

@RegisterAction
class MoveBeginningFullWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["B"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getBigWordLeft();
    return vimState;
  }
}

@RegisterAction
class MoveParagraphEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["}"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentParagraphEnd();
    return vimState;
  }
}

@RegisterAction
class MoveParagraphBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  keys = ["{"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentParagraphBeginning();
    return vimState;
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

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    let start = position.getLineBegin();
    let stop  = position.getLineEndIncludingEOL();

    vimState.cursorStartPosition = start;
    vimState.cursorPosition = stop;
    vimState.currentRegisterMode = RegisterMode.LineWise;

    return vimState;
  }
}

@RegisterAction
class MoveYY extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["y"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorStartPosition = position.getLineBegin();
    vimState.cursorPosition = position.getLineEnd();
    vimState.currentRegisterMode = RegisterMode.LineWise;

    return vimState;
  }
}

@RegisterAction
class MoveCC extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["c"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorStartPosition = position.getLineBegin();
    vimState.cursorPosition = position.getLineEnd();

    return vimState;
  }
}

@RegisterAction
class MoveIndent extends BaseMovement {
  modes = [ModeName.Normal];
  keys = [">"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    let start = position.getLineBegin();
    let stop  = position.getLineEndIncludingEOL();

    vimState.cursorStartPosition = start;
    vimState.cursorPosition = stop;
    vimState.currentRegisterMode = RegisterMode.LineWise;

    return vimState;
  }
}

@RegisterAction
class MoveOutdent extends BaseMovement {
  modes = [ModeName.Normal];
  keys = ["<"];

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    let start = position.getLineBegin();
    let stop  = position.getLineEndIncludingEOL();

    vimState.cursorStartPosition = start;
    vimState.cursorPosition = stop;
    vimState.currentRegisterMode = RegisterMode.LineWise;

    return vimState;
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

  public async execActionForOperator(position: Position, vimState: VimState): Promise<VimState> {
    const res = await this.execAction(position, vimState);

    res.cursorPosition = res.cursorPosition.getRight();

    return res;
  }

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      // TODO: This is kind of a bad way to do this, but text objects only work in
      // visual mode if you JUST entered visual mode
      return new MoveWordBegin().execAction(position, vimState);
    }

    const currentChar = TextEditor.getLineAt(position).text[position.character];

    // TODO(whitespace) - this is a bad way to do this. we need some sort of global
    // white space checking function.
    if (currentChar === ' ' || currentChar === '\t') {
      vimState.cursorStartPosition = position.getLastWordEnd().getRight();
      vimState.cursorPosition = position.getCurrentWordEnd();
    } else {
      vimState.cursorStartPosition = position.getWordLeft(true);
      vimState.cursorPosition = position.getWordRight().getLeft();
    }

    return vimState;
  }
}

@RegisterAction
class MovementIWordTextObject extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual];
  keys = ["i", "w"];

  public async execActionForOperator(position: Position, vimState: VimState): Promise<VimState> {
    const res = await this.execAction(position, vimState);

    res.cursorPosition = res.cursorPosition.getRight();

    return res;
  }

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.currentMode === ModeName.Visual && !vimState.cursorPosition.isEqual(vimState.cursorStartPosition)) {
      // TODO: This is kind of a bad way to do this, but text objects only work in
      // visual mode if you JUST entered visual mode
      return new MoveWordBegin().execAction(position, vimState);
    }

    const currentChar = TextEditor.getLineAt(position).text[position.character];

    // TODO(whitespace)  - this is a bad way to do this. we need some sort of global
    // white space checking function.
    if (currentChar === ' ' || currentChar === '\t') {
      vimState.cursorStartPosition = position.getLastWordEnd().getRight();
      vimState.cursorPosition = position.getWordRight().getLeft();
    } else {
      vimState.cursorStartPosition = position.getWordLeft(true);
      vimState.cursorPosition = position.getCurrentWordEnd(true);
    }

    return vimState;
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