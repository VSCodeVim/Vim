import * as vscode from 'vscode';
import { RecordedState, VimState } from './../../mode/modeHandler';
import { Register, RegisterMode } from './../../register/register';
import { Position, PositionDiff } from './../../common/motion/position';
import { Range } from './../../common/motion/range';
import { ModeName } from './../../mode/mode';
import { Configuration } from './../../configuration/configuration';
import { TextEditor } from './../../textEditor';
import { RegisterAction } from './../base';
import { ArrowsInInsertMode } from './../motion';
import {
  BaseCommand, DocumentContentChangeAction, CommandInsertAtCursor,
  CommandInsertAfterCursor, CommandInsertAtLineEnd,
  CommandInsertAtFirstCharacter
} from './actions';

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

  runsOnceForEveryCursor() { return false; }

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.allCursors = vimState.allCursors.map(x => x.withNewStop(x.stop.getLeft()));

    // only remove leading spaces inserted by vscode.
    // vscode only inserts them when user enter a new line,
    // ie, o/O in Normal mode or \n in Insert mode.
    for (let i = 0; i < vimState.allCursors.length; i++) {
      const lastActionBeforeEsc = vimState.keyHistory[vimState.keyHistory.length - 2];
      if (['o', 'O', '\n'].indexOf(lastActionBeforeEsc) > -1 &&
        vimState.editor.document.languageId !== 'plaintext' &&
        /^\s+$/.test(TextEditor.getLineAt(vimState.allCursors[i].stop).text)) {
        vimState.recordedState.transformations.push({
          type: "deleteRange",
          range: new Range(vimState.allCursors[i].stop.getLineBegin(), vimState.allCursors[i].stop.getLineEnd())
        });
        vimState.allCursors[i] = vimState.allCursors[i].withNewStop(vimState.allCursors[i].stop.getLineBegin());
      }
    }
    vimState.currentMode = ModeName.Normal;

    // If we wanted to repeat this insert (only for i and a), now is the time to do it. Insert
    // count amount of these strings before returning back to normal mode
    const typeOfInsert = vimState.recordedState.actionsRun[vimState.recordedState.actionsRun.length - 3];
    const isTypeToRepeatInsert = typeOfInsert instanceof CommandInsertAtCursor ||
      typeOfInsert instanceof CommandInsertAfterCursor ||
      typeOfInsert instanceof CommandInsertAtLineEnd ||
      typeOfInsert instanceof CommandInsertAtFirstCharacter;

    // If this is the type to repeat insert, do this now
    if (vimState.recordedState.count > 1 && isTypeToRepeatInsert) {
      const changeAction = vimState.recordedState.actionsRun[vimState.recordedState.actionsRun.length - 2] as DocumentContentChangeAction;
      const changesArray = changeAction.contentChanges;
      let docChanges: vscode.TextDocumentContentChangeEvent[] = [];

      for (let i = 0; i < changesArray.length; i++) {
        docChanges.push(changesArray[i].textDiff);
      }

      let positionDiff = new PositionDiff(0, 0);
      // Add count amount of inserts in the case of 4i=<esc>
      for (let i = 0; i < (vimState.recordedState.count - 1); i++) {
        // If this is the last transform, move cursor back one character
        if (i === (vimState.recordedState.count - 2)) {
          positionDiff = new PositionDiff(0, -1);
        }

        // Add a transform containing the change
        vimState.recordedState.transformations.push({
          type: "contentChange",
          changes: docChanges,
          diff: positionDiff
        });
      }
    }

    if (vimState.historyTracker.currentContentChanges.length > 0) {
      vimState.historyTracker.lastContentChanges = vimState.historyTracker.currentContentChanges;
      vimState.historyTracker.currentContentChanges = [];
    }

    if (vimState.isFakeMultiCursor) {
      vimState.allCursors = [vimState.allCursors[0]];
      vimState.isMultiCursor = false;
      vimState.isFakeMultiCursor = false;
    }
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

    vimState.cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.end);
    vimState.cursorStartPosition = Position.FromVSCodePosition(vimState.editor.selection.start);
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

    vimState.cursorStartPosition = Position.FromVSCodePosition(vimState.editor.selection.start);
    vimState.cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.start);

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
    const tabSize = Configuration.tabstop || Number(vimState.editor.options.tabSize);
    const newIndentationWidth = (indentationWidth / tabSize + 1) * tabSize;

    TextEditor.replaceText(
      vimState, TextEditor.setIndentationLevel(originalText, newIndentationWidth),
      position.getLineBegin(), position.getLineEnd(),
      new PositionDiff(0, newIndentationWidth - indentationWidth)
    );

    return vimState;
  }
}

