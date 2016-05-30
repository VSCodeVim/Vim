import { ModeHandler } from './../mode/modeHandler';
import { ModeName } from './../mode/mode';
import { Position } from './../motion/position';
import * as vscode from 'vscode';

export abstract class BaseAction {
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
  public abstract async execAction(modeHandler: ModeHandler, position: Position): Promise<Position>;
}

/**
 * A command is something like <esc>, :, v, i, etc.
 *
 * TODO commands are a bit weird. should look into them more?
 */
export abstract class BaseCommand extends BaseAction {
  /**
   * Run the command.
   */
  public abstract async exec(modeHandler: ModeHandler, position: Position): Promise<Position>;
}

export class Actions {

  /**
   * Every Vim action will be added here with the @RegisterAction decorator.
   */
  public static allActions: BaseMovement[] = [];

  /**
   * Gets the action that should be triggered given a key
   * sequence, or undefined if there isn't one.
   *
   * TODO - this is a great place for optional types, once
   * Typescript 2.0 lands!
   */
  public static getRelevantAction(keysPressed: string, mode: ModeName): BaseAction {
    for (const action of Actions.allActions) {
      if (action.key === keysPressed && action.modes.indexOf(mode) !== -1) {
        return action;
      }
    }

    return undefined;
  }
}

export function RegisterAction(action) {
  Actions.allActions.push(new action());
}

/*
@RegisterAction
class ActionEnterCommand extends BaseAction {
  modes = [ModeName.Normal];
  key = ":";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await showCmdLine("", modeHandler);

    return {};
  }
}

@RegisterAction
class ActionFind extends BaseAction {
  modes = [ModeName.Normal];
  key = "/";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("actions.find");

    return {};
  }
}

@RegisterAction
class ActionFold extends BaseAction {
  modes = [ModeName.Normal];
  key = "zc";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("editor.fold");

    return {};
  }
}

@RegisterAction
class ActionUnfold extends BaseAction {
  modes = [ModeName.Normal];
  key = "zo";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("editor.unfold");

    return {};
  }
}

@RegisterAction
class ActionFoldAll extends BaseAction {
  modes = [ModeName.Normal];
  key = "zC";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("editor.foldAll");

    return {};
  }
}

@RegisterAction
class ActionUnfoldAll extends BaseAction {
  modes = [ModeName.Normal];
  key = "zO";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("editor.unfoldAll");

    return {};
  }
}

@RegisterAction
class ActionUndo extends BaseAction {
  modes = [ModeName.Normal];
  key = "u";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("undo");

    return { undo: true };
  }
}

@RegisterAction
class ActionRedo extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+r";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("redo");

    return { redo: true };
  }
}
*/

@RegisterAction
class CommandEsc extends BaseCommand {
  modes = [ModeName.Insert, ModeName.Visual, ModeName.VisualLine];
  key = "<esc>";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    modeHandler.setCurrentModeByName(ModeName.Normal);

    return position.getLeft();
  }
}

@RegisterAction
class CommandVInVisualMode extends BaseCommand {
  modes = [ModeName.Visual];
  key = "v";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    modeHandler.setCurrentModeByName(ModeName.Normal);

    return position;
  }
}

@RegisterAction
class CommandVInNormalMode extends BaseCommand {
  modes = [ModeName.Normal];
  key = "v";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    modeHandler.setCurrentModeByName(ModeName.Visual);

    return position;
  }
}

@RegisterAction
class CommandOpenSquareBracket extends BaseCommand {
  modes = [ModeName.Insert, ModeName.Visual, ModeName.VisualLine];
  key = "<c-[>";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    modeHandler.setCurrentModeByName(ModeName.Normal);

    return position;
  }
}

// begin insert commands

@RegisterAction
class CommandInsertAtCursor extends BaseCommand {
  modes = [ModeName.Normal];
  key = "i";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    modeHandler.setCurrentModeByName(ModeName.Insert);

    return position;
  }
}

@RegisterAction
class CommandInsertAtLineBegin extends BaseCommand {
  modes = [ModeName.Normal];
  key = "I";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    modeHandler.setCurrentModeByName(ModeName.Insert);

    return position.getLineBegin();
  }
}

@RegisterAction
class CommandInsertAfterCursor extends BaseCommand {
  modes = [ModeName.Normal];
  key = "a";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    modeHandler.setCurrentModeByName(ModeName.Insert);

    return position.getRight();
  }
}

@RegisterAction
class CommandInsertAtLineEnd extends BaseCommand {
  modes = [ModeName.Normal];
  key = "A";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    modeHandler.setCurrentModeByName(ModeName.Insert);

