import * as vscode from 'vscode';

import { Position, Range } from 'vscode';
import { Cursor } from '../../common/motion/cursor';
import { lineCompletionProvider } from '../../completion/lineCompletionProvider';
import { VimError } from '../../error';
import { RecordedState } from '../../state/recordedState';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { getCursorsAfterSync, isHighSurrogate, isLowSurrogate } from '../../util/util';
import { BaseMovement } from '../baseMotion';
import { MoveDown, MoveLeft, MoveRight, MoveUp } from '../motion';
import { PositionDiff } from './../../common/motion/position';
import { configuration } from './../../configuration/configuration';
import { Mode } from './../../mode/mode';
import { Register, RegisterMode } from './../../register/register';
import { TextEditor } from './../../textEditor';
import { BaseCommand, RegisterAction } from './../base';
import { CommandNumber } from './actions';
import { DefaultDigraphs } from './digraphs';
import { DocumentContentChangeAction } from './documentChange';
import { EnterReplaceMode } from './replace';

@RegisterAction
export class Insert extends BaseCommand {
  modes = [Mode.Normal];
  keys = [['i'], ['<Insert>']];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
  }

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Only allow this command to be prefixed with a count or nothing, no other
    // actions or operators before
    let previousActionsNumbers = true;
    for (const prevAction of vimState.recordedState.actionsRun) {
      if (!(prevAction instanceof CommandNumber)) {
        previousActionsNumbers = false;
        break;
      }
    }

    if (vimState.recordedState.actionsRun.length === 0 || previousActionsNumbers) {
      return super.couldActionApply(vimState, keysPressed);
    }
    return false;
  }
}

@RegisterAction
export class Append extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['a'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStopPosition = vimState.cursorStartPosition = position.getRight();
  }

  public override doesActionApply(vimState: VimState, keysPressed: string[]): boolean {
    // Only allow this command to be prefixed with a count or nothing, no other actions or operators before
    if (!vimState.recordedState.actionsRun.every((action) => action instanceof CommandNumber)) {
      return false;
    }

    return super.couldActionApply(vimState, keysPressed);
  }
}

@RegisterAction
class InsertAtLastChange extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'i'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.cursorStopPosition = vimState.cursorStartPosition =
      vimState.historyTracker.getLastChangeEndPosition() ?? new Position(0, 0);

    await vimState.setCurrentMode(Mode.Insert);
  }
}

@RegisterAction
class InsertAfterFirstWhitespaceOnLine extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['I'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStopPosition = vimState.cursorStartPosition =
      TextEditor.getFirstNonWhitespaceCharOnLine(vimState.document, position.line);
  }
}

@RegisterAction
class InsertAtLineBegin extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['g', 'I'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStopPosition = vimState.cursorStartPosition = position.getLineBegin();
  }
}

@RegisterAction
class InsertAtLineEnd extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['A'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    vimState.cursorStopPosition = vimState.cursorStartPosition = position.getLineEnd();
  }
}

@RegisterAction
class InsertAbove extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['O'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async execCount(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    const count = vimState.recordedState.count || 1;

    const charPos = position.getLineBeginRespectingIndent(vimState.document).character;

    for (let i = 0; i < count; i++) {
      await vscode.commands.executeCommand('editor.action.insertLineBefore');
    }

    vimState.cursors = getCursorsAfterSync(vimState.editor);
    const endPos = vimState.cursor.start.character;
    const indentAmt = charPos - endPos;

    for (let i = 0; i < count; i++) {
      const newPos = new Position(vimState.cursor.start.line + i, charPos);
      if (i === 0) {
        vimState.cursor = Cursor.atPosition(newPos);
      } else {
        vimState.cursors.push(Cursor.atPosition(newPos));
      }
      if (indentAmt >= 0) {
        vimState.recordedState.transformer.addTransformation({
          type: 'insertText',
          // TODO: Use `editor.options.insertSpaces`, I think
          text: TextEditor.setIndentationLevel('', indentAmt, configuration.expandtab),
          position: newPos,
          cursorIndex: i,
          manuallySetCursorPositions: true,
        });
      } else {
        vimState.recordedState.transformer.addTransformation({
          type: 'deleteRange',
          cursorIndex: i,
          range: new Range(newPos, new Position(newPos.line, endPos)),
          manuallySetCursorPositions: true,
        });
      }
    }
    vimState.cursors = vimState.cursors.reverse();
    vimState.isFakeMultiCursor = true;
  }
}

