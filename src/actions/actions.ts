import { VimCommandActions, VimState } from './../mode/modeHandler';
import { ModeName } from './../mode/mode';
import { TextEditor } from './../textEditor';
import { Register, RegisterMode } from './../register/register';
import { Position } from './../motion/position';
import * as vscode from 'vscode';

export class BaseAction {
  /**
   * Modes that this action can be run in.
   */
  public modes: ModeName[];

  /**
   * The key you press to trigger the action.
   */
  public key: string;

  /**
   * Is this action valid in the current Vim state?
   */
  public doesActionApply(vimState: VimState, key: string): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) { return false; }
    if (this.key !== key) { return false; }
    // TODO - this is not exactly correct and will eventually make me rage
    // It's for cases like daw where a would otherwise by treated as append and insert.
    if (this instanceof BaseCommand && !vimState.actionState.isInInitialState) { return false; }
    if (this instanceof BaseOperator && vimState.actionState.operator) { return false; }

    return true;
  }

  /**
   * Could the user be in the process of doing this action.
   */
  public couldActionApply(vimState: VimState, key: string): boolean {
    if (this.modes.indexOf(vimState.currentMode) === -1) { return false; }
    if (!this.key.startsWith(key)) { return false; }
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
  public static getRelevantAction(keysPressed: string, vimState: VimState): BaseAction | KeypressState {
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


@RegisterAction
export class DeleteOperator extends BaseOperator {
    public key = "d";
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
        // in the line. Doing this joins the two lines around the newline.
        if (end.character === TextEditor.getLineAt(end).text.length + 1) {
          end = end.getDown(0);
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
export class YankOperator extends BaseOperator {
    public key = "y";
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    /**
     * Run this operator on a range.
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
    public key = "x";
    public modes = [ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
      return await new DeleteOperator().run(vimState, start, end);
    }
}

@RegisterAction
export class ChangeOperator extends BaseOperator {
    public key = "c";
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    public async run(vimState: VimState, start: Position, end: Position): Promise<VimState> {
        const state = await new DeleteOperator().run(vimState, start, end);
        state.currentMode = ModeName.Insert;

        return state;
    }
}

@RegisterAction
export class PutCommand extends BaseCommand {
    public key = "p";
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    /**
     * Run this operator on a range.
     */
    public async exec(position: Position, vimState: VimState): Promise<VimState> {
        const register = Register.get(vimState);
        const text = register.text;
        const dest = position.getRight();

        if (register.registerMode === RegisterMode.CharacterWise) {
          await TextEditor.insertAt(text, dest);
        } else {
          await TextEditor.insertAt("\n" + text, dest.getLineEnd());
        }

        // More vim weirdness: If the thing you're pasting has a newline, the cursor
        // stays in the same place. Otherwise, it moves to the end of what you pasted.

        if (register.registerMode === RegisterMode.LineWise) {
          vimState.cursorPosition = new Position(dest.line + 1, 0);
        } else {
          if (text.indexOf("\n") === -1) {
            vimState.cursorPosition = new Position(dest.line, dest.character + text.length);
          } else {
            vimState.cursorPosition = dest;
          }
        }

        return vimState;
    }
}

@RegisterAction
class CommandShowCommandLine extends BaseCommand {
  modes = [ModeName.Normal];
  key = ":";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.ShowCommandLine;

    return vimState;
  }
}

@RegisterAction
class CommandFind extends BaseCommand {
  modes = [ModeName.Normal];
  key = "/";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Find;

    return vimState;
  }
}

@RegisterAction
class CommandFold extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  key = "zc";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Fold;

    return vimState;
  }
}

@RegisterAction
class CommandUnfold extends BaseCommand {
  modes = [ModeName.Normal];
  key = "zo";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Unfold;

    return vimState;
  }
}

@RegisterAction
class CommandFoldAll extends BaseCommand {
  modes = [ModeName.Normal];
  key = "zC";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.FoldAll;

