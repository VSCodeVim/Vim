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

  set(option: string, value: OptionValue): void {
    this[option] = value;
  }

  useSolidBlockCursor: boolean = false;
  useCtrlKeys: boolean = false;
  scroll: number = 20;
  hlsearch: boolean = false;
  ignorecase: boolean = true;
  smartcase: boolean = true;

  /**
   * Intersection of Vim options and Code configuration.
   */
  private _tabstop: number;
  public set tabstop(tabstop: number) {
    this._tabstop = tabstop;
    if (!vscode.window.activeTextEditor) {
      // TODO: We should set configuration by API, which is not currently supported.
      return;
    }

    const oldOptions = vscode.window.activeTextEditor.options;
    oldOptions.tabSize = tabstop;
    vscode.window.activeTextEditor.options = oldOptions;
  }

  @enumerable()
  public get tabstop() {
    if (this._tabstop !== undefined) {
      return this._tabstop;
    } else {
      if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.options.tabSize as number;
      } else {
        return 8;
      }
    }
  }

  private _expandtab: boolean;
  public set expandtab(expand: boolean) {
    this._expandtab = expand;

    if (!vscode.window.activeTextEditor) {
      // TODO: We should set configuration by API, which is not currently supported.
      return;
    }

    const oldOptions = vscode.window.activeTextEditor.options;
    oldOptions.insertSpaces = expand;
    vscode.window.activeTextEditor.options = oldOptions;
  }

  @enumerable()
  public get expandtab() {
    if (this._expandtab !== undefined) {
      return this._expandtab;
    } else {
      if (vscode.window.activeTextEditor) {
        return vscode.window.activeTextEditor.options.insertSpaces as boolean;
      } else {
        // Default value.
        return false;
      }
    }
  }

  private _iskeyword: string;
  public set iskeyword(keyword) {
    this._iskeyword = keyword;
  }

  @enumerable()
  public get iskeyword() {
    if (this._iskeyword) {
      return this._iskeyword;
    } else {
      return vscode.workspace.getConfiguration("editor").get("wordSeparators", "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?");
    }
  }
}

function enumerable() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = true;
  };
}