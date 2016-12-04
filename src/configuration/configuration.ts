"use strict";

import * as vscode from 'vscode';
import { taskQueue } from '../../src/taskQueue';
import { Globals } from '../../src/globals';

export type OptionValue = number | string | boolean;
export type ValueMapping = {
  [key: number]: OptionValue
  [key: string]: OptionValue
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

  useSolidBlockCursor = false;
  useSystemClipboard = false;
  useCtrlKeys = false;
  scroll = 20;
  textwidth = 80;
  hlsearch = false;
  ignorecase = true;
  smartcase = true;
  autoindent = true;
  easymotion = false;
  incsearch = true;
  startInInsertMode = false;

  @overlapSetting({ codeName: "tabSize", default: 8})
  tabstop: number | undefined = undefined;

  @overlapSetting({ codeName: "insertSpaces", default: false})
  expandtab: boolean | undefined = undefined;

  @overlapSetting({ codeName: "lineNumbers", default: true, codeValueMapping: {true: "on", false: "off"}})
  number: boolean | undefined = undefined;

  @overlapSetting({ codeName: "lineNumbers", default: false, codeValueMapping: {true: "relative", false: "off"}})
  relativenumber: boolean | undefined = undefined;

  iskeyword: string = "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-";
}

function overlapSetting(args: {codeName: string, default: OptionValue, codeValueMapping?: ValueMapping}) {
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