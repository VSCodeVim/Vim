import * as vscode from 'vscode';

import { RegisterAction, BaseCommand } from '../base';
import { CommandShowCommandHistory, CommandShowSearchHistory } from './actions';
import { Mode } from '../../mode/mode';
import { VimState } from '../../state/vimState';
import { commandLine } from '../../cmd_line/commandLine';
import { globalState } from '../../state/globalState';
import { Register, RegisterMode } from '../../register/register';
import { reportSearch } from '../../util/statusBarTextUtils';
import { RecordedState } from '../../state/recordedState';
import { TextEditor } from '../../textEditor';
import { StatusBar } from '../../statusBar';
import { commandParsers } from '../../cmd_line/subparser';
import { getPathDetails, readDirectory } from '../../util/path';
import { Clipboard } from '../../util/clipboard';
import { VimError, ErrorCode } from '../../error';
import { SearchDirection } from '../../state/searchState';
import { scrollView } from '../../util/util';
import { getWordLeftInText } from '../../textobject/word';
import { Position } from 'vscode';

/**
 * Commands that are only relevant when entering a command or search
 */

// TODO: Much of the code in this file is duplicated.
//       We need an interface to the status bar which can be used by both modes.

// Command tab backward from behind shift tab
@RegisterAction
class CommandTabInCommandline extends BaseCommand {
  modes = [Mode.CommandlineInProgress];
  keys = [['<tab>'], ['<S-tab>']];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  private cycleCompletion(vimState: VimState, isTabForward: boolean) {
    const autoCompleteItems = commandLine.autoCompleteItems;
    if (autoCompleteItems.length === 0) {
      return;
    }

    commandLine.autoCompleteIndex = isTabForward
      ? (commandLine.autoCompleteIndex + 1) % autoCompleteItems.length
      : (commandLine.autoCompleteIndex - 1 + autoCompleteItems.length) % autoCompleteItems.length;

    const lastPos = commandLine.preCompleteCharacterPos;
    const lastCmd = commandLine.preCompleteCommand;
    const evalCmd = lastCmd.slice(0, lastPos);
    const restCmd = lastCmd.slice(lastPos);

    vimState.currentCommandlineText =
      evalCmd + autoCompleteItems[commandLine.autoCompleteIndex] + restCmd;
    vimState.statusBarCursorCharacterPos = vimState.currentCommandlineText.length - restCmd.length;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const key = this.keysPressed[0];
    const isTabForward = key === '<tab>';

    if (
      commandLine.autoCompleteItems.length !== 0 &&
      this.keys.some((k) => commandLine.lastKeyPressed === k[0])
    ) {
      this.cycleCompletion(vimState, isTabForward);
      commandLine.lastKeyPressed = key;
      return;
    }

    let newCompletionItems: string[] = [];
    const currentCmd = vimState.currentCommandlineText;
    const cursorPos = vimState.statusBarCursorCharacterPos;

    // Sub string since vim does completion before the cursor
    let evalCmd = currentCmd.slice(0, cursorPos);
    let restCmd = currentCmd.slice(cursorPos);

    // \s* is the match the extra space before any character like ':  edit'
    const cmdRegex = /^\s*\w+$/;
    const fileRegex = /^\s*\w+\s+/g;
    if (cmdRegex.test(evalCmd)) {
      // Command completion
      newCompletionItems = Object.keys(commandParsers)
        .filter((cmd) => cmd.startsWith(evalCmd))
        // Remove the already typed portion in the array
        .map((cmd) => cmd.slice(cmd.search(evalCmd) + evalCmd.length))
        .sort();
    } else if (fileRegex.exec(evalCmd)) {
      // File completion by searching if there is a space after the first word/command
      // ideally it should be a process of white-listing to selected commands like :e and :vsp
      let filePathInCmd = evalCmd.substring(fileRegex.lastIndex);
      const currentUri = vimState.document.uri;
      const isRemote = !!vscode.env.remoteName;

      const { fullDirPath, baseName, partialPath, path: p } = getPathDetails(
        filePathInCmd,
        currentUri,
        isRemote
      );
      // Update the evalCmd in case of windows, where we change / to \
      evalCmd = evalCmd.slice(0, fileRegex.lastIndex) + partialPath;

      // test if the baseName is . or ..
      const shouldAddDotItems = /^\.\.?$/g.test(baseName);
      const dirItems = await readDirectory(
        fullDirPath,
        p.sep,
        currentUri,
        isRemote,
        shouldAddDotItems
      );
      newCompletionItems = dirItems
        .filter((name) => name.startsWith(baseName))
        .map((name) => name.slice(name.search(baseName) + baseName.length))
        .sort();
    }

    const newIndex = isTabForward ? 0 : newCompletionItems.length - 1;
    commandLine.autoCompleteIndex = newIndex;
    // If here only one items we fill cmd direct, so the next tab will not cycle the one item array
    commandLine.autoCompleteItems = newCompletionItems.length <= 1 ? [] : newCompletionItems;
    commandLine.preCompleteCharacterPos = cursorPos;
    commandLine.preCompleteCommand = evalCmd + restCmd;

    const completion = newCompletionItems.length === 0 ? '' : newCompletionItems[newIndex];
    vimState.currentCommandlineText = evalCmd + completion + restCmd;
    vimState.statusBarCursorCharacterPos = vimState.currentCommandlineText.length - restCmd.length;

    commandLine.lastKeyPressed = key;
  }
}

