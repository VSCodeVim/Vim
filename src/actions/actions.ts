import { ModeHandler, ActionState, VimState } from './../mode/modeHandler';
import { ModeName } from './../mode/mode';
import { TextEditor } from './../textEditor';
import { Register } from './../register/register';
import { Position } from './../motion/position';
import { VisualMode } from './../mode/modeVisual';
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
   * Is this action valid in the current Vim state?
   */
  public doesActionApply(modeHandler: ModeHandler, key: string): boolean {
    if (this.modes.indexOf(modeHandler.currentMode.name) === -1) { return false; }
    if (this.key.indexOf(key) === -1) { return false; }

    return true;
  }

  /**
   * Run the action.
   *
   * TODO: The dream is to not pass in modeHandler, only motion.
   * This is quite a far off dream, though.
   */
  public abstract async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState>;

  /**
   * Run the action in an operator context. 99% of the time, this function can be
   * ignored, as it is exactly the same as the above function. (But pay attention
   * to e!)
   */
  public async execActionForOperator(modeHandler: ModeHandler, position: Position,  vimState: VimState): Promise<VimState> {
    return await this.execAction(modeHandler, position, vimState);
  }
}

/**
 * A command is something like <esc>, :, v, i, etc.
 */
export abstract class BaseCommand extends BaseAction {
  /**
   * Run the command.
   */
  public abstract async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState>;
}

