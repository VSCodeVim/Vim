import { ModeHandler } from './../mode/modeHandler';
import { ModeName } from './../mode/mode';
import { Position } from './../motion/position';

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
  public static getRelevantAction(keysPressed: string): BaseAction {
    for (const action of Actions.allActions) {
      if (action.key === keysPressed) {
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
class MoveLeft extends BaseMovement {
  modes = [ModeName.Normal];
  key = "h";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLeft();
  }
}

@RegisterAction
class MoveUp extends BaseMovement {
  modes = [ModeName.Normal];
  key = "k";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getUp(0); // TODO: Need to determine current col;
  }
}

@RegisterAction
class MoveDown extends BaseMovement {
  modes = [ModeName.Normal];
  key = "j";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getDown(0); // TODO: Need to determine current col;
  }
}

@RegisterAction
class MoveRight extends BaseMovement {
  modes = [ModeName.Normal];
  key = "l";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getRight();
  }
}

@RegisterAction
class MoveLineEnd extends BaseMovement {
  modes = [ModeName.Normal];
  key = "$";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLineEnd();
  }
}

@RegisterAction
class MoveLineBegin extends BaseMovement {
  modes = [ModeName.Normal];
  key = "0";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLineBegin();
  }
}

@RegisterAction
class MoveNonBlank extends BaseMovement {
  modes = [ModeName.Normal];
  key = "^";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getFirstLineNonBlankChar();
  }
}

@RegisterAction
class MoveNonBlankFirst extends BaseMovement {
  modes = [ModeName.Normal];
  key = "gg";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getDocumentStart();
  }
}

@RegisterAction
class MoveNonBlankLast extends BaseMovement {
  modes = [ModeName.Normal];
  key = "G";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getDocumentEnd();
  }
}

@RegisterAction
class MoveWordBegin extends BaseMovement {
  modes = [ModeName.Normal];
  key = "w";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getWordRight();
  }
}

@RegisterAction
class MoveFullWordBegin extends BaseMovement {
  modes = [ModeName.Normal];
  key = "W";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getBigWordRight();
  }
}

@RegisterAction
class MoveWordEnd extends BaseMovement {
  modes = [ModeName.Normal];
  key = "e";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getCurrentWordEnd();
  }
}

@RegisterAction
class MoveFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal];
  key = "E";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getCurrentBigWordEnd();
  }
}

@RegisterAction
class MoveLastWordEnd  extends BaseMovement {
  modes = [ModeName.Normal];
  key = "ge";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLastWordEnd();
  }
}

@RegisterAction
class MoveLastFullWordEnd extends BaseMovement {
  modes = [ModeName.Normal];
  key = "gE";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getLastBigWordEnd();
  }
}

@RegisterAction
class MoveBeginningWord extends BaseMovement {
  modes = [ModeName.Normal];
  key = "b";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getWordLeft();
  }
}

@RegisterAction
class MoveBeginningFullWord extends BaseMovement {
  modes = [ModeName.Normal];
  key = "B";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getBigWordLeft();
  }
}

@RegisterAction
class MoveParagraphEnd extends BaseMovement {
  modes = [ModeName.Normal];
  key = "}";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    return position.getCurrentParagraphEnd();
  }
}

@RegisterAction
class MoveParagraphBegin extends BaseMovement {
  modes = [ModeName.Normal];
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
class ActionChangeWord {
  modes = [ModeName.Normal];
  key = "cw";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    // motion.changeMode(MotionMode.Cursor); // TODO

    let currentChar = TextEditor.getLineAt(position).text[position.character];
    if (currentChar === ' ' || currentChar === '\t') {
      await new ChangeOperator(modeHandler).run(position, position.getWordRight());
    } else {
      await new ChangeOperator(modeHandler).run(position, position.getCurrentWordEnd());
    }
  }
}

@RegisterAction
class ActionChangeFullWord {
  modes = [ModeName.Normal];
  key = "cW";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    let currentChar = TextEditor.getLineAt(motion.position).text[motion.position.character];
    if (currentChar === ' ' || currentChar === '\t') {
      await new ChangeOperator(modeHandler).run(motion.position, motion.position.getWordRight());
    } else {
      await new ChangeOperator(modeHandler).run(motion.position, motion.position.getCurrentBigWordEnd());
    }

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
class ActionDeleteLine extends BaseAction {
  modes = [ModeName.Normal];
  key = "dd";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    vscode.commands.executeCommand("editor.action.deleteLines");
  }
}

@RegisterAction
class ActionDeleteToNextWord {
  modes = [ModeName.Normal];
  key = "dw";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getWordRight());

    if (motion.position.character >= motion.position.getLineEnd().character) {
      motion.left().move();
    }
  }
}

@RegisterAction
class ActionDeleteToFullNextWord  {
  modes = [ModeName.Normal];
  key = "dW";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getBigWordRight());
  }
}

@RegisterAction
class ActionDeleteToWordBegin {
  modes = [ModeName.Normal];
  key = "db";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getWordLeft());
  }
}

@RegisterAction
class ActionDeleteToFullWordBegin {
  modes = [ModeName.Normal];
  key = "dB";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getBigWordLeft());
  }
}

@RegisterAction
class ActionDeleteToWordEnd {
  modes = [ModeName.Normal];
  key = "de";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getCurrentWordEnd());
  }
}

@RegisterAction
class ActionDeleteToFullWordEnd {
  modes = [ModeName.Normal];
  key = "dE";

  public async execAction(modeHandler: ModeHandler, position: Position): Promise<Position> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getCurrentBigWordEnd());
    motion.left().move();
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