import * as vscode from 'vscode';

import { lineCompletionProvider } from '../../completion/lineCompletionProvider';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { PositionDiff } from './../../common/motion/position';
import { Range } from './../../common/motion/range';
import { configuration } from './../../configuration/configuration';
import { Mode } from './../../mode/mode';
import { Register, RegisterMode } from './../../register/register';
import { TextEditor } from './../../textEditor';
import { RegisterAction, BaseCommand } from './../base';
import { ArrowsInInsertMode } from './../motion';
import {
  CommandInsertAfterCursor,
  CommandInsertAtCursor,
  CommandInsertAtFirstCharacter,
  CommandInsertAtLineEnd,
  DocumentContentChangeAction,
  CommandReplaceAtCursorFromNormalMode,
} from './actions';
import { DefaultDigraphs } from './digraphs';
import { Clipboard } from '../../util/clipboard';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';
import { Position } from 'vscode';
import { PutCommand } from './put';

@RegisterAction
class CommandEscInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vscode.commands.executeCommand('closeParameterHints');

    vimState.cursors = vimState.cursors.map((x) => x.withNewStop(x.stop.getLeft()));
    if (vimState.returnToInsertAfterCommand && position.character !== 0) {
      vimState.cursors = vimState.cursors.map((x) => x.withNewStop(x.stop.getRight()));
    }

    // only remove leading spaces inserted by vscode.
    // vscode only inserts them when user enter a new line,
    // ie, o/O in Normal mode or \n in Insert mode.
    for (let i = 0; i < vimState.cursors.length; i++) {
      const lastActionBeforeEsc = vimState.keyHistory[vimState.keyHistory.length - 2];
      if (
        ['o', 'O', '\n'].includes(lastActionBeforeEsc) &&
        vimState.document.languageId !== 'plaintext' &&
        /^\s+$/.test(vimState.document.lineAt(vimState.cursors[i].stop).text)
      ) {
        vimState.recordedState.transformer.addTransformation({
          type: 'deleteRange',
          range: new Range(
            vimState.cursors[i].stop.getLineBegin(),
            vimState.cursors[i].stop.getLineEnd()
          ),
        });
        vimState.cursors[i] = vimState.cursors[i].withNewStop(
          vimState.cursors[i].stop.getLineBegin()
        );
      }
    }
    await vimState.setCurrentMode(Mode.Normal);

    // If we wanted to repeat this insert (only for i and a), now is the time to do it. Insert
    // count amount of these strings before returning back to normal mode
    const typeOfInsert =
      vimState.recordedState.actionsRun[vimState.recordedState.actionsRun.length - 3];
    const isTypeToRepeatInsert =
      typeOfInsert instanceof CommandInsertAtCursor ||
      typeOfInsert instanceof CommandInsertAfterCursor ||
      typeOfInsert instanceof CommandInsertAtLineEnd ||
      typeOfInsert instanceof CommandInsertAtFirstCharacter;

    // If this is the type to repeat insert, do this now
    if (vimState.recordedState.count > 1 && isTypeToRepeatInsert) {
      const changeAction = vimState.recordedState.actionsRun[
        vimState.recordedState.actionsRun.length - 2
      ] as DocumentContentChangeAction;

      // Add count amount of inserts in the case of 4i=<esc>
      for (let i = 0; i < vimState.recordedState.count - 1; i++) {
        // If this is the last transform, move cursor back one character
        const positionDiff =
          i === vimState.recordedState.count - 2
            ? new PositionDiff({ character: -1 })
            : new PositionDiff();

        // Add a transform containing the change
        vimState.recordedState.transformer.addTransformation(
          changeAction.getTransformation(positionDiff)
        );
      }
    }

    if (vimState.historyTracker.currentContentChanges.length > 0) {
      vimState.historyTracker.lastContentChanges = vimState.historyTracker.currentContentChanges;
      vimState.historyTracker.currentContentChanges = [];
    }

    if (vimState.isFakeMultiCursor) {
      vimState.cursors = [vimState.cursors[0]];
      vimState.isMultiCursor = false;
      vimState.isFakeMultiCursor = false;
    }
  }
}

