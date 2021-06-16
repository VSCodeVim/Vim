import * as vscode from 'vscode';

import { lineCompletionProvider } from '../../completion/lineCompletionProvider';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { PositionDiff } from './../../common/motion/position';
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
  CommandInsertAtLineBegin,
  CommandInsertAtLastChange,
} from './actions';
import { DefaultDigraphs } from './digraphs';
import { StatusBar } from '../../statusBar';
import { VimError, ErrorCode } from '../../error';
import { Position } from 'vscode';

@RegisterAction
export class CommandEscInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
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
        vimState.recordedState.transformer.delete(
          new vscode.Range(
            vimState.cursors[i].stop.getLineBegin(),
            vimState.cursors[i].stop.getLineEnd()
          )
        );
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
      typeOfInsert instanceof CommandInsertAtLineBegin ||
      typeOfInsert instanceof CommandInsertAtLineEnd ||
      typeOfInsert instanceof CommandInsertAtFirstCharacter ||
      typeOfInsert instanceof CommandInsertAtLastChange;

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
            ? PositionDiff.offset({ character: -1 })
            : PositionDiff.identity();

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
      vimState.isFakeMultiCursor = false;
    }
  }
}

@RegisterAction
export class CommandInsertPreviousText extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-a>'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const register = await Register.get('.');
    if (
      register === undefined ||
      !(register.text instanceof RecordedState) ||
      !register.text.actionsRun
    ) {
      throw VimError.fromCode(ErrorCode.NoInsertedTextYet);
    }

    const recordedState = register.text.clone();

    // The first action is entering Insert Mode, which is not necessary in this case
    recordedState.actionsRun.shift();

    // The last action is leaving Insert Mode, which is not necessary in this case
    recordedState.actionsRun.pop();

    if (recordedState.actionsRun?.[0] instanceof ArrowsInInsertMode) {
      // Note, arrow keys are the only Insert action command that can't be repeated here as far as @rebornix knows.
      recordedState.actionsRun.shift();
    }

    vimState.recordedState.transformer.addTransformation({
      type: 'replayRecordedState',
      recordedState,
    });
  }
}

@RegisterAction
class CommandInsertPreviousTextAndQuit extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-shift+2>']; // <C-@>

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await new CommandInsertPreviousText().exec(position, vimState);
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class IncreaseIndent extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-t>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const originalText = vimState.document.lineAt(position).text;
    const indentationWidth = TextEditor.getIndentationLevel(originalText);
    const tabSize = configuration.tabstop || Number(vimState.editor.options.tabSize);
    const newIndentationWidth = (Math.floor(indentationWidth / tabSize) + 1) * tabSize;

    vimState.recordedState.transformer.replace(
      new vscode.Range(position.getLineBegin(), position.with({ character: indentationWidth })),
      TextEditor.setIndentationLevel(originalText, newIndentationWidth).match(/^(\s*)/)![1]
    );
  }
}

@RegisterAction
class DecreaseIndent extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-d>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const originalText = vimState.document.lineAt(position).text;
    const indentationWidth = TextEditor.getIndentationLevel(originalText);
    const tabSize = configuration.tabstop || Number(vimState.editor.options.tabSize);
    const newIndentationWidth = (Math.floor(indentationWidth / tabSize) - 1) * tabSize;

    vimState.recordedState.transformer.replace(
      new vscode.Range(position.getLineBegin(), position.with({ character: indentationWidth })),
      TextEditor.setIndentationLevel(originalText, newIndentationWidth).match(/^(\s*)/)![1]
    );
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
class CommandBackspaceInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = [['<BS>'], ['<C-h>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const line = vimState.document.lineAt(position).text;
    const selection = vimState.editor.selections.find((s) => s.contains(position));

    const leadingSpaces = line.match(/\S/)?.index ?? line.length;

    if (selection && !selection.isEmpty) {
      // If a selection is active, delete it
      vimState.recordedState.transformer.delete(selection);
    } else if (
      position.character > 0 &&
      position.character <= leadingSpaces &&
      vimState.editor.options.insertSpaces
    ) {
      // We're in the leading whitespace - delete a tabstop
      const tabSize = vimState.editor.options.tabSize as number;
      const spacesToDelete = position.character % tabSize || tabSize;

      vimState.recordedState.transformer.delete(
        new vscode.Range(
          position.with({ character: position.character - spacesToDelete }),
          position
        )
      );
    } else if (!position.isAtDocumentBegin()) {
      // Otherwise, just delete a character (unless we're at the start of the document)
      vimState.recordedState.transformer.addTransformation({
        type: 'deleteText',
        position,
      });
    }

    vimState.cursorStopPosition = vimState.cursorStopPosition.getLeft();
    vimState.cursorStartPosition = vimState.cursorStartPosition.getLeft();
  }
}

