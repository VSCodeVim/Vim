"use strict";

import * as vscode from 'vscode';

export type OptionValue = number | string | boolean;

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
export class Configuration {
  private static _instance: Configuration | null;

  constructor() {
    /**
     * Load Vim options from User Settings.
     */
    let vimOptions = vscode.workspace.getConfiguration("vim");
    /* tslint:disable:forin */
    // Disable forin rule here as we make accessors enumerable.`
    for (const option in this) {
      const vimOptionValue = vimOptions[option];
      if (vimOptionValue !== null && vimOptionValue !== undefined) {
        this[option] = vimOptionValue;
      }
    }
  }

  public static getInstance(): Configuration {
    if (Configuration._instance == null) {
      Configuration._instance = new Configuration();
    }

    return Configuration._instance;
  }

  useSolidBlockCursor: boolean = false;
  useSystemClipboard: boolean = false;
  useCtrlKeys: boolean = false;
  scroll: number = 20;
  hlsearch: boolean = false;
  ignorecase: boolean = true;
  smartcase: boolean = true;
  autoindent: boolean = true;

  @overlapSetting({ codeName: "tabSize", default: 8})
  tabstop: number | undefined = undefined;

  @overlapSetting({ codeName: "insertSpaces", default: false})
  expandtab: boolean | undefined = undefined;

  private _number: boolean | undefined = undefined;
  public get number() {
    if (this._number === undefined) {
      let lineNumbers = vscode.workspace.getConfiguration("editor").get<vscode.TextEditorLineNumbersStyle>("lineNumbers");

      if (lineNumbers === vscode.TextEditorLineNumbersStyle.Off) {
        this._number = false;
      } else {
        this._number = true;
      }
    }

    return this._number;
  }

  public set number(number: boolean) {
    this._number = number;

    if (number) {
      vscode.workspace.getConfiguration("editor").update("lineNumbers", "on", true);
    } else {
      vscode.workspace.getConfiguration("editor").update("lineNumbers", "off", true);
    }
  }

  private _relativenumber: boolean | undefined = undefined;

  public get relativenumber() {
    if (this._relativenumber === undefined) {
      let lineNumbers = vscode.workspace.getConfiguration("editor").get<vscode.TextEditorLineNumbersStyle>("lineNumbers");

      if (lineNumbers === vscode.TextEditorLineNumbersStyle.Relative) {
        this._relativenumber = true;
      } else {
        this._relativenumber = false;
      }
    }

    return this._relativenumber;
  }

  public set relativenumber(relative: boolean) {
    this._relativenumber = relative;

    if (relative) {
      vscode.workspace.getConfiguration("editor").update("lineNumbers", "relative", true);
    } else {
      vscode.workspace.getConfiguration("editor").update("lineNumbers", "off", true);
    }
  }

  iskeyword: string = "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-";
}

function overlapSetting(args: {codeName: string, default: OptionValue}) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function () {
        if (this["_" + propertyKey] !== undefined) {
          return this["_" + propertyKey];
        }

        return vscode.workspace.getConfiguration("editor").get(args.codeName, args.default);
      },
      set: function (value) {
        this["_" + propertyKey] = value;
      },
      enumerable: true,
      configurable: true
    });
  };
}