@RegisterAction
class InsertBelow extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['o'];
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async execCount(position: Position, vimState: VimState): Promise<void> {
    await vimState.setCurrentMode(Mode.Insert);
    const count = vimState.recordedState.count || 1;

    for (let i = 0; i < count; i++) {
      await vscode.commands.executeCommand('editor.action.insertLineAfter');
    }
    vimState.cursors = getCursorsAfterSync(vimState.editor);
    for (let i = 1; i < count; i++) {
      const newPos = new Position(
        vimState.cursorStartPosition.line - i,
        vimState.cursorStartPosition.character,
      );
      vimState.cursors.push(Cursor.atPosition(newPos));

      // Ahhhhhh. We have to manually set cursor position here as we need text
      // transformations AND to set multiple cursors.
      vimState.recordedState.transformer.addTransformation({
        type: 'insertText',
        // TODO: Use `editor.options.insertSpaces`, I think
        text: TextEditor.setIndentationLevel('', newPos.character, configuration.expandtab),
        position: newPos,
        cursorIndex: i,
        manuallySetCursorPositions: true,
      });
    }
    vimState.cursors = vimState.cursors.reverse();
    vimState.isFakeMultiCursor = true;
  }
}

@RegisterAction
export class ExitInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    void vscode.commands.executeCommand('closeParameterHints');
    void vscode.commands.executeCommand('editor.action.inlineSuggest.hide');

    vimState.cursors = vimState.cursors.map((x) => x.withNewStop(x.stop.getLeft()));
    if (vimState.returnToInsertAfterCommand && position.character !== 0) {
      vimState.cursors = vimState.cursors.map((x) => x.withNewStop(x.stop.getRight()));
    }

    // only remove leading spaces inserted by vscode.
    // vscode only inserts them when user enter a new line,
    // ie, o/O in Normal mode or \n in Insert mode.
    const lastActionBeforeEsc =
      vimState.recordedState.actionsRun[vimState.recordedState.actionsRun.length - 2];
    if (
      vimState.document.languageId !== 'plaintext' &&
      (lastActionBeforeEsc instanceof InsertBelow ||
        lastActionBeforeEsc instanceof InsertAbove ||
        (lastActionBeforeEsc instanceof DocumentContentChangeAction &&
          lastActionBeforeEsc.keysPressed[lastActionBeforeEsc.keysPressed.length - 1] === '\n'))
    ) {
      for (const cursor of vimState.cursors) {
        const line = vimState.document.lineAt(cursor.stop);
        if (line.text.length > 0 && line.isEmptyOrWhitespace) {
          vimState.recordedState.transformer.delete(line.range);
        }
      }
    }
    await vimState.setCurrentMode(Mode.Normal);

    // If we wanted to repeat this insert (only for i and a), now is the time to do it. Insert
    // count amount of these strings before returning back to normal mode
    const shouldRepeatInsert =
      vimState.recordedState.count > 1 &&
      vimState.recordedState.actionsRun.find(
        (a) =>
          a instanceof Insert ||
          a instanceof Append ||
          a instanceof InsertAtLineBegin ||
          a instanceof InsertAtLineEnd ||
          a instanceof InsertAfterFirstWhitespaceOnLine ||
          a instanceof InsertAtLastChange,
      ) !== undefined;

    // If this is the type to repeat insert, do this now
    if (shouldRepeatInsert) {
      const changeAction = vimState.recordedState.actionsRun
        .slice()
        .reverse()
        .find((a) => a instanceof DocumentContentChangeAction);
      if (changeAction instanceof DocumentContentChangeAction) {
        // Add count amount of inserts in the case of 4i=<esc>
        // TODO: A few actions such as <C-t> should be repeated, but are not
        for (let i = 0; i < vimState.recordedState.count - 1; i++) {
          // If this is the last transform, move cursor back one character
          const positionDiff =
            i === vimState.recordedState.count - 2
              ? PositionDiff.offset({ character: -1 })
              : PositionDiff.identity();

          // Add a transform containing the change
          vimState.recordedState.transformer.addTransformation(
            changeAction.getTransformation(positionDiff),
          );
        }
      }
    }

    vimState.historyTracker.currentContentChanges = [];

    if (vimState.isFakeMultiCursor) {
      vimState.cursors = [vimState.cursor];
      vimState.isFakeMultiCursor = false;
    }
  }
}