@RegisterAction
class CommandEnterInCommandline extends BaseCommand {
  modes = [Mode.CommandlineInProgress];
  keys = [['\n'], ['<C-m>']];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    await commandLine.Run(vimState.currentCommandlineText, vimState);
    await vimState.setCurrentMode(Mode.Normal);
  }
}

@RegisterAction
class CommandRemoveWordCommandline extends BaseCommand {
  modes = [Mode.CommandlineInProgress];
  keys = [['<C-w>'], ['<C-BS>']];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const key = this.keysPressed[0];
    const pos = vimState.statusBarCursorCharacterPos;
    const cmdText = vimState.currentCommandlineText;
    const characterAt = getWordLeftInText(cmdText, pos);
    // Needs explicit check undefined because zero is falsy and zero is a valid character pos.
    if (characterAt !== undefined) {
      vimState.currentCommandlineText = cmdText
        .substring(0, characterAt)
        .concat(cmdText.slice(pos));
      vimState.statusBarCursorCharacterPos = pos - (pos - characterAt);
    }

    commandLine.lastKeyPressed = key;
  }
}

@RegisterAction
class CommandRemoveWordInSearchMode extends BaseCommand {
  modes = [Mode.SearchInProgressMode];
  keys = [['<C-w>'], ['<C-BS>']];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const searchState = globalState.searchState;
    if (searchState === undefined) {
      // TODO: log warning, at least
      return;
    }

    const pos = vimState.statusBarCursorCharacterPos;
    const searchString = searchState.searchString;
    const characterAt = getWordLeftInText(searchString, pos);
    // Needs explicit check undefined because zero is falsy and zero is a valid character pos.
    if (characterAt !== undefined) {
      searchState.searchString = searchString
        .substring(0, characterAt)
        .concat(searchString.slice(pos));
      vimState.statusBarCursorCharacterPos = pos - (pos - characterAt);
    }
  }
}

@RegisterAction
// TODO: break up
class CommandInsertInCommandline extends BaseCommand {
  modes = [Mode.CommandlineInProgress];
  keys = [
    ['<character>'],
    ['<up>'],
    ['<down>'],
    ['<C-b>'], // Beginning
    ['<C-e>'], // End
    ['<C-h>'], // Backspace
    ['<C-p>'], // Previous
    ['<C-n>'], // Next
    ['<C-f>'], // Find
    ['<C-u>'], // Delete to beginning
    ['<Home>'],
    ['<End>'],
    ['<Del>'],
  ];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const key = this.keysPressed[0];

