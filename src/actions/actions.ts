import { ModeHandler } from './../mode/modeHandler'
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
abstract class BaseAction {
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

class ActionEnterCommand extends BaseAction {
  modes = [ModeName.Normal];
  key = ":";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await showCmdLine("", modeHandler);
  }
}

class ActionFind extends BaseAction {
  modes = [ModeName.Normal];
  key = "/";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("actions.find");
  }
}

class ActionFold extends BaseAction {
  modes = [ModeName.Normal];
  key = "zc";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.fold");
  }
}

class ActionUnfold extends BaseAction {
  modes = [ModeName.Normal];
  key = "zo";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.unfold");
  }
}

class ActionFoldAll extends BaseAction {
  modes = [ModeName.Normal];
  key = "zC";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.foldAll");
  }
}

class ActionUnfoldAll extends BaseAction {
  modes = [ModeName.Normal];
  key = "zO";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.unfoldAll");
  }
}

class ActionUndo extends BaseAction {
  modes = [ModeName.Normal];
  key = "u";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("undo");
  }
}

class ActionRedo extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+r";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("redo");
  }
}

class ActionMoveLeft extends BaseAction {
  modes = [ModeName.Normal];
  key = "h";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.left().move();
  }
}

class ActionMoveDown extends BaseAction {
  modes = [ModeName.Normal];
  key = "j";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.down().move();
  }
}

class ActionMoveUp extends BaseAction {
  modes = [ModeName.Normal];
  key = "k";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.up().move();
  }
}

class ActionMoveRight extends BaseAction {
  modes = [ModeName.Normal];
  key = "l";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.right().move();
  }
}

class ActionMoveLineEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "$";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.lineEnd().move();
  }
}

class ActionMoveLineBegin extends BaseAction {
  modes = [ModeName.Normal];
  key = "0";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.lineBegin().move();
  }
}

class ActionMoveNonBlank extends BaseAction {
  modes = [ModeName.Normal];
  key = "^";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("cursorHome");
  }
}

class ActionMoveNonBlankFirst extends BaseAction {
  modes = [ModeName.Normal];
  key = "gg";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.firstLineNonBlankChar().move();
  }
}

class ActionMoveNonBlankLast extends BaseAction {
  modes = [ModeName.Normal];
  key = "G";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.lastLineNonBlankChar().move();
  }
}

class ActionMoveWordBegin extends BaseAction {
  modes = [ModeName.Normal];
  key = "w";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.wordRight().move();
  }
}

class ActionMoveFullWordBegin extends BaseAction {
  modes = [ModeName.Normal];
  key = "W";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.bigWordRight().move();
  }
}

class ActionMoveWordEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "e";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfCurrentWord().move();
  }
}

class ActionMoveFullWordEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "E";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfCurrentBigWord().move();
  }
}

class ActionMoveLastWordEnd  extends BaseAction {
  modes = [ModeName.Normal];
  key = "ge";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfLastWord().move();
  }
}

class ActionMoveLastFullWordEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "gE";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfLastWord().move();
  }
}

class ActionMoveBeginningWord extends BaseAction {
  modes = [ModeName.Normal];
  key = "b";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.wordLeft().move();
  }
}

class ActionMoveBeginningFullWord extends BaseAction {
  modes = [ModeName.Normal];
  key = "B";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.bigWordLeft().move();
  }
}

class ActionMoveParagraphEnd extends BaseAction {
  modes = [ModeName.Normal];
  key = "}";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToEndOfCurrentParagraph().move();
  }
}

class ActionMoveParagraphBegin extends BaseAction {
  modes = [ModeName.Normal];
  key = "{";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await motion.goToBeginningOfCurrentParagraph().move();
  }
}

class ActionMoveFullPageDown extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+f";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("cursorPageDown");
  }
}

class ActionMoveFullPageUp extends BaseAction {
  modes = [ModeName.Normal];
  key = "ctrl+b";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("cursorPageUp");
  }
}

class ActionMoveMatchingBracket extends BaseAction {
  modes = [ModeName.Normal];
  key = "%";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.action.jumpToBracket");
  }
}

class ActionIndent extends BaseAction {
  modes = [ModeName.Normal];
  key = ">>";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.action.indentLines");
  }
}

class ActionOutdent extends BaseAction {
  modes = [ModeName.Normal];
  key = "<<";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await vscode.commands.executeCommand("editor.action.outdentLines");
  }
}

class ActionChangeWord {
  modes = [ModeName.Normal];
  key = "";

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

class ActionChangeFullWord {
  modes = [ModeName.Normal];
  key = "";

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

class ActionChangeCurrentWord {
  modes = [ModeName.Normal];
  key = "";

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

class ActionChangeCurrentWordToNext {
  modes = [ModeName.Normal];
  key = "";

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

class ActionChangeToLineEnd {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new ChangeOperator(modeHandler).run(motion.position, motion.position.getLineEnd());
  }
}

class ActionDeleteLine extends BaseAction {
  modes = [ModeName.Normal];
  key = "D";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    vscode.commands.executeCommand("editor.action.deleteLines");
  }
}

class ActionDeleteToNextWord {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getWordRight());

    if (motion.position.character >= motion.position.getLineEnd().character) {
      motion.left().move();
    }
  }
}

class ActionDeleteToFullNextWord  {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getBigWordRight());
  }
}

class ActionDeleteToWordBegin {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getWordLeft());
  }
}

class ActionDeleteToFullWordBegin {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getBigWordLeft());
  }
}

class ActionDeleteToWordEnd {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getCurrentWordEnd());
  }
}

class ActionDeleteToFullWordEnd {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getCurrentBigWordEnd());
    motion.left().move();
  }
}

class ActionDeleteToLineEnd {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getLineEnd());
    motion.left().move();
  }
}

class ActionDeleteChar {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    motion.changeMode(MotionMode.Cursor);
    await new DeleteOperator(modeHandler).run(motion.position, motion.position.getRight());
  }
}

class ActionDeleteLastChar {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    vscode.commands.executeCommand("deleteLeft");
  }
}

class ActionPaste {
  modes = [ModeName.Normal];
  key = "";

  public async execAction(modeHandler: ModeHandler, motion: Motion): Promise<void> {
    await new PutOperator(modeHandler).run(motion.position, null);
  }
}