    return vimState;
  }
}

@RegisterAction
class CommandUnfoldAll extends BaseCommand {
  modes = [ModeName.Normal];
  key = "zO";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.UnfoldAll;

    return vimState;
  }
}

@RegisterAction
class CommandUndo extends BaseCommand {
  modes = [ModeName.Normal];
  key = "u";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Undo;

    return vimState;
  }
}

@RegisterAction
class CommandRedo extends BaseCommand {
  modes = [ModeName.Normal];
  key = "ctrl+r";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.Redo;

    return vimState;
  }
}

@RegisterAction
class CommandMoveFullPageDown extends BaseCommand {
  modes = [ModeName.Normal];
  key = "ctrl+f";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.MoveFullPageDown;

    return vimState;
  }
}


@RegisterAction
class CommandMoveFullPageUp extends BaseCommand {
  modes = [ModeName.Normal];
  key = "ctrl+b";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.commandAction = VimCommandActions.MoveFullPageUp;

    return vimState;
  }
}

@RegisterAction
class CommandEsc extends BaseCommand {
  modes = [ModeName.Insert, ModeName.Visual, ModeName.VisualLine];
  key = "<esc>";

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
  key = "D";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(vimState, position, position.getLineEnd());
  }
}

@RegisterAction
class CommandChangeToLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  key = "C";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const state = await new DeleteOperator().run(vimState, position, position.getLineEnd());
    state.currentMode = ModeName.Insert;

    return state;
  }
}

@RegisterAction
class CommandExitVisualMode extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  key = "v";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandVisualMode extends BaseCommand {
  modes = [ModeName.Normal];
  key = "v";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Visual;

    return vimState;
  }
}

@RegisterAction
class CommandVisualLineMode extends BaseCommand {
  modes = [ModeName.Normal];
  key = "V";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.VisualLine;

    return vimState;
  }
}

@RegisterAction
class CommandExitVisualLineMode extends BaseCommand {
  modes = [ModeName.VisualLine];
  key = "V";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

@RegisterAction
class CommandOpenSquareBracket extends BaseCommand {
  modes = [ModeName.Insert, ModeName.Visual, ModeName.VisualLine];
  key = "<c-[>";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Normal;

    return vimState;
  }
}

// begin insert commands

@RegisterAction
class CommandInsertAtCursor extends BaseCommand {
  modes = [ModeName.Normal];
  key = "i";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;

    return vimState;
  }
}

@RegisterAction
class CommandInsertAtLineBegin extends BaseCommand {
  modes = [ModeName.Normal];
  key = "I";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getLineBegin();

    return vimState;
  }
}

@RegisterAction
class CommandInsertAfterCursor extends BaseCommand {
  modes = [ModeName.Normal];
  key = "a";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = position.getRight();

    return vimState;
  }
}

@RegisterAction
class CommandInsertAtLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  key = "A";

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
  key = "O";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.insertLineBefore");

    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = new Position(position.line, 0);
    return vimState;
  }
}

@RegisterAction
class CommandInsertNewLineBefore extends BaseCommand {
  modes = [ModeName.Normal];
  key = "o";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.insertLineAfter");

    vimState.currentMode = ModeName.Insert;
    vimState.cursorPosition = new Position(position.line + 1, 0);

    return vimState;
  }
}

@RegisterAction
class MoveLeft extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "h";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLeft();

    return vimState;
  }
}

@RegisterAction
class MoveUp extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "k";
  doesntChangeDesiredColumn = true;

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getUp(vimState.desiredColumn);

    return vimState;
  }
}

@RegisterAction
class MoveDown extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "j";
  doesntChangeDesiredColumn = true;

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getDown(vimState.desiredColumn);

    return vimState;
  }
}

@RegisterAction
class MoveRight extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "l";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = new Position(position.line, position.character + 1);

    return vimState;
  }
}