export class BaseOperator extends BaseAction {
    /**
     * Run this operator on a range, returning the new location of the cursor.
     */
    run(modeHandler: ModeHandler, vimState: VimState, start: Position, stop: Position): Promise<VimState> { return; }
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
  public static getRelevantAction(keysPressed: string, mode: ModeName): BaseAction | KeypressState {
    let couldPotentiallyHaveMatch = false;

    for (const action of Actions.allActions) {
      if (action.modes.indexOf(mode) === -1) {
        continue;
      }

      if (action.key === keysPressed) {
        return action;
      }

      if (action.key.startsWith(keysPressed)) {
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
    public async run(modeHandler: ModeHandler, vimState: VimState,
                     start: Position, end: Position, dontChangeMode: boolean = false): Promise<VimState> {
        if (start.compareTo(end) <= 0) {
          end = new Position(end.line, end.character + 1, end.positionOptions);
        } else {
          const tmp = start;
          start = end;
          end = tmp;

          end = new Position(end.line, end.character + 1, end.positionOptions)
        }

        // Imagine we have selected everything with an X in
        // the following text (there is no character on the
        // second line at all, just a block cursor):

        // XXXXXXX
        // X
        //
        // If we delete this range, we want to delete the entire first and
        // second lines. Therefore we have to advance the cursor to the next
        // line.

        if (start.line !== end.line && TextEditor.getLineAt(end).text === "") {
            end = end.getDown(0);
        }

        await TextEditor.delete(new vscode.Range(start, end));

        // This is important because handleDeactivation of Visual Mode will
        // set the cursor to the end of the selection. Visual Mode would
        // otherwise be in a weird state since the selection it has is no
        // longer valid. (TODO - I wonder if there's a better way to solve this -
        // perhaps Visual Mode should monitor selection changes and update it's
        // anchors accordingly.)
        if (modeHandler.currentMode.name === ModeName.Visual) {
          (modeHandler.currentMode as VisualMode).setSelectionStop(Position.EarlierOf(start, end));
        }

        if (!dontChangeMode) {
          modeHandler.setCurrentModeByName(ModeName.Normal);
        }

        if (start.character >= TextEditor.getLineAt(start).text.length) {
          vimState.cursorPosition = start.getLeft();
        } else {
          vimState.cursorPosition =  start;
        }

        return vimState;
    }
}

@RegisterAction
export class ChangeOperator extends BaseOperator {
    public key: string = "c";
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    /**
     * Run this operator on a range.
     */
    public async run(modeHandler: ModeHandler, vimState: VimState, start: Position, end: Position): Promise<VimState> {
        const pos = await new DeleteOperator().run(modeHandler, vimState, start, end, true);
        modeHandler.setCurrentModeByName(ModeName.Insert);

        return pos;
    }
}


@RegisterAction
export class PutOperator extends BaseOperator {
    public key: string = "p";
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    /**
     * Run this operator on a range.
     */
    public async run(modeHandler: ModeHandler, vimState: VimState, start: Position, end: Position): Promise<VimState> {
        const data = Register.get();

        await TextEditor.insertAt(data, start.getRight());
        modeHandler.currentMode.motion.moveTo(start.line, start.getRight().character);

        vimState.cursorPosition = start;
        return vimState; // TODO - I think this is wrong.
    }
}

@RegisterAction
export class YankOperator extends BaseOperator {
    public key: string = "y";
    public modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];

    /**
     * Run this operator on a range.
     */
    public async run(modeHandler: ModeHandler, vimState: VimState, start: Position, end: Position): Promise<VimState> {
        await TextEditor.copy(new vscode.Range(start, end))

        modeHandler.currentMode.motion.select(end, end);
        modeHandler.setCurrentModeByName(ModeName.Normal);

        vimState.cursorPosition = start;
        return vimState;
    }
}

/*
@RegisterAction
class ActionEnterCommand extends BaseAction {
  modes = [ModeName.Normal];
  key = ":";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await showCmdLine("", modeHandler);

    return {};
  }
}

@RegisterAction
class ActionFind extends BaseAction {
  modes = [ModeName.Normal];
  key = "/";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("actions.find");

    return {};
  }
}

@RegisterAction
class ActionFold extends BaseAction {
  modes = [ModeName.Normal];
  key = "zc";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.fold");

    return {};
  }
}

@RegisterAction
class ActionUnfold extends BaseAction {
  modes = [ModeName.Normal];
  key = "zo";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.unfold");

    return {};
  }
}

@RegisterAction
class ActionFoldAll extends BaseAction {
  modes = [ModeName.Normal];
  key = "zC";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.foldAll");

    return {};
  }
}

@RegisterAction
class ActionUnfoldAll extends BaseAction {
  modes = [ModeName.Normal];
  key = "zO";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.unfoldAll");

    return {};
  }
}

@RegisterAction
class ActionUndo extends BaseAction {
  modes = [ModeName.Normal];
  key = "u";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("undo");

    return { undo: true };
  }
}

@RegisterAction
class ActionRedo extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+r";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("redo");

    return { redo: true };
  }
}
*/

@RegisterAction
class CommandEsc extends BaseCommand {
  modes = [ModeName.Insert, ModeName.Visual, ModeName.VisualLine];
  key = "<esc>";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    modeHandler.setCurrentModeByName(ModeName.Normal);

    vimState.cursorPosition = position.getLeft();
    return vimState;
  }
}

@RegisterAction
class CommandDeleteToLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  key = "D";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(modeHandler, vimState, position, position.getLineEnd());
  }
}

@RegisterAction
class CommandChangeToLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  key = "C";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    const pos = await new DeleteOperator().run(modeHandler, vimState, position, position.getLineEnd(), true);
    modeHandler.setCurrentModeByName(ModeName.Insert);

    return pos;
  }
}

@RegisterAction
class CommandVInVisualMode extends BaseCommand {
  modes = [ModeName.Visual];
  key = "v";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    modeHandler.setCurrentModeByName(ModeName.Normal);

    return vimState;
  }
}

@RegisterAction
class CommandVInNormalMode extends BaseCommand {
  modes = [ModeName.Normal];
  key = "v";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    modeHandler.setCurrentModeByName(ModeName.Visual);

    return vimState;
  }
}

@RegisterAction
class CommandOpenSquareBracket extends BaseCommand {
  modes = [ModeName.Insert, ModeName.Visual, ModeName.VisualLine];
  key = "<c-[>";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    modeHandler.setCurrentModeByName(ModeName.Normal);

    return vimState;
  }
}

// begin insert commands