    // handle special keys first
    if (key === '<BS>' || key === '<S-bs>' || key === '<C-h>') {
      if (vimState.statusBarCursorCharacterPos === 0) {
        await vimState.setCurrentMode(Mode.Normal);
        return;
      }

      vimState.currentCommandlineText =
        vimState.currentCommandlineText.slice(0, vimState.statusBarCursorCharacterPos - 1) +
        vimState.currentCommandlineText.slice(vimState.statusBarCursorCharacterPos);
      vimState.statusBarCursorCharacterPos = Math.max(vimState.statusBarCursorCharacterPos - 1, 0);
    } else if (key === '<C-f>') {
      new CommandShowCommandHistory().exec(position, vimState);
    } else if (key === '<C-u>') {
      vimState.currentCommandlineText = vimState.currentCommandlineText.slice(
        vimState.statusBarCursorCharacterPos
      );
      vimState.statusBarCursorCharacterPos = 0;
    } else if (key === '<Del>') {
      vimState.currentCommandlineText =
        vimState.currentCommandlineText.slice(0, vimState.statusBarCursorCharacterPos) +
        vimState.currentCommandlineText.slice(vimState.statusBarCursorCharacterPos + 1);
    } else if (key === '<Home>' || key === '<C-b>') {
      vimState.statusBarCursorCharacterPos = 0;
    } else if (key === '<End>' || key === '<C-e>') {
      vimState.statusBarCursorCharacterPos = vimState.currentCommandlineText.length;
    } else if (key === '<up>' || key === '<C-p>') {
      commandLine.commandLineHistoryIndex -= 1;

      // Clamp the history index to stay within bounds of command history length
      commandLine.commandLineHistoryIndex = Math.max(commandLine.commandLineHistoryIndex, 0);

      if (commandLine.historyEntries[commandLine.commandLineHistoryIndex] !== undefined) {
        vimState.currentCommandlineText =
          commandLine.historyEntries[commandLine.commandLineHistoryIndex];
      }
      vimState.statusBarCursorCharacterPos = vimState.currentCommandlineText.length;
    } else if (key === '<down>' || key === '<C-n>') {
      commandLine.commandLineHistoryIndex += 1;

      // If past the first history item, allow user to enter their own new command string (not using history)
      if (commandLine.commandLineHistoryIndex > commandLine.historyEntries.length - 1) {
        if (commandLine.previousMode === Mode.Normal) {
          vimState.currentCommandlineText = '';
        } else {
          vimState.currentCommandlineText = "'<,'>";
        }

        commandLine.commandLineHistoryIndex = commandLine.historyEntries.length;
        vimState.statusBarCursorCharacterPos = vimState.currentCommandlineText.length;
        return;
      }

      if (commandLine.historyEntries[commandLine.commandLineHistoryIndex] !== undefined) {
        vimState.currentCommandlineText =
          commandLine.historyEntries[commandLine.commandLineHistoryIndex];
      }

      vimState.statusBarCursorCharacterPos = vimState.currentCommandlineText.length;
    } else {
      let modifiedString = vimState.currentCommandlineText.split('');
      modifiedString.splice(vimState.statusBarCursorCharacterPos, 0, key);
      vimState.currentCommandlineText = modifiedString.join('');
      vimState.statusBarCursorCharacterPos += key.length;
    }

    commandLine.lastKeyPressed = key;
  }
}

@RegisterAction
// TODO: break up
class CommandInsertInSearchMode extends BaseCommand {
  modes = [Mode.SearchInProgressMode];
  keys = [
    ['<character>'],
    ['<up>'],
    ['<down>'],
    ['<C-b>'], // Beginning
    ['<C-e>'], // End
    ['<C-h>'], // Backspace
    ['<C-p>'], // Previous
    ['<C-n>'], // Next
    ['<C-f>'], // Find
    ['<C-u>'], // Delete to beginning
    ['<C-m>'], // Another way to run search
    ['<Home>'],
    ['<End>'],
    ['<Del>'],
  ];
  isJump = true;

  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (globalState.searchState === undefined) {
      // TODO: log warning, at least
      return;
    }