@RegisterAction
class MoveLineEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "$";
  setsDesiredColumnToEOL = true;

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLineEnd();

    return vimState;
  }
}

@RegisterAction
class MoveLineBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "0";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLineBegin();
    return vimState;
  }
}

@RegisterAction
class MoveNonBlank extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "^";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getFirstLineNonBlankChar();
    return vimState;
  }
}

@RegisterAction
class MoveNonBlankFirst extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "gg";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getDocumentStart();
    return vimState;
  }
}

@RegisterAction
class MoveNonBlankLast extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "G";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getDocumentEnd();
    return vimState;
  }
}

@RegisterAction
export class MoveWordBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "w";

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
  key = "W";

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
  key = "e";

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
  key = "E";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentBigWordEnd();
    return vimState;
  }
}

@RegisterAction
class MoveLastWordEnd  extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "ge";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLastWordEnd();
    return vimState;
  }
}

@RegisterAction
class MoveLastFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "gE";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLastBigWordEnd();
    return vimState;
  }
}

@RegisterAction
class MoveBeginningWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "b";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getWordLeft();
    return vimState;
  }
}

@RegisterAction
class MoveBeginningFullWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "B";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getBigWordLeft();
    return vimState;
  }
}

@RegisterAction
class MoveParagraphEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "}";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentParagraphEnd();
    return vimState;
  }
}

@RegisterAction
class MoveParagraphBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "{";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentParagraphBeginning();
    return vimState;
  }
}

@RegisterAction
class ActionDeleteChar extends BaseCommand {
  modes = [ModeName.Normal];
  key = "x";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const state = await new DeleteOperator().run(vimState, position, position);

    state.currentMode = ModeName.Normal;

    return state;
  }
}

@RegisterAction
class ActionDeleteLastChar extends BaseCommand {
  modes = [ModeName.Normal];
  key = "X";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(vimState, position.getLeft(), position.getLeft());
  }
}

@RegisterAction
class MoveDD extends BaseMovement {
  modes = [ModeName.Normal];
  key = "d";

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
  key = "y";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorStartPosition = position.getLineBegin();
    vimState.cursorPosition = position.getNextLineBegin();

    return vimState;
  }
}

@RegisterAction
class MoveCC extends BaseMovement {
  modes = [ModeName.Normal];
  key = "c";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorStartPosition = position.getLineBegin();
    vimState.cursorPosition = position.getLineEnd();

    return vimState;
  }
}

@RegisterAction
class ActionDeleteLineVisualMode extends BaseCommand {
  modes = [ModeName.Visual, ModeName.VisualLine];
  key = "X";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(vimState, position.getLineBegin(), position.getLineEnd());
  }
}

@RegisterAction
class ActionChangeChar extends BaseCommand {
  modes = [ModeName.Normal];
  key = "s";

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const state = await new ChangeOperator().run(vimState, position, position);

    state.currentMode = ModeName.Insert;

    return state;
  }
}

@RegisterAction
class MovementAWordTextObject extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual];
  key = "aw";

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

    // TODO - this is a bad way to do this. we need some sort of global
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
  key = "iw";

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

    // TODO - this is a bad way to do this. we need some sort of global
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
  key = "%";

  public async execAction(position: Position, vimState: VimState): Promise<VimState> {

    vscode.window.activeTextEditor.setDecorations

     await vscode.commands.executeCommand("editor.action.jumpToBracket");
     await vscode.commands.executeCommand("editor.action.jumpToBracket");


    vimState.cursorPosition = position.getLineEnd();

    return vimState;
  }
}
*/

/*
@RegisterAction
class ActionIndent extends BaseAction {
  modes = [ModeName.Normal];
  key = ">>";

  public async execAction(position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.indentLines");

    return {};
  }
}

@RegisterAction
class ActionOutdent extends BaseAction {
  modes = [ModeName.Normal];
  key = "<<";

  public async execAction(position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.outdentLines");

    return {};
  }
}
*/