@RegisterAction
export class CommandInsertPreviousText extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-a>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const register = await Register.get(vimState, '.');
    if (
      register === undefined ||
      !(register.text instanceof RecordedState) ||
      !register.text.actionsRun
    ) {
      throw VimError.fromCode(ErrorCode.NoInsertedTextYet);
    }

    const actions = [...register.text.actionsRun];
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
        await action.execCount(vimState.cursorStopPosition, vimState);
      }

      if (action instanceof DocumentContentChangeAction) {
        await action.exec(vimState.cursorStopPosition, vimState);
      }
    }

    vimState.cursorStopPosition = vimState.editor.selection.end;
    vimState.cursorStartPosition = vimState.editor.selection.start;
    await vimState.setCurrentMode(Mode.Insert);
  }
}

@RegisterAction
class CommandInsertPreviousTextAndQuit extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-shift+2>']; // <C-@>

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await new CommandInsertPreviousText().exec(position, vimState);
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandInsertBelowChar extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-e>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.line === vimState.document.lineCount - 1) {
      return;
    }

    const charBelowCursorPosition = position.getDown();

    if (charBelowCursorPosition.isLineEnd()) {
      return;
    }

    const char = vimState.document.getText(
      new vscode.Range(charBelowCursorPosition, charBelowCursorPosition.getRight())
    );
    await TextEditor.insert(vimState.editor, char, position);

    vimState.cursorStartPosition = vimState.editor.selection.start;
    vimState.cursorStopPosition = vimState.editor.selection.start;
  }
}

@RegisterAction
class CommandInsertIndentInCurrentLine extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-t>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const originalText = vimState.document.lineAt(position).text;
    const indentationWidth = TextEditor.getIndentationLevel(originalText);
    const tabSize = configuration.tabstop || Number(vimState.editor.options.tabSize);
    const newIndentationWidth = (indentationWidth / tabSize + 1) * tabSize;

    vimState.recordedState.transformer.addTransformation({
      type: 'replaceText',
      text: TextEditor.setIndentationLevel(originalText, newIndentationWidth),
      range: new Range(position.getLineBegin(), position.getLineEnd()),
      diff: new PositionDiff({ character: newIndentationWidth - indentationWidth }),
    });
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

//   public async exec(position: Position, vimState: VimState): Promise<void> {
//     vimState.recordedState.transformer.addTransformation({
//       type: "tab"
//     });
//   }
// }

@RegisterAction
export class CommandBackspaceInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<BS>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const line = vimState.document.lineAt(position).text;
    const selection = vimState.editor.selections.find((s) => s.contains(position));

    if (selection && !selection.isEmpty) {
      // If a selection is active, delete it
      vimState.recordedState.transformer.addTransformation({
        type: 'deleteRange',
        range: new Range(selection.start, selection.end),
      });
    } else if (
      position.character > 0 &&
      line.length > 0 &&
      line.match(/^\s+$/) &&
      configuration.expandtab
    ) {
      // If the line is empty except whitespace and we're not on the first
      // character of the line, backspace should return to the next lowest
      // level of indentation.
      // TODO: similar logic is needed for whitespace at the start or end of a line. See #1691

      const tabSize = vimState.editor.options.tabSize as number;
      const desiredLineLength = Math.floor((position.character - 1) / tabSize) * tabSize;

      vimState.recordedState.transformer.addTransformation({
        type: 'deleteRange',
        range: new Range(position.withColumn(desiredLineLength), position.withColumn(line.length)),
      });
    } else if (!position.isAtDocumentBegin()) {
      // Otherwise, just delete a character (unless we're at the start of the document)
      vimState.recordedState.transformer.addTransformation({
        type: 'deleteText',
        position: position,
      });
    }

    vimState.cursorStopPosition = vimState.cursorStopPosition.getLeft();
    vimState.cursorStartPosition = vimState.cursorStartPosition.getLeft();
  }
}

@RegisterAction
export class CommandDeleteInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<Del>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const selection = vimState.editor.selection;

    if (!selection.isEmpty) {
      // If a selection is active, delete it
      vimState.recordedState.transformer.addTransformation({
        type: 'deleteRange',
        range: new Range(selection.start, selection.end),
      });
    } else if (!position.isAtDocumentEnd()) {
      // Otherwise, just delete a character (unless we're at the end of the document)
      vimState.recordedState.transformer.addTransformation({
        type: 'deleteText',
        position: position.getRightThroughLineBreaks(true),
      });
    }
  }
}

@RegisterAction
export class CommandInsertInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<character>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const char = this.keysPressed[this.keysPressed.length - 1];

    vimState.recordedState.transformer.addTransformation({
      type: 'insertTextVSCode',
      text: char,
      isMultiCursor: vimState.isMultiCursor,
    });
  }

  public toString(): string {
    return this.keysPressed[this.keysPressed.length - 1];
  }
}