    const searchState = globalState.searchState;
    const key = this.keysPressed[0];
    const prevSearchList = globalState.searchStatePrevious;

    // handle special keys first
    if (key === '<BS>' || key === '<S-bs>' || key === '<C-h>') {
      if (searchState.searchString.length === 0) {
        await new CommandEscInSearchMode().exec(position, vimState);
      }
      if (vimState.statusBarCursorCharacterPos === 0) {
        return;
      }

      searchState.searchString =
        searchState.searchString.slice(0, vimState.statusBarCursorCharacterPos - 1) +
        searchState.searchString.slice(vimState.statusBarCursorCharacterPos);
      vimState.statusBarCursorCharacterPos = Math.max(vimState.statusBarCursorCharacterPos - 1, 0);
    } else if (key === '<C-f>') {
      await new CommandShowSearchHistory(searchState.searchDirection).exec(position, vimState);
    } else if (key === '<C-u>') {
      searchState.searchString = searchState.searchString.slice(
        vimState.statusBarCursorCharacterPos
      );
      vimState.statusBarCursorCharacterPos = 0;
    } else if (key === '<Del>') {
      searchState.searchString =
        searchState.searchString.slice(0, vimState.statusBarCursorCharacterPos) +
        searchState.searchString.slice(vimState.statusBarCursorCharacterPos + 1);
    } else if (key === '<Home>' || key === '<C-b>') {
      vimState.statusBarCursorCharacterPos = 0;
    } else if (key === '<End>' || key === '<C-e>') {
      vimState.statusBarCursorCharacterPos = searchState.searchString.length;
    } else if (key === '\n' || key === '<C-m>') {
      await vimState.setCurrentMode(searchState.previousMode);

      // Repeat the previous search if no new string is entered
      if (searchState.searchString === '') {
        if (prevSearchList.length > 0) {
          searchState.searchString = prevSearchList[prevSearchList.length - 1].searchString;
        }
      }

      vimState.statusBarCursorCharacterPos = 0;
      Register.putByKey(searchState.searchString, '/', undefined, true);
      globalState.addSearchStateToHistory(searchState);
      globalState.hl = true;

      if (searchState.getMatchRanges(vimState.editor).length === 0) {
        StatusBar.displayError(
          vimState,
          VimError.fromCode(ErrorCode.PatternNotFound, searchState.searchString)
        );
        return;
      }

      const count = vimState.recordedState.count || 1;
      let searchPos = vimState.cursorStopPosition;
      let nextMatch: { pos: Position; match: boolean; index: number } | undefined;
      for (let i = 0; i < count; i++) {
        // Move cursor to next match
        nextMatch = searchState.getNextSearchMatchPosition(vimState.editor, searchPos);
        if (nextMatch === undefined) {
          break;
        }
        searchPos = nextMatch.pos;
      }
      if (nextMatch === undefined) {
        StatusBar.displayError(
          vimState,
          VimError.fromCode(
            searchState.searchDirection === SearchDirection.Backward
              ? ErrorCode.SearchHitTop
              : ErrorCode.SearchHitBottom,
            searchState.searchString
          )
        );
        return;
      }

      vimState.cursorStopPosition = nextMatch.pos;

      reportSearch(nextMatch.index, searchState.getMatchRanges(vimState.editor).length, vimState);

      return;
    } else if (key === '<up>' || key === '<C-p>') {
      globalState.searchStateIndex -= 1;

      // Clamp the history index to stay within bounds of search history length
      globalState.searchStateIndex = Math.max(globalState.searchStateIndex, 0);

      if (prevSearchList[globalState.searchStateIndex] !== undefined) {
        searchState.searchString = prevSearchList[globalState.searchStateIndex].searchString;
        vimState.statusBarCursorCharacterPos = searchState.searchString.length;
      }
    } else if (key === '<down>' || key === '<C-n>') {
      globalState.searchStateIndex += 1;

      // If past the first history item, allow user to enter their own search string (not using history)
      if (globalState.searchStateIndex > globalState.searchStatePrevious.length - 1) {
        searchState.searchString = '';
        globalState.searchStateIndex = globalState.searchStatePrevious.length;
        return;
      }

      if (prevSearchList[globalState.searchStateIndex] !== undefined) {
        searchState.searchString = prevSearchList[globalState.searchStateIndex].searchString;
      }
      vimState.statusBarCursorCharacterPos = searchState.searchString.length;
    } else {
      let modifiedString = searchState.searchString.split('');
      modifiedString.splice(vimState.statusBarCursorCharacterPos, 0, key);
      searchState.searchString = modifiedString.join('');
      vimState.statusBarCursorCharacterPos += key.length;
    }
  }
}

