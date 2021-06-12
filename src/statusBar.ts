import * as vscode from 'vscode';
import { Mode } from './mode/mode';
import { globalState } from './state/globalState';
import { SearchDirection } from './state/searchState';
import { configuration } from './configuration/configuration';
import { VimState } from './state/vimState';
import { Logger } from './util/logger';
import { VimError } from './error';

class StatusBarImpl implements vscode.Disposable {
  // Displays the current state (mode, recording macro, etc.) and messages to the user
  private readonly statusBarItem: vscode.StatusBarItem;

  // Displays the keys you've typed so far when they haven't yet resolved to a command
  private readonly recordedStateStatusBarItem: vscode.StatusBarItem;

  private previousMode: Mode | undefined = undefined;
  private showingDefaultMessage = true;

  public lastMessageTime: Date | undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      Number.MIN_SAFE_INTEGER // Furthest right on the left
    );
    this.statusBarItem.show();

    this.recordedStateStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      Number.MAX_SAFE_INTEGER // Furthest left on the right
    );
    this.recordedStateStatusBarItem.show();
  }

  dispose() {
    this.statusBarItem.dispose();
    this.recordedStateStatusBarItem.dispose();
  }

  public updateShowCmd(vimState: VimState) {
    this.recordedStateStatusBarItem.text = configuration.showcmd
      ? statusBarCommandText(vimState)
      : '';
  }

  /**
   * Updates the status bar text
   * @param isError If true, text rendered in red
   */
  public setText(vimState: VimState, text: string, isError = false) {
    const hasModeChanged = vimState.currentMode !== this.previousMode;

    // Text
    this.updateText(text);

    // Foreground color
    if (!configuration.statusBarColorControl) {
      this.statusBarItem.color = isError ? new vscode.ThemeColor('errorForeground') : undefined;
    }

    // Background color
    const shouldUpdateColor = configuration.statusBarColorControl && hasModeChanged;
    if (shouldUpdateColor) {
      this.updateColor(vimState.currentMode);
    }

    this.previousMode = vimState.currentMode;
    this.showingDefaultMessage = false;
    this.lastMessageTime = new Date();
  }

  public displayError(vimState: VimState, error: VimError) {
    StatusBar.setText(vimState, error.toString(), true);
  }

  public getText() {
    return this.statusBarItem.text.replace(/\^M/g, '\n');
  }

  /**
   * Clears any messages from the status bar, leaving the default info, such as
   * the current mode and macro being recorded.
   * @param force If true, will clear even high priority messages like errors.
   */
  public clear(vimState: VimState, force = true) {
    if (!this.showingDefaultMessage && !force) {
      return;
    }

    const text: string[] = [];

    if (configuration.showmodename) {
      text.push(statusBarText(vimState));
      if (vimState.isMultiCursor) {
        text.push(' MULTI CURSOR ');
      }
    }

    if (vimState.macro) {
      const macroText = 'Recording @' + vimState.macro.registerName;
      text.push(macroText);
    }

    StatusBar.setText(vimState, text.join(' '));

    this.showingDefaultMessage = true;
  }

  private updateText(text: string) {
    const escaped = text.replace(/\n/g, '^M');
    this.statusBarItem.text = escaped || '';
  }

  private updateColor(mode: Mode) {
    let foreground: string | undefined;
    let background: string | undefined;

    const colorToSet = configuration.statusBarColors[Mode[mode].toLowerCase()];

    if (colorToSet !== undefined) {
      if (typeof colorToSet === 'string') {
        background = colorToSet;
      } else {
        [background, foreground] = colorToSet;
      }
    }

    const workbenchConfiguration = configuration.getConfiguration('workbench');
    const currentColorCustomizations: {
      [index: string]: string;
    } = workbenchConfiguration.get('colorCustomizations') ?? {};

    const colorCustomizations = { ...currentColorCustomizations };

    // If colors are undefined, return to VSCode defaults
    if (background !== undefined) {
      colorCustomizations['statusBar.background'] = background;
      colorCustomizations['statusBar.noFolderBackground'] = background;
      colorCustomizations['statusBar.debuggingBackground'] = background;
    }

    if (foreground !== undefined) {
      colorCustomizations['statusBar.foreground'] = foreground;
    }

    if (currentColorCustomizations !== colorCustomizations) {
      workbenchConfiguration.update('colorCustomizations', colorCustomizations, true);
    }
  }
}