    return position.getLineEnd();
  }
}

@RegisterAction
class CommandInsertNewLineAbove extends BaseCommand {
  modes = [ModeName.Normal];
  key = "O";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    // TODO: This code no good.
    await vscode.commands.executeCommand("editor.action.insertLineBefore");

    modeHandler.setCurrentModeByName(ModeName.Insert);

    return position;
  }
}

@RegisterAction
class CommandInsertNewLineBefore extends BaseCommand {
  modes = [ModeName.Normal];
  key = "o";

  public async exec(modeHandler: ModeHandler, position: Position): Promise<Position> {
    // TODO: This code no good.
    await vscode.commands.executeCommand("editor.action.insertLineAfter");

    modeHandler.setCurrentModeByName(ModeName.Insert);

    return new Position(position.line + 1, 0, position.positionOptions);
  }
}

@RegisterAction
class MoveLeft extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "h";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLeft();
  }
}

@RegisterAction
class MoveUp extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "k";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getUp(0); // TODO: Need to determine current col;
  }
}

@RegisterAction
class MoveDown extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "j";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getDown(0); // TODO: Need to determine current col;
  }
}

@RegisterAction
class MoveRight extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "l";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getRight();
  }
}

@RegisterAction
class MoveLineEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "$";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLineEnd();
  }
}

@RegisterAction
class MoveLineBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "0";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLineBegin();
  }
}

@RegisterAction
class MoveNonBlank extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "^";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getFirstLineNonBlankChar();
  }
}

@RegisterAction
class MoveNonBlankFirst extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "gg";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getDocumentStart();
  }
}

@RegisterAction
class MoveNonBlankLast extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "G";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getDocumentEnd();
  }
}

@RegisterAction
class MoveWordBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "w";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getWordRight();
  }
}

@RegisterAction
class MoveFullWordBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "W";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getBigWordRight();
  }
}

@RegisterAction
class MoveWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "e";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getCurrentWordEnd();
  }
}

@RegisterAction
class MoveFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "E";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getCurrentBigWordEnd();
  }
}

@RegisterAction
class MoveLastWordEnd  extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "ge";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLastWordEnd();
  }
}

@RegisterAction
class MoveLastFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "gE";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLastBigWordEnd();
  }
}

@RegisterAction
class MoveBeginningWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "b";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getWordLeft();
  }
}

@RegisterAction
class MoveBeginningFullWord extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "B";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getBigWordLeft();
  }
}

@RegisterAction
class MoveParagraphEnd extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "}";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getCurrentParagraphEnd();
  }
}

@RegisterAction
class MoveParagraphBegin extends BaseMovement {
  modes = [ModeName.Normal, ModeName.Visual, ModeName.VisualLine];
  key = "{";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getCurrentParagraphBeginning();
  }
}


/*
@RegisterAction
class ActionMoveFullPageDown extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+f";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("cursorPageDown");

    return {};
  }
}

@RegisterAction
class ActionMoveFullPageUp extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+b";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("cursorPageUp");

    return {};
  }
}

@RegisterAction
class ActionMoveMatchingBracket extends BaseAction {
  modes = [ModeName.Normal];
  key = "%";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("editor.action.jumpToBracket");

    return {};
  }
}

@RegisterAction
class ActionIndent extends BaseAction {
  modes = [ModeName.Normal];
  key = ">>";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("editor.action.indentLines");

    return {};
  }
}

@RegisterAction
class ActionOutdent extends BaseAction {
  modes = [ModeName.Normal];
  key = "<<";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await vscode.commands.executeCommand("editor.action.outdentLines");

    return {};
  }
}


@RegisterAction
class ActionChangeCurrentWord {
  modes = [ModeName.Normal];
  key = "ciw";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
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

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
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
class ActionChangeToLineEnd {
  modes = [ModeName.Normal];
  key = "C";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    await new ChangeOperator(modeHandler).run(motion.position, motion.position.getLineEnd());
  }
}

@RegisterAction
class ActionDeleteToLineEnd {
  modes = [ModeName.Normal];
  key = "D";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getLineEnd());
    motion.left().move();
  }
}

@RegisterAction
class ActionDeleteChar {
  modes = [ModeName.Normal];
  key = "x";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getRight());
  }
}

@RegisterAction
class ActionDeleteLastChar {
  modes = [ModeName.Normal];
  key = "X";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    vscode.commands.executeCommand("deleteLeft");
  }
}

@RegisterAction
class ActionPaste {
  modes = [ModeName.Normal];
  key = "p";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    await new PutOperator(modeHandler).run(motion.position, null);
  }
}
*/