@RegisterAction
class CommandInsertDigraph extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-k>', '<any>', '<any>'];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const digraph = this.keysPressed.slice(1, 3).join('');
    const reverseDigraph = digraph.split('').reverse().join('');
    let charCodes = (DefaultDigraphs[digraph] ||
      DefaultDigraphs[reverseDigraph] ||
      configuration.digraphs[digraph] ||
      configuration.digraphs[reverseDigraph])[1];
    if (!(charCodes instanceof Array)) {
      charCodes = [charCodes];
    }
    const char = String.fromCharCode(...charCodes);
    await TextEditor.insertAt(vimState.editor, char, position);
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStartPosition = vimState.editor.selection.start;
    vimState.cursorStopPosition = vimState.editor.selection.start;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (!super.doesActionApply(vimState, keysPressed)) {
      return false;
    }
    const chars = keysPressed.slice(1, 3).join('');
    const reverseChars = chars.split('').reverse().join('');
    return (
      chars in configuration.digraphs ||
      reverseChars in configuration.digraphs ||
      chars in DefaultDigraphs ||
      reverseChars in DefaultDigraphs
    );
  }

  public couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
    if (!super.couldActionApply(vimState, keysPressed)) {
      return false;
    }
    const chars = keysPressed.slice(1, keysPressed.length).join('');
    const reverseChars = chars.split('').reverse().join('');
    if (chars.length > 0) {
      const predicate = (digraph: string) => {
        const digraphChars = digraph.substring(0, chars.length);
        return chars === digraphChars || reverseChars === digraphChars;
      };
      const match =
        Object.keys(configuration.digraphs).find(predicate) ||
        Object.keys(DefaultDigraphs).find(predicate);
      return match !== undefined;
    }
    return true;
  }
}

@RegisterAction
class CommandInsertRegisterContent extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-r>', '<character>'];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.registerName = this.keysPressed[1];
    const register = await Register.get(vimState);
    if (register === undefined) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.NothingInRegister));
      return;
    }

    let text: string;
    if (register.text instanceof Array) {
      text =
        // when we yanked with MC and insert with MC, we insert register[i] at cusor[i]
        vimState.isMultiCursor && vimState.cursors.length === register.text.length
          ? await PutCommand.getText(vimState, register, this.multicursorIndex)
          : register.text.join('\n');
    } else if (register.text instanceof RecordedState) {
      vimState.recordedState.transformer.addTransformation({
        type: 'macro',
        register: vimState.recordedState.registerName,
        replay: 'keystrokes',
      });

      return;
    } else {
      text = register.text;
    }

    if (register.registerMode === RegisterMode.LineWise && !vimState.isMultiCursor) {
      text += '\n';
    }

    vimState.recordedState.transformer.addTransformation({
      type: 'insertText',
      text: text,
      position: position,
    });
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStartPosition = vimState.editor.selection.start;
    vimState.cursorStopPosition = vimState.editor.selection.start;
  }

  public doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    const register = keysPressed[1];

    return super.doesActionApply(vimState, keysPressed) && Register.isValidRegister(register);
  }
}

@RegisterAction
export class CommandOneNormalCommandInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-o>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.returnToInsertAfterCommand = true;
    vimState.actionCount = 0;
    await new CommandEscInsertMode().exec(position, vimState);
  }
}

@RegisterAction
class CommandCtrlW extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-w>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    let wordBegin: Position;
    if (position.isInLeadingWhitespace()) {
      wordBegin = position.getLineBegin();
    } else if (position.isLineBeginning()) {
      wordBegin = position.getPreviousLineBegin().getLineEnd();
    } else {
      wordBegin = position.getWordLeft();
    }

    vimState.recordedState.transformer.addTransformation({
      type: 'deleteRange',
      range: new Range(wordBegin, position),
    });

    vimState.cursorStopPosition = wordBegin;
  }
}