@RegisterAction
class CommandEscInCommandline extends BaseCommand {
  modes = [Mode.CommandlineInProgress];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const key = this.keysPressed[0];

    await vimState.setCurrentMode(Mode.Normal);

    commandLine.lastKeyPressed = key;
  }
}

@RegisterAction
class CommandEscInSearchMode extends BaseCommand {
  modes = [Mode.SearchInProgressMode];
  keys = [['<Esc>'], ['<C-c>'], ['<C-[>']];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const searchState = globalState.searchState;
    if (searchState === undefined) {
      // TODO: log warning, at least
      return;
    }

    vimState.cursorStopPosition = searchState.cursorStartPosition;

    const prevSearchList = globalState.searchStatePrevious;
    globalState.searchState = prevSearchList
      ? prevSearchList[prevSearchList.length - 1]
      : undefined;

    if (vimState.firstVisibleLineBeforeSearch !== undefined) {
      const offset =
        vimState.editor.visibleRanges[0].start.line - vimState.firstVisibleLineBeforeSearch;
      scrollView(vimState, offset);
    }

    await vimState.setCurrentMode(searchState.previousMode);
    vimState.statusBarCursorCharacterPos = 0;
    if (searchState.searchString.length > 0) {
      globalState.addSearchStateToHistory(searchState);
    }
  }
}

@RegisterAction
class CommandInsertRegisterContentInCommandLine extends BaseCommand {
  modes = [Mode.CommandlineInProgress];
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
      text = register.text.join('\n');
    } else if (register.text instanceof RecordedState) {
      let keyStrokes: string[] = [];

      for (let action of register.text.actionsRun) {
        keyStrokes = keyStrokes.concat(action.keysPressed);
      }

      text = keyStrokes.join('\n');
    } else {
      text = register.text;
    }

    if (register.registerMode === RegisterMode.LineWise) {
      text += '\n';
    }

    vimState.currentCommandlineText += text;
    vimState.statusBarCursorCharacterPos += text.length;
  }
}

@RegisterAction
class CommandInsertRegisterContentInSearchMode extends BaseCommand {
  modes = [Mode.SearchInProgressMode];
  keys = ['<C-r>', '<character>'];
  isCompleteAction = false;

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (globalState.searchState === undefined) {
      // TODO: log warning, at least
      return;
    }

    vimState.recordedState.registerName = this.keysPressed[1];
    const register = await Register.get(vimState);
    if (register === undefined) {
      StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.NothingInRegister));
      return;
    }

    let text: string;
    if (register.text instanceof Array) {
      text = register.text.join('\n');
    } else if (register.text instanceof RecordedState) {
      let keyStrokes: string[] = [];

      for (let action of register.text.actionsRun) {
        keyStrokes = keyStrokes.concat(action.keysPressed);
      }

      text = keyStrokes.join('\n');
    } else {
      text = register.text;
    }

    if (register.registerMode === RegisterMode.LineWise) {
      text += '\n';
    }

    globalState.searchState.searchString += text;
    vimState.statusBarCursorCharacterPos += text.length;
  }
}