@RegisterAction
class CommandInsertAtCursor extends BaseCommand {
  modes = [ModeName.Normal];
  key = "i";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    modeHandler.setCurrentModeByName(ModeName.Insert);

    return vimState;
  }
}

@RegisterAction
class CommandInsertAtLineBegin extends BaseCommand {
  modes = [ModeName.Normal];
  key = "I";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    modeHandler.setCurrentModeByName(ModeName.Insert);

    vimState.cursorPosition = position.getLineBegin();
    return vimState;
  }
}

@RegisterAction
class CommandInsertAfterCursor extends BaseCommand {
  modes = [ModeName.Normal];
  key = "a";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    modeHandler.setCurrentModeByName(ModeName.Insert);

    vimState.cursorPosition = position.getRight();
    return vimState;
  }
}

@RegisterAction
class CommandInsertAtLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  key = "A";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    modeHandler.setCurrentModeByName(ModeName.Insert);

    vimState.cursorPosition = position.getLineEnd();
    return vimState;
  }
}

@RegisterAction
class CommandInsertNewLineAbove extends BaseCommand {
  modes = [ModeName.Normal];
  key = "O";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    // TODO: This code no good.
    await vscode.commands.executeCommand("editor.action.insertLineBefore");

    modeHandler.setCurrentModeByName(ModeName.Insert);

    vimState.cursorPosition = new Position(position.line, 0, position.positionOptions);
    return vimState;
  }
}

@RegisterAction
class CommandInsertNewLineBefore extends BaseCommand {
  modes = [ModeName.Normal];
  key = "o";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    // TODO: This code no good.
    await vscode.commands.executeCommand("editor.action.insertLineAfter");

    modeHandler.setCurrentModeByName(ModeName.Insert);

    vimState.cursorPosition = new Position(position.line + 1, 0, position.positionOptions);
    return vimState;
  }
}

@RegisterAction
class MoveLeft extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "h";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLeft();
    return vimState;
  }
}

@RegisterAction
class MoveUp extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "k";
  doesntChangeDesiredColumn = true;

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getUp(vimState.desiredColumn);
    return vimState;
  }
}

@RegisterAction
class MoveDown extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "j";
  doesntChangeDesiredColumn = true;

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getDown(vimState.desiredColumn);
    return vimState;
  }
}

@RegisterAction
class MoveRight extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "l";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = new Position(position.line, position.character + 1, position.positionOptions);
    return vimState;
  }
}

@RegisterAction
class MoveLineEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "$";
  setsDesiredColumnToEOL = true;

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLineEnd();
    return vimState;
  }
}

@RegisterAction
class MoveLineBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "0";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLineBegin();
    return vimState;
  }
}

@RegisterAction
class MoveNonBlank extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "^";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getFirstLineNonBlankChar();
    return vimState;
  }
}

@RegisterAction
class MoveNonBlankFirst extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "gg";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getDocumentStart();
    return vimState;
  }
}

@RegisterAction
class MoveNonBlankLast extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "G";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getDocumentEnd();
    return vimState;
  }
}

@RegisterAction
export class MoveWordBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "w";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    if (vimState.actionState.operator instanceof ChangeOperator) {

      /*
        From the Vim manual:

        Special case: "cw" and "cW" are treated like "ce" and "cE" if the cursor is
        on a non-blank.  This is because "cw" is interpreted as change-word, and a
        word does not include the following white space.  {Vi: "cw" when on a blank
        followed by other blanks changes only the first blank; this is probably a
        bug, because "dw" deletes all the blanks}
      */
      vimState.cursorPosition = position.getCurrentWordEnd().getRight();
    } else {
      vimState.cursorPosition = position.getWordRight();
    }

    return vimState;
  }
}

@RegisterAction
class MoveFullWordBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "W";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
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

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentWordEnd();
    return vimState;
  }

  public async execActionForOperator(modeHandler: ModeHandler, position: Position,
                                     vimState: VimState): Promise<VimState> {
    let end = position.getCurrentWordEnd();

    vimState.cursorPosition = new Position(end.line, end.character + 1, end.positionOptions);
    return vimState;
  }
}

