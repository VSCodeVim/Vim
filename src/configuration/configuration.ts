import * as vscode from 'vscode';
import { ConfigurationTarget, WorkspaceConfiguration } from 'vscode';

import Globals from '../globals';
import { taskQueue } from '../taskQueue';

export type OptionValue = number | string | boolean;
export type ValueMapping = {
  [key: number]: OptionValue;
  [key: string]: OptionValue;
};

export interface IHandleKeys {
  [key: string]: boolean;
}

export interface IModeSpecificStrings {
  normal: string | undefined;
  insert: string | undefined;
  visual: string | undefined;
  visualline: string | undefined;
  visualblock: string | undefined;
  replace: string | undefined;
}

/**
 * Every Vim option we support should
 * 1. Be added to contribution section of `package.json`.
 * 2. Named as `vim.{optionName}`, `optionName` is the name we use in Vim.
 * 3. Define a public property in `Configuration` with the same name and a default value.
 *    Or define a private property and define customized Getter/Setter accessors for it.
 *    Always remember to decorate Getter accessor as @enumerable()
 * 4. If user doesn't set the option explicitly
 *    a. we don't have a similar setting in Code, initialize the option as default value.
 *    b. we have a similar setting in Code, use Code's setting.
 *
 * Vim option override sequence.
 * 1. `:set {option}` on the fly
 * 2. TODO .vimrc.
 * 3. `vim.{option}`
 * 4. VS Code configuration
 * 5. VSCodeVim flavored Vim option default values
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

  public updateConfiguration() {
    let vimConfigs = getConfiguration('vim');
    /* tslint:disable:forin */
    // Disable forin rule here as we make accessors enumerable.`
    for (const option in this) {
      const val = vimConfigs[option] as any;
      if (val !== null && val !== undefined) {
        this[option] = val;
      }
    }

    // <space> is special, change it to " " internally if it is used as leader
    if (this.leader.toLowerCase() === '<space>') {
      this.leader = ' ';
    }

    // Enable/Disable certain key combinations
    for (const bracketedKey of this.boundKeyCombinations) {
      // By default, all key combinations are used
      let useKey = true;

      if (this.handleKeys[bracketedKey] === false) {
        // disabled through `vim.handleKeys`
        useKey = false;
      } else if (!this.useCtrlKeys && bracketedKey.slice(1, 3) === 'C-') {
        // user has disabled CtrlKeys and the current key is a CtrlKey
        // <C-c>, still needs to be captured to overrideCopy
        if (bracketedKey === '<C-c>' && this.overrideCopy) {
          useKey = true;
        } else {
          useKey = false;
        }
      }

      vscode.commands.executeCommand('setContext', 'vim.use' + bracketedKey, useKey);
    }
  }

  public cursorStyleFromString(cursorStyle: string): vscode.TextEditorCursorStyle | undefined {
    const cursorType = {
      line: vscode.TextEditorCursorStyle.Line,
      block: vscode.TextEditorCursorStyle.Block,
      underline: vscode.TextEditorCursorStyle.Underline,
      'line-thin': vscode.TextEditorCursorStyle.LineThin,
      'block-outline': vscode.TextEditorCursorStyle.BlockOutline,
      'underline-thin': vscode.TextEditorCursorStyle.UnderlineThin,
    };

    return cursorType[cursorStyle];
  }

  /**
   * Delegate certain key combinations back to VSCode to be handled natively
   */
  handleKeys: IHandleKeys[] = [];

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
  easymotionMarkerBackgroundColor = '';
  easymotionMarkerForegroundColorOneChar = '#ff0000';
  easymotionMarkerForegroundColorTwoChar = '#ffa500';
  easymotionMarkerWidthPerChar = 8;
  easymotionMarkerHeight = 14;
  easymotionMarkerFontFamily = 'Consolas';
  easymotionMarkerFontSize = '14';
  easymotionMarkerFontWeight = 'normal';
  easymotionMarkerYOffset = 0;
  easymotionKeys = 'hklyuiopnm,qwertzxcvbasdgjf;';

  /**
   * Timeout in milliseconds for remapped commands.
   */
  timeout = 1000;

  /**
   * Display partial commands on status bar?
   */
  showcmd = true;

  /**
   * Display mode name text on status bar?
   */
  showmodename = true;

  /**
   * What key should <leader> map to in key remappings?
   */
  leader = '\\';

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
  statusBarColors: IModeSpecificStrings = {
    normal: '#005f5f',
    insert: '#5f0000',
    visual: '#5f00af',
    visualline: '#005f87',
    visualblock: '#86592d',
    replace: '#000000',
  };

  /**
   * Color of search highlights.
   */
  searchHighlightColor = 'rgba(150, 150, 255, 0.3)';

  /**
   * Size of a tab character.
   */
  @overlapSetting({ codeName: 'tabSize', default: 8 })
  tabstop: number;

  @overlapSetting({ codeName: 'cursorStyle', default: 'line' })
  userCursorString: string;

  /**
   * Type of cursor user is using native to vscode
   */
  get userCursor(): number | undefined {
    return this.cursorStyleFromString(this.userCursorString);
  }

  /**
   * Use spaces when the user presses tab?
   */
  @overlapSetting({ codeName: 'insertSpaces', default: false })
  expandtab: boolean;

  @overlapSetting({
    codeName: 'lineNumbers',
    default: true,
    codeValueMapping: { true: 'on', false: 'off' },
  })
  number: boolean;

  /**
   * Show relative line numbers?
   */
  @overlapSetting({
    codeName: 'lineNumbers',
    default: false,
    codeValueMapping: { true: 'relative', false: 'off' },
  })
  relativenumber: boolean;

  iskeyword: string = '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?-';

  /**
   * Array of all key combinations that were registered in angle bracket notation
   */
  boundKeyCombinations: string[] = [];

  /**
   * In visual mode, start a search with * or # using the current selection
   */
  visualstar = false;

  mouseSelectionGoesIntoVisualMode = true;
  /**
   * Uses a hack to fix moving around folds.
   */
  foldfix = false;

  private disableExtension: boolean = false;

  get disableExt(): boolean {
    return this.disableExtension;
  }
  set disableExt(isDisabled: boolean) {
    this.disableExtension = isDisabled;
    getConfiguration('vim').update('disableExtension', isDisabled, ConfigurationTarget.Global);
  }

  enableNeovim = true;

  neovimPath = 'nvim';

  /**
   * Automatically apply the /g flag to substitute commands.
   */
  substituteGlobalFlag = false;

  /**
   * Cursor style to set based on mode
   */
  cursorStylePerMode: IModeSpecificStrings = {
    normal: undefined,
    insert: undefined,
    visual: undefined,
    visualline: undefined,
    visualblock: undefined,
    replace: undefined,
  };

  /**
   * When typing a command show the initial colon ':' character
   */
  cmdLineInitialColon = false;
}