// Upon thinking about it some more, I'm not really sure how to fix this
// elegantly. Tab is just used for so many things in the VSCode editor, and all
// of them happen to be overloaded. Sometimes tab does a tab, sometimes it does
// an emmet completion, sometimes a snippet completion, etc.
// @RegisterAction
// export class CommandInsertTabInInsertMode extends BaseCommand {
//   modes = [ModeName.Insert];
//   keys = ["<tab>"];
//   runsOnceForEveryCursor() { return false; }

//   public async exec(position: Position, vimState: VimState): Promise<VimState> {
//     vimState.recordedState.transformations.push({
//       type: "tab"
//     });
//     return vimState;
//   }
// }

@RegisterAction
export class CommandInsertInInsertMode extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<character>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    const char = this.keysPressed[this.keysPressed.length - 1];
    const line = TextEditor.getLineAt(position).text;

    if (char === "<BS>") {
      const selection = TextEditor.getSelection();

      // Check if a selection is active
      if (!selection.isEmpty) {
        vimState.recordedState.transformations.push({
          type: "deleteRange",
          range: new Range(selection.start as Position, selection.end as Position),
        });
      } else {
        if (line.length > 0 && line.match(/^ +$/) && Configuration.expandtab) {
          // If the line is empty except whitespace, backspace should return to
          // the next lowest level of indentation.

          const tabSize = vimState.editor.options.tabSize as number;
          const desiredLineLength = Math.floor((position.character - 1) / tabSize) * tabSize;

          vimState.recordedState.transformations.push({
            type: "deleteRange",
            range: new Range(new Position(position.line, desiredLineLength), new Position(position.line, line.length))
          });
        } else {
          if (position.line !== 0 || position.character !== 0) {
            vimState.recordedState.transformations.push({
              type: "deleteText",
              position: position,
            });
          }
        }
      }

      vimState.cursorPosition = vimState.cursorPosition.getLeft();
      vimState.cursorStartPosition = vimState.cursorStartPosition.getLeft();
    } else {
      if (vimState.isMultiCursor) {
        vimState.recordedState.transformations.push({
          type: "insertText",
          text: char,
          position: vimState.cursorPosition,
        });
      } else {
        vimState.recordedState.transformations.push({
          type: "insertTextVSCode",
          text: char,
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
class CommandInsertRegisterContent extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-r>", "<character>"];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.recordedState.registerName = this.keysPressed[1];
    const register = await Register.get(vimState);
    let text: string;

    if (register.text instanceof Array) {
      text = (register.text as string[]).join("\n");
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
    vimState.cursorStartPosition = Position.FromVSCodePosition(vimState.editor.selection.start);
    vimState.cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.start);

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
export class CommandOneNormalCommandInInsertMode extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-o>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.returnToInsertAfterCommand = true;
    return await new CommandEscInsertMode().exec(
      position.character === 0 ? position : position.getRight(),
      vimState);
  }
}
@RegisterAction
class CommandCtrlW extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-w>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    let wordBegin;
    if (position.isInLeadingWhitespace()) {
      wordBegin = position.getLineBegin();
    } else if (position.isLineBeginning()) {
      wordBegin = position.getPreviousLineBegin().getLineEnd();
    } else {
      wordBegin = position.getWordLeft();
    }

    await TextEditor.delete(new vscode.Range(wordBegin, position));

    vimState.cursorPosition = wordBegin;

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

    const tabSize = Configuration.tabstop;
    const newIndentationWidth = (indentationWidth / tabSize - 1) * tabSize;

    await TextEditor.replace(new vscode.Range(position.getLineBegin(), position.getLineEnd()),
      TextEditor.setIndentationLevel(originalText, newIndentationWidth < 0 ? 0 : newIndentationWidth));

    const cursorPosition = Position.FromVSCodePosition(position.with(position.line,
      position.character + (newIndentationWidth - indentationWidth) / tabSize));
    vimState.cursorPosition = cursorPosition;
    vimState.cursorStartPosition = cursorPosition;
    vimState.currentMode = ModeName.Insert;
    return vimState;
  }
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

    vimState.cursorStartPosition = Position.FromVSCodePosition(vimState.editor.selection.start);
    vimState.cursorPosition = Position.FromVSCodePosition(vimState.editor.selection.start);

    return vimState;
  }
}

@RegisterAction
class CommandCtrlHInInsertMode extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-h>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    vimState.recordedState.transformations.push({
      type: "deleteText",
      position: position,
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
class CommandCtrlN extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-n>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand("selectNextSuggestion");

    return vimState;
  }
}

@RegisterAction
class CommandCtrlP extends BaseCommand {
  modes = [ModeName.Insert];
  keys = ["<C-p>"];

  public async exec(position: Position, vimState: VimState): Promise<VimState> {
    await vscode.commands.executeCommand("selectPrevSuggestion");

    return vimState;
  }
}