@RegisterAction
class CommandDeleteInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<Del>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const selection = vimState.editor.selection;

    if (!selection.isEmpty) {
      // If a selection is active, delete it
      vimState.recordedState.transformer.delete(selection);
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

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const char = this.keysPressed[this.keysPressed.length - 1];

    vimState.recordedState.transformer.addTransformation({
      type: 'insertTextVSCode',
      text: char,
      isMultiCursor: vimState.isMultiCursor,
    });
  }

  public override toString(): string {
    return this.keysPressed[this.keysPressed.length - 1];
  }
}

@RegisterAction
class CommandInsertDigraph extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-k>', '<any>', '<any>'];
  override isCompleteAction = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
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
    vimState.recordedState.transformer.insert(position, char);
  }

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
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

  public override couldActionApply(vimState: VimState, keysPressed: string[]): boolean {
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
  override isCompleteAction = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (!Register.isValidRegister(this.keysPressed[1])) {
      return;
    }

    const register = await Register.get(this.keysPressed[1], this.multicursorIndex);
    if (register === undefined) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.NothingInRegister));
      return;
    }

    if (register.text instanceof RecordedState) {
      vimState.recordedState.transformer.addTransformation({
        type: 'macro',
        register: vimState.recordedState.registerName,
        replay: 'keystrokes',
      });

      return;
    }

    let text = register.text;
    if (register.registerMode === RegisterMode.LineWise && !vimState.isMultiCursor) {
      text += '\n';
    }

    vimState.recordedState.transformer.insert(position, text);
  }
}

@RegisterAction
class CommandOneNormalCommandInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-o>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.returnToInsertAfterCommand = true;
    vimState.actionCount = 0;
    await new CommandEscInsertMode().exec(position, vimState);
  }
}

@RegisterAction
class CommandCtrlW extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-w>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.isAtDocumentBegin()) {
      return;
    }

    let wordBegin: Position;
    if (position.isInLeadingWhitespace(vimState.document)) {
      wordBegin = position.getLineBegin();
    } else if (position.isLineBeginning()) {
      wordBegin = position.getUp().getLineEnd();
    } else {
      wordBegin = position.prevWordStart(vimState.document);
    }

    vimState.recordedState.transformer.delete(new vscode.Range(wordBegin, position));

    vimState.cursorStopPosition = wordBegin;
  }
}

@RegisterAction
export class InsertCharAbove extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-y>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.line === 0) {
      return;
    }

    const charPos = position.getUp();
    if (charPos.isLineEnd()) {
      return;
    }

    const char = vimState.document.getText(new vscode.Range(charPos, charPos.getRight()));

    vimState.recordedState.transformer.insert(position, char);
  }
}

@RegisterAction
export class InsertCharBelow extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-e>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (position.line >= vimState.document.lineCount - 1) {
      return;
    }

    const charPos = position.getDown();
    if (charPos.isLineEnd()) {
      return;
    }

    const char = vimState.document.getText(new vscode.Range(charPos, charPos.getRight()));

    vimState.recordedState.transformer.insert(position, char);
  }
}

@RegisterAction
class CommandCtrlUInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-u>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    let start: Position;
    if (position.character === 0) {
      start = position.getLeftThroughLineBreaks(true);
    } else if (position.isInLeadingWhitespace(vimState.document)) {
      start = position.getLineBegin();
    } else {
      start = position.getLineBeginRespectingIndent(vimState.document);
    }

    vimState.recordedState.transformer.delete(new vscode.Range(start, position));

    vimState.cursorStopPosition = start;
    vimState.cursorStartPosition = start;
  }
}

@RegisterAction
class CommandNavigateAutocompleteDown extends BaseCommand {
  modes = [Mode.Insert];
  keys = [['<C-n>'], ['<C-j>']];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('selectNextSuggestion');
  }
}

@RegisterAction
class CommandNavigateAutocompleteUp extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-p>'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vscode.commands.executeCommand('selectPrevSuggestion');
  }
}

@RegisterAction
class CommandCtrlVInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-v>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const clipboard = await Register.get('*', this.multicursorIndex);
    const text = clipboard?.text instanceof RecordedState ? undefined : clipboard?.text;

    if (text) {
      vimState.recordedState.transformer.insert(vimState.cursorStopPosition, text);
    }
  }
}

@RegisterAction
class CommandShowLineAutocomplete extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-x>', '<C-l>'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await lineCompletionProvider.showLineCompletionsQuickPick(position, vimState);
  }
}

@RegisterAction
class NewLineInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = [['<C-j>'], ['<C-m>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.addTransformation({
      type: 'insertText',
      text: '\n',
      position,
      diff: PositionDiff.offset({ character: -1 }),
    });
  }
}

@RegisterAction
class CommandReplaceAtCursorFromInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<Insert>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await new CommandReplaceAtCursorFromNormalMode().exec(position, vimState);
  }
}
