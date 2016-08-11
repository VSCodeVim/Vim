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
  useCtrlKeys: boolean = false;
  scroll: number = 20;
  hlsearch: boolean = false;
  ignorecase: boolean = true;
  smartcase: boolean = true;

  @overlapSetting({ codeName: "tabSize", default: 8})
  tabstop: number;

  @overlapSetting({ codeName: "insertSpaces", default: false})
  expandtab: boolean;

  @overlapSetting({ codeName: "wordSeparators", default: "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?"})
  iskeyword: string;
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
      set: function (value) { this["_" + propertyKey] = value; },
      enumerable: true,
      configurable: true
    });
  };
}