'use strict';

import * as vscode from 'vscode';
import { IgnoredKeys } from '../../srcNV/screen';
import { Globals } from '../../src/globals';

export type OptionValue = number | string | boolean;
export type ValueMapping = {
  [key: number]: OptionValue;
  [key: string]: OptionValue;
};

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
    let vimOptions = vscode.workspace.getConfiguration('vim');
    /* tslint:disable:forin */
    // Disable forin rule here as we make accessors enumerable.`
    for (const option in this) {
      const vimOptionValue = vimOptions[option] as any;
      if (vimOptionValue !== null && vimOptionValue !== undefined) {
        this[option] = vimOptionValue;
      }
    }

    // Get the cursor type from vscode
    const cursorStyleString = vscode.workspace
      .getConfiguration()
      .get('editor.cursorStyle') as string;
    this.userCursor = this.cursorStyleFromString(cursorStyleString);
  }

  private cursorStyleFromString(cursorStyle: string): vscode.TextEditorCursorStyle {
    const cursorType = {
      line: vscode.TextEditorCursorStyle.Line,
      block: vscode.TextEditorCursorStyle.Block,
      underline: vscode.TextEditorCursorStyle.Underline,
      'line-thin': vscode.TextEditorCursorStyle.LineThin,
      'block-outline': vscode.TextEditorCursorStyle.BlockOutline,
      'underline-thin': vscode.TextEditorCursorStyle.UnderlineThin,
    };

    if (cursorType[cursorStyle] !== undefined) {
      return cursorType[cursorStyle];
    } else {
      return vscode.TextEditorCursorStyle.Line;
    }
  }

  /**
   * Indent automatically?
   */
  autoindent = true;

  iskeyword: string = '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?-';

  /**
   * Keys to be ignored and NOT handled by the extensions
   */
  ignoreKeys: IgnoredKeys =
  {
    all: [''],
    normal: [''],
    insert: [''],
    visual: ['']
  };


  /**
   * Type of cursor user is using native to vscode
   */
  userCursor: number | undefined;

  neovimPath: string = '';

  /**
   * Size of a tab character.
   */
  @overlapSetting({ codeName: 'tabSize', default: 8 })
  tabstop: number;

  /**
   * Use spaces when the user presses tab?
   */
  @overlapSetting({ codeName: 'insertSpaces', default: false })
  expandtab: boolean;
}

function overlapSetting(args: {
  codeName: string;
  default: OptionValue;
  codeValueMapping?: ValueMapping;
}) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        if (this['_' + propertyKey] !== undefined) {
          return this['_' + propertyKey];
        }

        if (args.codeValueMapping) {
          let val = vscode.workspace.getConfiguration('editor').get(args.codeName);

          if (val !== undefined) {
            return args.codeValueMapping[val as string];
          }
        } else {
          return vscode.workspace.getConfiguration('editor').get(args.codeName, args.default);
        }
      },
      set: async function (value) {
        this['_' + propertyKey] = value;

        if (value === undefined || Globals.isTesting) {
          return;
        }

        let codeValue = value;

        if (args.codeValueMapping) {
          codeValue = args.codeValueMapping[value];
        }

        await vscode.workspace.getConfiguration('editor').update(args.codeName, codeValue, true);
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export const Configuration = ConfigurationClass.getInstance();
