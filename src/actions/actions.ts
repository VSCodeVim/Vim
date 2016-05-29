import { ModeHandler } from './../mode/modeHandler';
import { ModeName } from './../mode/mode';
import { showCmdLine } from './../cmd_line/main';
import { Motion, MotionMode } from './../motion/motion';
import {DeleteOperator} from './../operator/delete';
import {ChangeOperator} from './../operator/change';
import {PutOperator} from './../operator/put';
import {TextEditor} from './../textEditor';
import * as vscode from 'vscode';

/**
 * An action is the most basic sort of thing you can do in vimotion.
 * 'h', 'j', 'w' etc are all actions.
 */
export abstract class BaseAction {
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
  public abstract async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void>;
}

export class Actions {

  /**
   * Every Vim action will be added here with the @RegisterAction decorator.
   */
  public static allActions: BaseAction[] = [];
}

function RegisterAction(action) {
    Actions.allActions.push(new action());
}

@RegisterAction
class ActionEnterCommand extends BaseAction {
  modes = [ModeName.Normal];
  key = ":";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await showCmdLine("", modeHandler);
  }
}

@RegisterAction
class ActionFind extends BaseAction {
  modes = [ModeName.Normal];
  key = "/";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("actions.find");
  }
}

@RegisterAction
class ActionFold extends BaseAction {
  modes = [ModeName.Normal];
  key = "zc";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.fold");
  }
}

@RegisterAction
class ActionUnfold extends BaseAction {
  modes = [ModeName.Normal];
  key = "zo";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.unfold");
  }
}

@RegisterAction
class ActionFoldAll extends BaseAction {
  modes = [ModeName.Normal];
  key = "zC";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.foldAll");
  }
}

@RegisterAction
class ActionUnfoldAll extends BaseAction {
  modes = [ModeName.Normal];
  key = "zO";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.unfoldAll");
  }
}

@RegisterAction
class ActionUndo extends BaseAction {
  modes = [ModeName.Normal];
  key = "u";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("undo");
  }
}

@RegisterAction
class ActionRedo extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+r";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("redo");
  }
}

@RegisterAction
class ActionMoveLeft extends BaseAction {
  modes = [ModeName.Normal];
  key = "h";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.left().move();
  }
}

@RegisterAction
class ActionMoveUp extends BaseAction {
  modes = [ModeName.Normal];
  key = "k";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.up().move();
  }
}

@RegisterAction
class ActionMoveRight extends BaseAction {
  modes = [ModeName.Normal];
  key = "l";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.right().move();
  }
}

@RegisterAction
class ActionMoveLineEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "$";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.lineEnd().move();
  }
}

@RegisterAction
class ActionMoveLineBegin extends BaseAction {
  modes = [ModeName.Normal];
  key = "0";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.lineBegin().move();
  }
}

@RegisterAction
class ActionMoveNonBlank extends BaseAction {
  modes = [ModeName.Normal];
  key = "^";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("cursorHome");
  }
}

@RegisterAction
class ActionMoveNonBlankFirst extends BaseAction {
  modes = [ModeName.Normal];
  key = "gg";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.firstLineNonBlankChar().move();
  }
}

@RegisterAction
class ActionMoveNonBlankLast extends BaseAction {
  modes = [ModeName.Normal];
  key = "G";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.lastLineNonBlankChar().move();
  }
}

@RegisterAction
class ActionMoveWordBegin extends BaseAction {
  modes = [ModeName.Normal];
  key = "w";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.wordRight().move();
  }
}

@RegisterAction
class ActionMoveFullWordBegin extends BaseAction {
  modes = [ModeName.Normal];
  key = "W";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.bigWordRight().move();
  }
}

@RegisterAction
class ActionMoveWordEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "e";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfCurrentWord().move();
  }
}

@RegisterAction
class ActionMoveFullWordEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "E";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfCurrentBigWord().move();
  }
}

