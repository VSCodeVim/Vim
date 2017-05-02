"use strict";

import * as vscode from 'vscode';
import { taskQueue } from '../../src/taskQueue';
import { Globals } from '../../src/globals';

export type OptionValue = number | string | boolean;
export type ValueMapping = {
  [key: number]: OptionValue
  [key: string]: OptionValue
};

export interface IHandleKeys {
  [key: string]: boolean;
}

export interface IStatusBarColors {
  normal: string;
  insert: string;
  visual: string;
  visualline: string;
  visualblock: string;
  replace: string;
}

/**
 * Every Vim option we support should
 * 1. Be added to contribution section of `package.json`.
 * 2. Named as `vim.{optionName}`, `optionName` is the name we use in Vim.
 * 3. Define a public property in `Configuration `with the same name and a default value.
 *    Or define a private propery and define customized Getter/Setter accessors for it.
 *    Always remember to decorate Getter accessor as @enumerable()
 * 4. If user doesn't set the option explicitly
 *    a. we don't have a similar setting in Code, initialize the option as default value.
 *    b. we have a similar setting in Code, use Code's setting.
 *
 * Vim option override sequence.
 * 1. `:set {option}` on the fly
 * 2. TODO .vimrc.
 * 2. `vim.{option}`
 * 3. VS Code configuration
 * 4. VSCodeVim flavored Vim option default values
 *
 */
class ConfigurationClass {
  private static _instance: ConfigurationClass | null;

  constructor() {
    this.updateConfiguration();
  }

  public static getInstance(): ConfigurationClass {
    if (ConfigurationClass._instance == null) {
      ConfigurationClass._instance = new ConfigurationClass();
    }

    return ConfigurationClass._instance;
  }

  updateConfiguration() {
    /**
     * Load Vim options from User Settings.
     */
    let vimOptions = vscode.workspace.getConfiguration("vim");
    /* tslint:disable:forin */
    // Disable forin rule here as we make accessors enumerable.`
    for (const option in this) {
      const vimOptionValue = vimOptions[option] as any;
      if (vimOptionValue !== null && vimOptionValue !== undefined) {
        this[option] = vimOptionValue;
      }
    }

    // <space> is special, change it to " " internally if it is used as leader
    if (this.leader.toLowerCase() === "<space>") {
      this.leader = " ";
    }

    // Get the cursor type from vscode
    const cursorStyleString = vscode.workspace.getConfiguration().get("editor.cursorStyle") as string;
    this.userCursor = this.cursorStyleFromString(cursorStyleString);

    // Get configuration setting for handled keys, this allows user to disable
    // certain key comboinations
    const handleKeys = vscode.workspace.getConfiguration('vim')
      .get<IHandleKeys[]>("handleKeys", []);

    for (const bracketedKey of this.boundKeyCombinations) {
      // Set context for key that is not used
      // This either happens when user sets useCtrlKeys to false (ctrl keys are not used then)
      // Or if user usese vim.handleKeys configuration option to set certain combinations to false
      // By default, all key combinations are used so start with true
      let useKey = true;

      // Check for configuration setting disabling combo
      if (handleKeys[bracketedKey] !== undefined) {
        if (handleKeys[bracketedKey] === false) {
          useKey = false;
        }
      } else if (!this.useCtrlKeys && (bracketedKey.slice(1, 3) === "C-")) {
        // Check for useCtrlKeys and if it is a <C- ctrl> based keybinding.
        // However, we need to still capture <C-c> due to overrideCopy.
        if (bracketedKey === '<C-c>' && this.overrideCopy) {
          useKey = true;
        } else {
          useKey = false;
        }
      }

      // Set the context of whether or not this key will be used based on criteria from above
      vscode.commands.executeCommand('setContext', 'vim.use' + bracketedKey, useKey);
    }
  }

  private cursorStyleFromString(cursorStyle: string): vscode.TextEditorCursorStyle {

    const cursorType = {
      "line": vscode.TextEditorCursorStyle.Line,
      "block": vscode.TextEditorCursorStyle.Block,
      "underline": vscode.TextEditorCursorStyle.Underline,
      "line-thin": vscode.TextEditorCursorStyle.LineThin,
      "block-outline": vscode.TextEditorCursorStyle.BlockOutline,
      "underline-thin": vscode.TextEditorCursorStyle.UnderlineThin,
    };

    if (cursorType[cursorStyle] !== undefined) {
      return cursorType[cursorStyle];
    } else {
      return vscode.TextEditorCursorStyle.Line;
    }
  }