@RegisterAction
export class BackspaceInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = [['<BS>'], ['<C-h>']];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.vscodeCommand('deleteLeft');
  }
}

@RegisterAction
export class TypeInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<character>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const char = this.keysPressed.at(-1)!;

    let text = char;

    if (char.length === 1) {
      const prevHighSurrogate =
        vimState.modeData.mode === Mode.Insert ? vimState.modeData.highSurrogate : undefined;

      if (isHighSurrogate(char.charCodeAt(0))) {
        await vimState.setModeData({
          mode: Mode.Insert,
          highSurrogate: char,
        });

        if (prevHighSurrogate === undefined) return;
        text = prevHighSurrogate;
      } else {
        if (isLowSurrogate(char.charCodeAt(0)) && prevHighSurrogate !== undefined) {
          text = prevHighSurrogate + char;
        }

        await vimState.setModeData({
          mode: Mode.Insert,
          highSurrogate: undefined,
        });
      }
    }

    vimState.recordedState.transformer.addTransformation({
      type: 'insertTextVSCode',
      text,
      isMultiCursor: vimState.isMultiCursor,
    });
  }

  public override toString(): string {
    return this.keysPressed.at(-1)!;
  }
}

@RegisterAction
export class InsertPreviousText extends BaseCommand {
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
      throw VimError.NoInsertedTextYet();
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
      count: 1,
      recordedState,
    });
  }
}

@RegisterAction
class InsertPreviousTextAndQuit extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-shift+2>']; // <C-@>

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await new InsertPreviousText().exec(position, vimState);
    await vimState.setCurrentMode(Mode.Normal);
  }
}

abstract class IndentCommand extends BaseCommand {
  modes = [Mode.Insert];
  abstract readonly delta: number;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const line = vimState.document.lineAt(position);
    const tabSize = Number(vimState.editor.options.tabSize);
    const indentationWidth = TextEditor.getIndentationLevel(line.text, tabSize);
    const newIndentationWidth = (Math.floor(indentationWidth / tabSize) + this.delta) * tabSize;

    vimState.recordedState.transformer.replace(
      new Range(
        position.getLineBegin(),
        position.with({ character: line.firstNonWhitespaceCharacterIndex }),
      ),
      TextEditor.setIndentationLevel(
        line.text,
        newIndentationWidth,
        vimState.editor.options.insertSpaces as boolean,
      ).match(/^(\s*)/)![1],
    );
  }
}

@RegisterAction
class IncreaseIndent extends IndentCommand {
  keys = ['<C-t>'];
  override readonly delta = 1;
}
@RegisterAction
class DecreaseIndent extends IndentCommand {
  keys = ['<C-d>'];
  override readonly delta = -1;
}

@RegisterAction
class DeleteInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<Del>'];

  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.recordedState.transformer.vscodeCommand('deleteRight');
  }
}

@RegisterAction
class InsertDigraph extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-k>', '<any>', '<any>'];
  override isCompleteAction = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const digraph = this.keysPressed.slice(1, 3).join('');
    const reverseDigraph = digraph.split('').reverse().join('');
    let charCodes = (DefaultDigraphs.get(digraph) ||
      DefaultDigraphs.get(reverseDigraph) ||
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
      DefaultDigraphs.has(chars) ||
      DefaultDigraphs.has(reverseChars)
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
        [...DefaultDigraphs.keys()].find(predicate);
      return match !== undefined;
    }
    return true;
  }
}