function getConfiguration(section: string): vscode.WorkspaceConfiguration {
  let resource: vscode.Uri | undefined = undefined;
  let activeTextEditor = vscode.window.activeTextEditor;
  if (activeTextEditor) {
    resource = activeTextEditor.document.uri;
  }
  return vscode.workspace.getConfiguration(section, resource);
}

function overlapSetting(args: {
  codeName: string;
  default: OptionValue;
  codeValueMapping?: ValueMapping;
}) {
  return function(target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function() {
        if (this['_' + propertyKey] !== undefined) {
          return this['_' + propertyKey];
        }

        let val = getConfiguration('editor').get(args.codeName, args.default);
        if (args.codeValueMapping && val !== undefined) {
          val = args.codeValueMapping[val as string];
        }

        return val;
      },
      set: function(value) {
        this['_' + propertyKey] = value;

        taskQueue.enqueueTask(async () => {
          if (value === undefined || Globals.isTesting) {
            return;
          }

          let codeValue = value;

          if (args.codeValueMapping) {
            codeValue = args.codeValueMapping[value];
          }

          await getConfiguration('editor').update(
            args.codeName,
            codeValue,
            vscode.ConfigurationTarget.Global
          );
        }, 'config');
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export const Configuration = ConfigurationClass.getInstance();