  /**
   * Should the block cursor not blink?
   */
  useSolidBlockCursor = false;

  /**
   * Use the system's clipboard when copying.
   */
  useSystemClipboard = false;

  /**
   * Enable ctrl- actions that would override existing VSCode actions.
   */
  useCtrlKeys = false;

  /**
   * Override default VSCode copy behavior.
   */
  overrideCopy = true;

  /**
   * Width in characters to word-wrap to.
   */
  textwidth = 80;

  /**
   * Should we highlight incremental search matches?
   */
  hlsearch = false;

  /**
   * Ignore case when searching with / or ?.
   */
  ignorecase = true;

  /**
   * In / or ?, default to ignorecase=true unless the user types a capital
   * letter.
   */
  smartcase = true;

  /**
   * Indent automatically?
   */
  autoindent = true;

  /**
   * Use EasyMotion plugin?
   */
  easymotion = false;

  /**
   * Use surround plugin?
   */
  surround = true;

  /**
   * Easymotion marker appearance settings
   */
  easymotionMarkerBackgroundColor = "#000000";
  easymotionMarkerForegroundColorOneChar = "#ff0000";
  easymotionMarkerForegroundColorTwoChar = "#ffa500";
  easymotionMarkerWidthPerChar = 8;
  easymotionMarkerHeight = 14;
  easymotionMarkerFontFamily = "Consolas";
  easymotionMarkerFontSize = "14";
  easymotionMarkerFontWeight = "normal";
  easymotionMarkerYOffset = 11;

  /**
   * Timeout in milliseconds for remapped commands.
   */
  timeout = 1000;

  /**
   * Display partial commands on status bar?
   */
  showcmd = true;

  /**
   * What key should <leader> map to in key remappings?
   */
  leader = "\\";

  /**
   * How much search or command history should be remembered
   */
  history = 50;

  /**
   * Show results of / or ? search as user is typing?
   */
  incsearch = true;

  /**
   * Start in insert mode?
   */
  startInInsertMode = false;

  /**
   * Enable changing of the status bar color based on mode
   */
  statusBarColorControl = false;

  /**
   * Status bar colors to change to based on mode
   */
  statusBarColors: IStatusBarColors = {
    "normal": "#005f5f",
    "insert": "#5f0000",
    "visual": "#5f00af",
    "visualline": "#005f87",
    "visualblock": "#86592d",
    "replace": "#000000",
  };

  /**
   * Color of search highlights.
   */
  searchHighlightColor = "rgba(150, 150, 255, 0.3)";

  /**
   * Size of a tab character.
   */
  @overlapSetting({ codeName: "tabSize", default: 8 })
  tabstop: number;

  /**
   * Type of cursor user is using native to vscode
   */
  userCursor: number;

  /**
   * Use spaces when the user presses tab?
   */
  @overlapSetting({ codeName: "insertSpaces", default: false })
  expandtab: boolean;

  @overlapSetting({ codeName: "lineNumbers", default: true, codeValueMapping: { true: "on", false: "off" } })
  number: boolean;

  /**
   * Show relative line numbers?
   */
  @overlapSetting({ codeName: "lineNumbers", default: false, codeValueMapping: { true: "relative", false: "off" } })
  relativenumber: boolean;

  iskeyword: string = "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-";

  /**
   * Array of all key combinations that were registered in angle bracket notation
   */
  boundKeyCombinations: string[] = [];

  /**
   * In visual mode, start a search with * or # using the current selection
   */
  visualstar = false;
}

function overlapSetting(args: { codeName: string, default: OptionValue, codeValueMapping?: ValueMapping }) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        if (this["_" + propertyKey] !== undefined) {
          return this["_" + propertyKey];
        }

        if (args.codeValueMapping) {
          let val = vscode.workspace.getConfiguration("editor").get(args.codeName);

          if (val !== undefined) {
            return args.codeValueMapping[val as string];
          }
        } else {
          return vscode.workspace.getConfiguration("editor").get(args.codeName, args.default);
        }
      },
      set: function (value) {
        this["_" + propertyKey] = value;

        taskQueue.enqueueTask({
          promise: async () => {
            if (value === undefined || Globals.isTesting) {
              return;
            }

            let codeValue = value;

            if (args.codeValueMapping) {
              codeValue = args.codeValueMapping[value];
            }

            await vscode.workspace.getConfiguration("editor").update(args.codeName, codeValue, true);
          },
          isRunning: false,
          queue: "config"
        });
      },
      enumerable: true,
      configurable: true
    });
  };
}

export const Configuration = ConfigurationClass.getInstance();