@RegisterAction
class MoveFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "E";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentBigWordEnd();
    return vimState;
  }
}

@RegisterAction
class MoveLastWordEnd  extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "ge";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLastWordEnd();
    return vimState;
  }
}

@RegisterAction
class MoveLastFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "gE";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getLastBigWordEnd();
    return vimState;
  }
}

@RegisterAction
class MoveBeginningWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "b";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getWordLeft();
    return vimState;
  }
}

@RegisterAction
class MoveBeginningFullWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "B";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getBigWordLeft();
    return vimState;
  }
}

@RegisterAction
class MoveParagraphEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "}";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentParagraphEnd();
    return vimState;
  }
}

@RegisterAction
class MoveParagraphBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "{";

  public async execAction(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    vimState.cursorPosition = position.getCurrentParagraphBeginning();
    return vimState;
  }
}

@RegisterAction
class ActionDeleteChar extends BaseCommand {
  modes = [ModeName.Normal, ModeName.Visual];
  key = "x";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    const pos = await new DeleteOperator().run(modeHandler, vimState, position, position);

    modeHandler.setCurrentModeByName(ModeName.Normal);

    return pos;
  }
}

@RegisterAction
class ActionDeleteLastChar extends BaseCommand {
  modes = [ModeName.Normal];
  key = "X";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(modeHandler, vimState, position.getLeft(), position.getLeft(), true);
  }
}

@RegisterAction
class ActionDeleteLineVisualMode extends BaseCommand {
  modes = [ModeName.Visual];
  key = "X";

  public async exec(modeHandler: ModeHandler, position: Position, vimState: VimState): Promise<VimState> {
    return await new DeleteOperator().run(modeHandler, vimState, position.getLineBegin(), position.getLineEnd(), true);
  }
}

/*
@RegisterAction
class ActionMoveFullPageDown extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+f";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("cursorPageDown");

    return {};
  }
}

@RegisterAction
class ActionMoveFullPageUp extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+b";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("cursorPageUp");

    return {};
  }
}

@RegisterAction
class ActionMoveMatchingBracket extends BaseAction {
  modes = [ModeName.Normal];
  key = "%";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.jumpToBracket");

    return {};
  }
}

@RegisterAction
class ActionIndent extends BaseAction {
  modes = [ModeName.Normal];
  key = ">>";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.indentLines");

    return {};
  }
}

@RegisterAction
class ActionOutdent extends BaseAction {
  modes = [ModeName.Normal];
  key = "<<";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await vscode.commands.executeCommand("editor.action.outdentLines");

    return {};
  }
}


@RegisterAction
class ActionChangeCurrentWord {
  modes = [ModeName.Normal];
  key = "ciw";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    motion.changeMode(MotionMode.Cursor);
    let currentChar = TextEditor.getLineAt(motion.position).text[motion.position.character];
    if (currentChar === ' ' || currentChar === '\t') {
      await new ChangeOperator(modeHandler).run(motion.position.getLastWordEnd(), motion.position.getWordRight());
    } else {
      await new ChangeOperator(modeHandler).run(motion.position.getWordLeft(), motion.position.getCurrentWordEnd());
    }
    modeHandler.setCurrentModeByName(ModeName.Insert);

  }
}

@RegisterAction
class ActionChangeCurrentWordToNext {
  modes = [ModeName.Normal];
  key = "caw";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    motion.changeMode(MotionMode.Cursor);
    let currentChar = TextEditor.getLineAt(motion.position).text[motion.position.character];
    if (currentChar === ' ' || currentChar === '\t') {
      await new ChangeOperator(modeHandler).run(motion.position.getLastWordEnd(), motion.position.getCurrentWordEnd());
    } else {
      await new ChangeOperator(modeHandler).run(motion.position.getWordLeft(), motion.position.getWordRight());
    }

  }
}

@RegisterAction
class ActionPaste {
  modes = [ModeName.Normal];
  key = "p";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<VimState> {
    await new PutOperator(modeHandler).run(motion.position, null);
  }
}
*/