@RegisterAction
class InsertRegisterContent extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-r>', '<character>'];
  override isCompleteAction = false;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    const registerKey = this.keysPressed[1];
    if (!Register.isValidRegister(registerKey)) {
      return;
    }

    const register = await Register.get(registerKey, this.multicursorIndex);
    if (register === undefined) {
      StatusBar.displayError(vimState, VimError.NothingInRegister(registerKey));
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
class ExecuteOneNormalCommandInInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-o>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.returnToInsertAfterCommand = true;
    vimState.actionCount = 0;
    await new ExitInsertMode().exec(position, vimState);
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
    if (charPos.isLineEnd(vimState.document)) {
      return;
    }

    const char = vimState.document.getText(new Range(charPos, charPos.getRight()));

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
    if (charPos.isLineEnd(vimState.document)) {
      return;
    }

    const char = vimState.document.getText(new Range(charPos, charPos.getRight()));

    vimState.recordedState.transformer.insert(position, char);
  }
}

@RegisterAction
class DeleteWord extends BaseCommand {
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

    vimState.recordedState.transformer.delete(new Range(wordBegin, position));

    vimState.cursorStopPosition = wordBegin;
  }
}

@RegisterAction
class DeleteAllBeforeCursor extends BaseCommand {
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

    vimState.recordedState.transformer.delete(new Range(start, position));

    vimState.cursorStopPosition = start;
    vimState.cursorStartPosition = start;
  }
}

@RegisterAction
class SelectNextSuggestion extends BaseCommand {
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
class SelectPrevSuggestion extends BaseCommand {
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
class CtrlVInInsertMode extends BaseCommand {
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
class ShowLineAutocomplete extends BaseCommand {
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
    vimState.recordedState.transformer.insert(
      position,
      '\n',
      PositionDiff.offset({ character: -1 }),
    );
  }
}

@RegisterAction
class ReplaceAtCursorFromInsertMode extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<Insert>'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await new EnterReplaceMode().exec(position, vimState);
  }
}

@RegisterAction
class CreateUndoPoint extends BaseCommand {
  modes = [Mode.Insert];
  keys = ['<C-g>', 'u'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    vimState.historyTracker.addChange(true);
    vimState.historyTracker.finishCurrentStep();
  }
}

@RegisterAction
export class ArrowsInInsertMode extends BaseMovement {
  override modes = [Mode.Insert];
  keys = [['<up>'], ['<down>'], ['<left>'], ['<right>']];

  public override async execAction(position: Position, vimState: VimState): Promise<Position> {
    // Moving with the arrow keys in Insert mode "resets" our insertion for the purpose of repeating with dot or `<C-a>`.
    // No matter how we got into Insert mode, repeating will now be done as if we started with `i`.
    // Note that this does not affect macros, which re-construct a list of actions based on keypresses.
    // TODO: ACTUALLY, we should reset this only after something is typed (`Axyz<Left><Esc>.` does repeat the insertion)
    // TODO: This also should mark an "insertion end" for the purpose of `<C-a>` (try `ixyz<Right><C-a>`)
    vimState.recordedState.actionsRun = [new Insert()];

    // Force an undo point to be created
    vimState.historyTracker.addChange(true);
    vimState.historyTracker.finishCurrentStep();

    let newPosition: Position;
    switch (this.keysPressed[0]) {
      case '<up>':
        newPosition = await new MoveUp(this.keysPressed).execAction(position, vimState);
        break;
      case '<down>':
        newPosition = await new MoveDown(this.keysPressed).execAction(position, vimState);
        break;
      case '<left>':
        newPosition = await new MoveLeft(this.keysPressed).execAction(position, vimState);
        break;
      case '<right>':
        newPosition = await new MoveRight(this.keysPressed).execAction(position, vimState);
        break;
      default:
        throw new Error(`Unexpected 'arrow' key: ${this.keys[0]}`);
    }
    return newPosition;
  }
}