export const StatusBar = new StatusBarImpl();

export function statusBarText(vimState: VimState) {
  const cursorChar =
    vimState.recordedState.actionKeys[vimState.recordedState.actionKeys.length - 1] === '<C-r>'
      ? '"'
      : '|';
  switch (vimState.currentMode) {
    case Mode.Normal:
      return '-- NORMAL --';
    case Mode.Insert:
      return '-- INSERT --';
    case Mode.Visual:
      return '-- VISUAL --';
    case Mode.VisualBlock:
      return '-- VISUAL BLOCK --';
    case Mode.VisualLine:
      return '-- VISUAL LINE --';
    case Mode.Replace:
      return '-- REPLACE --';
    case Mode.EasyMotionMode:
      return '-- EASYMOTION --';
    case Mode.EasyMotionInputMode:
      return '-- EASYMOTION INPUT --';
    case Mode.SurroundInputMode:
      return '-- SURROUND INPUT --';
    case Mode.Disabled:
      return '-- VIM: DISABLED --';
    case Mode.SearchInProgressMode:
      if (globalState.searchState === undefined) {
        const logger = Logger.get('StatusBar');
        logger.warn(`globalState.searchState is undefined in SearchInProgressMode.`);
        return '';
      }
      const leadingChar =
        globalState.searchState.searchDirection === SearchDirection.Forward ? '/' : '?';

      const searchWithCursor = globalState.searchState.searchString.split('');
      searchWithCursor.splice(vimState.statusBarCursorCharacterPos, 0, cursorChar);

      return `${leadingChar}${searchWithCursor.join('')}`;
    case Mode.CommandlineInProgress:
      const commandWithCursor = vimState.currentCommandlineText.split('');
      commandWithCursor.splice(vimState.statusBarCursorCharacterPos, 0, cursorChar);

      return `:${commandWithCursor.join('')}`;
    default:
      return '';
  }
}

export function statusBarCommandText(vimState: VimState): string {
  switch (vimState.currentMode) {
    case Mode.SurroundInputMode:
      return vimState.surround && vimState.surround.replacement
        ? vimState.surround.replacement
        : '';
    case Mode.EasyMotionMode:
      return `Target key: ${vimState.easyMotion.accumulation}`;
    case Mode.EasyMotionInputMode:
      if (!vimState.easyMotion) {
        return '';
      }

      const searchCharCount = vimState.easyMotion.searchAction.searchCharCount;
      const message =
        searchCharCount > 0
          ? `Search for ${searchCharCount} character(s): `
          : 'Search for characters: ';
      return message + vimState.easyMotion.searchAction.searchString;
    case Mode.Visual: {
      // TODO: holy shit, this is SO much more complicated than it should be because
      // our representation of a visual selection is so weird and inconsistent
      let [start, end] = [vimState.cursorStartPosition, vimState.cursorStopPosition];
      let wentOverEOL = false;
      if (start.isAfter(end)) {
        start = start.getRightThroughLineBreaks();
        [start, end] = [end, start];
      } else if (end.isAfter(start) && end.character === 0) {
        end = end.getLeftThroughLineBreaks(true);
        wentOverEOL = true;
      }
      const lines = end.line - start.line + 1;
      if (lines > 1) {
        return `${lines} ${vimState.recordedState.pendingCommandString}`;
      } else {
        const chars = Math.max(end.character - start.character, 1) + (wentOverEOL ? 1 : 0);
        return `${chars} ${vimState.recordedState.pendingCommandString}`;
      }
    }
    case Mode.VisualLine:
      return `${
        Math.abs(vimState.cursorStopPosition.line - vimState.cursorStartPosition.line) + 1
      } ${vimState.recordedState.pendingCommandString}`;
    case Mode.VisualBlock: {
      const lines =
        Math.abs(vimState.cursorStopPosition.line - vimState.cursorStartPosition.line) + 1;
      const chars =
        Math.abs(vimState.cursorStopPosition.character - vimState.cursorStartPosition.character) +
        1;
      return `${lines}x${chars} ${vimState.recordedState.pendingCommandString}`;
    }
    case Mode.Insert:
    case Mode.Replace:
      return vimState.recordedState.pendingCommandString;
    case Mode.Normal:
    case Mode.Disabled:
      return vimState.recordedState.commandString;
    default:
      return '';
  }
}