@RegisterAction
class ActionMoveLastWordEnd  extends BaseAction {
  modes = [ModeName.Normal];
  key = "ge";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfLastWord().move();
  }
}

@RegisterAction
class ActionMoveLastFullWordEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "gE";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfLastWord().move();
  }
}

@RegisterAction
class ActionMoveBeginningWord extends BaseAction {
  modes = [ModeName.Normal];
  key = "b";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.wordLeft().move();
  }
}

@RegisterAction
class ActionMoveBeginningFullWord extends BaseAction {
  modes = [ModeName.Normal];
  key = "B";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.bigWordLeft().move();
  }
}

@RegisterAction
class ActionMoveParagraphEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "}";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfCurrentParagraph().move();
  }
}

@RegisterAction
class ActionMoveParagraphBegin extends BaseAction {
  modes = [ModeName.Normal];
  key = "{";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToBeginningOfCurrentParagraph().move();
  }
}

@RegisterAction
class ActionMoveFullPageDown extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+f";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("cursorPageDown");
  }
}

@RegisterAction
class ActionMoveFullPageUp extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+b";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("cursorPageUp");
  }
}

@RegisterAction
class ActionMoveMatchingBracket extends BaseAction {
  modes = [ModeName.Normal];
  key = "%";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.action.jumpToBracket");
  }
}

@RegisterAction
class ActionIndent extends BaseAction {
  modes = [ModeName.Normal];
  key = ">>";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.action.indentLines");
  }
}

@RegisterAction
class ActionOutdent extends BaseAction {
  modes = [ModeName.Normal];
  key = "<<";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.action.outdentLines");
  }
}

@RegisterAction
class ActionChangeWord {
  modes = [ModeName.Normal];
  key = "cw";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    let currentChar = TextEditor.getLineAt(motion.position).text[motion.position.character];
    if (currentChar === ' ' || currentChar === '\t') {
      await new ChangeOperator(modeHandler).run(motion.position, motion.position.getWordRight());
    } else {
      await new ChangeOperator(modeHandler).run(motion.position, motion.position.getCurrentWordEnd());
    }
  }
}

@RegisterAction
class ActionChangeFullWord {
  modes = [ModeName.Normal];
  key = "cW";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
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

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
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

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
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

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new ChangeOperator(modeHandler).run(motion.position, motion.position.getLineEnd());
  }
}

@RegisterAction
class ActionDeleteLine extends BaseAction {
  modes = [ModeName.Normal];
  key = "dd";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    vscode.commands.executeCommand("editor.action.deleteLines");
  }
}

@RegisterAction
class ActionDeleteToNextWord {
  modes = [ModeName.Normal];
  key = "dw";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
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

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getBigWordRight());
  }
}

@RegisterAction
class ActionDeleteToWordBegin {
  modes = [ModeName.Normal];
  key = "db";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getWordLeft());
  }
}

@RegisterAction
class ActionDeleteToFullWordBegin {
  modes = [ModeName.Normal];
  key = "dB";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getBigWordLeft());
  }
}

@RegisterAction
class ActionDeleteToWordEnd {
  modes = [ModeName.Normal];
  key = "de";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getCurrentWordEnd());
  }
}

@RegisterAction
class ActionDeleteToFullWordEnd {
  modes = [ModeName.Normal];
  key = "dE";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getCurrentBigWordEnd());
    motion.left().move();
  }
}

@RegisterAction
class ActionDeleteToLineEnd {
  modes = [ModeName.Normal];
  key = "D";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getLineEnd());
    motion.left().move();
  }
}

@RegisterAction
class ActionDeleteChar {
  modes = [ModeName.Normal];
  key = "x";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getRight());
  }
}

@RegisterAction
class ActionDeleteLastChar {
  modes = [ModeName.Normal];
  key = "X";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    vscode.commands.executeCommand("deleteLeft");
  }
}

@RegisterAction
class ActionPaste {
  modes = [ModeName.Normal];
  key = "p";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await new PutOperator(modeHandler).run(motion.position, null);
  }
}