@RegisterAction
class CommandDeleteIndentInCurrentLine extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-d>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const originalText = vimState.document.lineAt(position).text;
    const indentationWidth = TextEditor.getIndentationLevel(originalText);

    if (indentationWidth === 0) {
      return;
    }

    const tabSize = configuration.tabstop;
    const newIndentationWidth = (indentationWidth / tabSize - 1) * tabSize;

    await TextEditor.replace(
      vimState.editor,
      new vscode.Range(position.getLineBegin(), position.getLineEnd()),
      TextEditor.setIndentationLevel(
        originalText,
        newIndentationWidth < 0 ? 0 : newIndentationWidth
      )
    );

    const cursorPosition = position.with(
      position.line,
      position.character + (newIndentationWidth - indentationWidth) / tabSize
    );
    vimState.cursorStopPosition = cursorPosition;
    vimState.cursorStartPosition = cursorPosition;
    await vimState.setCurrentMode(Mode.Insert);
  }
}

@RegisterAction
class CommandInsertAboveChar extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-y>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (TextEditor.isFirstLine(position)) {
      return;
    }

    const charAboveCursorPosition = position.getUp(1);

    if (charAboveCursorPosition.isLineEnd()) {
      return;
    }

    const char = vimState.document.getText(
      new vscode.Range(charAboveCursorPosition, charAboveCursorPosition.getRight())
    );
    await TextEditor.insert(vimState.editor, char, position);

    vimState.cursorStartPosition = vimState.editor.selection.start;
    vimState.cursorStopPosition = vimState.editor.selection.start;
  }
}

@RegisterAction
class CommandCtrlHInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-h>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.addTransformation({
      type: 'deleteText',
      position: position,
    });
  }
}

@RegisterAction
class CommandCtrlUInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-u>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const start = position.isInLeadingWhitespace()
      ? position.getLineBegin()
      : position.getLineBeginRespectingIndent();
    vimState.recordedState.transformer.addTransformation({
      type: 'deleteRange',
      range: new Range(start, position),
    });
    vimState.cursorStopPosition = start;
    vimState.cursorStartPosition = start;
  }
}

@RegisterAction
class CommandNavigateAutocompleteDown extends BaseCommand {
  modes = [Mode.Insert];
  keys = [['<C-n>'], ['<C-j>']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    /* if we're in a multi cursor state, we check to see if the current active text selection
     * is the same as the position we've been passed when we exec this function
     * this has the effect of only ever executing `selectNextSuggestion` once.
     * without this we execute it once per multi cursor, meaning it skips over the autocomplete
     * list suggestions
     */
    if (vimState.isMultiCursor) {
      const selection = vimState.editor.selection;
      if (
        selection.active.line === position.line &&
        selection.active.character === position.character
      ) {
        await vscode.commands.executeCommand('selectNextSuggestion');
      }
    } else {
      await vscode.commands.executeCommand('selectNextSuggestion');
    }
  }
}

@RegisterAction
class CommandNavigateAutocompleteUp extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-p>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    /* if we're in a multi cursor state, we check to see if the current active text selection
     * is the same as the position we've been passed when we exec this function
     * this has the effect of only ever executing `selectPrevSuggestion` once.
     * without this we execute it once per multi cursor, meaning it skips over the autocomplete
     * list suggestions
     */
    if (vimState.isMultiCursor) {
      const selection = vimState.editor.selection;
      if (
        selection.active.line === position.line &&
        selection.active.character === position.character
      ) {
        await vscode.commands.executeCommand('selectPrevSuggestion');
      }
    } else {
      await vscode.commands.executeCommand('selectPrevSuggestion');
    }
  }
}

@RegisterAction
class CommandCtrlVInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-v>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const textFromClipboard = await Clipboard.Paste();

    vimState.recordedState.transformer.addTransformation({
      type: 'deleteRange',
      range: new Range(vimState.cursorStartPosition, vimState.cursorStopPosition),
    });

    if (vimState.isMultiCursor) {
      vimState.recordedState.transformer.addTransformation({
        type: 'insertText',
        text: textFromClipboard,
        position: vimState.cursorStopPosition,
      });
    } else {
      vimState.recordedState.transformer.addTransformation({
        type: 'insertTextVSCode',
        text: textFromClipboard,
      });
    }
  }
}

@RegisterAction
class CommandShowLineAutocomplete extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-x>', '<C-l>'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await lineCompletionProvider.showLineCompletionsQuickPick(position, vimState);
  }
}

@RegisterAction
class NewLineInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = [['<C-j>'], ['<C-m>']];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.addTransformation({
      type: 'insertText',
      text: '\n',
      position: position,
      diff: new PositionDiff({ character: -1 }),
    });
  }
}

@RegisterAction
class CommandReplaceAtCursorFromInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<Insert>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await new CommandReplaceAtCursorFromNormalMode().exec(position, vimState);
  }
}