@RegisterAction
class CommandInsertWord extends BaseCommand {
  modes = [Mode.CommandlineInProgress, Mode.SearchInProgressMode];
  keys = ['<C-r>', '<C-w>'];

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (globalState.searchState === undefined) {
      // TODO: log warning, at least
      return;
    }

    const word = TextEditor.getWord(position.getLeftIfEOL());

    if (word !== undefined) {
      if (vimState.currentMode === Mode.SearchInProgressMode) {
        globalState.searchState.searchString += word;
      } else {
        vimState.currentCommandlineText += word;
      }

      vimState.statusBarCursorCharacterPos += word.length;
    }
  }
}

@RegisterAction
class CommandNavigateInCommandlineOrSearchMode extends BaseCommand {
  modes = [Mode.CommandlineInProgress, Mode.SearchInProgressMode];
  keys = [['<left>'], ['<right>']];
  runsOnceForEveryCursor() {
    return this.keysPressed[0] === '\n';
  }

  private getTrimmedStatusBarText() {
    // first regex removes the : / and | from the string
    // second regex removes a single space from the end of the string
    let trimmedStatusBarText = StatusBar.getText()
      .replace(/^(?:\/|\:)(.*)(?:\|)(.*)/, '$1$2')
      .replace(/(.*) $/, '$1');
    return trimmedStatusBarText;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const key = this.keysPressed[0];
    let statusBarText = this.getTrimmedStatusBarText();
    if (key === '<right>') {
      vimState.statusBarCursorCharacterPos = Math.min(
        vimState.statusBarCursorCharacterPos + 1,
        statusBarText.length
      );
    } else if (key === '<left>') {
      vimState.statusBarCursorCharacterPos = Math.max(vimState.statusBarCursorCharacterPos - 1, 0);
    }

    commandLine.lastKeyPressed = key;
  }
}

@RegisterAction
class CommandPasteInCommandline extends BaseCommand {
  modes = [Mode.CommandlineInProgress];
  keys = [['<C-v>'], ['<D-v>']];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    const key = this.keysPressed[0];
    const pos = vimState.statusBarCursorCharacterPos;
    const cmdText = vimState.currentCommandlineText;
    const textFromClipboard = await Clipboard.Paste();

    vimState.currentCommandlineText = cmdText
      .substring(0, pos)
      .concat(textFromClipboard)
      .concat(cmdText.slice(pos));
    vimState.statusBarCursorCharacterPos += textFromClipboard.length;

    commandLine.lastKeyPressed = key;
  }
}

@RegisterAction
class CommandPasteInSearchMode extends BaseCommand {
  modes = [Mode.SearchInProgressMode];
  keys = [['<C-v>'], ['<D-v>']];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (globalState.searchState === undefined) {
      // TODO: log warning, at least
      return;
    }
    const searchString = globalState.searchState.searchString;
    const pos = vimState.statusBarCursorCharacterPos;
    const textFromClipboard = await Clipboard.Paste();

    globalState.searchState.searchString = searchString
      .substring(0, pos)
      .concat(textFromClipboard)
      .concat(searchString.slice(pos));
    vimState.statusBarCursorCharacterPos += textFromClipboard.length;
  }
}

@RegisterAction
class CommandCtrlLInSearchMode extends BaseCommand {
  modes = [Mode.SearchInProgressMode];
  keys = ['<C-l>'];
  runsOnceForEveryCursor() {
    return false;
  }

  public async exec(position: Position, vimState: VimState): Promise<void> {
    if (globalState.searchState === undefined) {
      // TODO: log warning, at least
      return;
    }

    const nextMatch = globalState.searchState.getNextSearchMatchRange(vimState.editor, position);
    if (nextMatch?.match) {
      const line = vimState.document.lineAt(nextMatch.end).text;
      if (nextMatch.end.character < line.length) {
        globalState.searchState.searchString += line[nextMatch.end.character];
        vimState.statusBarCursorCharacterPos++;
      }
    }
  }
}
