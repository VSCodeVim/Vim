"use strict";

import * as vscode from 'vscode';

export type OptionHandler = () => {};
export type OptionValue = number | string | boolean;

enum OptionValueSource {
  Runtime,
  UserSetting, // How can we know if it's frm User Setting or Workspace or Code's Default?
  Default
}

/**
 * Every Vim option we support should
 * 1. Be added to contribution section of `package.json`.
 * 2. Named as `vim.{optionName}`, `optionName` is the name we use in Vim.
 * 3. Define a subclass below, inherited from `BaseOptionDetails`.
 * 4. If user doesn't set the option explicitly, initialize the option as default value.
 */
export class BaseOptionDetails {
  id: string;
  defaultValue: OptionValue;
  protected _value: OptionValue;

  constructor() {
    let res: OptionValue;
    res = this.fetchCodeConfiguration();

    if (res) {
      this._value = res;
      this.source = OptionValueSource.UserSetting;
    } else {
      this._value = this.defaultValue;
      this.source = OptionValueSource.Default;
    }

    this.initialize();
  }

  // By default, we are fetching options from `vim` section but when we have overlap
  // between Code and Vim, eg `tabstop`, we may want to override this method.
  protected fetchCodeConfiguration() {
    return vscode.workspace.getConfiguration("vim").get<OptionValue>(this.id);
  }

  /**
   * Defualt constructor only fetches option value from Code and does nothing more.
   * But if there is any overlap between Vim option and Code option, we need to do handle
   * the option overriden correctly. That's why we need another custom `initialize()` here.
   * Example:
   *   Vim has an option called `tabstop`, which is used to define number of spaces that a Tab uses.
   *   Code has a config called `tabSize` which reprents totally the same thing.
   *   If user defines `vim.tabstop` explicitly in `settings.json`, we need to update Code's `tabSize`
   *   accordingly to take effect.
   */
  protected initialize() { return; }

  public get value() {
    return  this._value;
  }

  public set value(value: number | string | boolean) {
    this._value = value;
    this.source = OptionValueSource.Runtime;
  }

  public source: OptionValueSource = OptionValueSource.Default;
  static globalOptionUpdateHandler: () => void;
}

export class OptionMap {
  public static allOptions: { [key: string]: BaseOptionDetails } = {};
}

export function RegisterOption(optionDetails: typeof BaseOptionDetails): void {
  let newOption = new optionDetails();
  OptionMap.allOptions[newOption.id] = newOption;
}

@RegisterOption
class OptionUseSolidBlockCursor extends BaseOptionDetails {
  id = "useSolidBlockCursor";
  defaultValue = false;
}

@RegisterOption
class OptionUseControlKeys extends BaseOptionDetails {
  id = "useCtrlKeys";
  defaultValue = false;
}

@RegisterOption
class OptionScroll extends BaseOptionDetails {
  id = "scroll";
  defaultValue = 20;
}

@RegisterOption
class OptionHightlightSearch extends BaseOptionDetails {
  id = "hlsearch";
  defaultValue = false;
}

@RegisterOption
class OptionIgnoreCase extends BaseOptionDetails {
  id = "ignorecase";
  defaultValue = true;
}

@RegisterOption
class OptionSmartCase extends BaseOptionDetails {
  id = "smartcase";
  defaultValue = true;
}

@RegisterOption
class OptionTabStop extends BaseOptionDetails {
  id = "tabstop"; // aka, tabSize
  defaultValue = 8; // Vim default value but here we always use Code configuration

  fetchCodeConfiguration() {
    const vimOptionInCode = vscode.workspace.getConfiguration("vim").get<number>(this.id);

    return vimOptionInCode ? vimOptionInCode : this.getTabSizeFromCode();
  }

  initialize() {
    // TODO we should update through API instead of tweaking editor's copy of config.
    const options = vscode.window.activeTextEditor.options;
    options.tabSize = this.value as number;
    vscode.window.activeTextEditor.options = options;
  }

  public get value() {
    if (this.source === OptionValueSource.Runtime) {
      return this._value;
    } else {
      return this.getTabSizeFromCode();
    }
  }

  public set value(value: number | string | boolean) {
    super.value = value;

    if (!vscode.window.activeTextEditor) {
      // TODO: We should set configuration by API, which is not currently supported.
      return;
    }

    const oldOptions = vscode.window.activeTextEditor.options;
    oldOptions.tabSize = value as number;
    vscode.window.activeTextEditor.options = oldOptions;
  }

  private getTabSizeFromCode(): number {
    if (vscode.window.activeTextEditor) {
      return vscode.window.activeTextEditor.options.tabSize! as number;
    } else {
      return vscode.workspace.getConfiguration("editor").get("tabSize", this.defaultValue);
    }
  }
}

@RegisterOption
class OptionInsertSpaces extends BaseOptionDetails {
  id = "expandtab"; // aka insertSpaces
  defaultValue = false;

  fetchCodeConfiguration() {
    const vimOptionInCode = vscode.workspace.getConfiguration("vim").get<boolean>(this.id);
    return vimOptionInCode ? vimOptionInCode : this.getInsertSpaccesFromCode();
  }

  initialize() {
    const options = vscode.window.activeTextEditor.options;
    options.insertSpaces = this.value as boolean;
    vscode.window.activeTextEditor.options = options;
  }

  public get value() {
    if (this.source === OptionValueSource.Runtime) {
      return this._value;
    } else {
      return this.getInsertSpaccesFromCode();
    }
  }

  public set value(value: number | string | boolean) {
    super.value = value;
    const oldOptions = vscode.window.activeTextEditor.options;
    oldOptions.insertSpaces = <boolean> value;
    vscode.window.activeTextEditor.options = oldOptions;
  }

  private getInsertSpaccesFromCode(): boolean {
    if (vscode.window.activeTextEditor) {
      return vscode.window.activeTextEditor.options.insertSpaces! as boolean;
    } else {
      return vscode.workspace.getConfiguration("editor").get("insertSpaces", this.defaultValue);
    }
  }
}

@RegisterOption
class OptionIskeyword extends BaseOptionDetails {
  id = "iskeyword";
  defaultValue = "/\\()\"':,.;<>~!@#$%^&*|+=[]{}`?-";

  fetchCodeConfiguration() {
    const vimOptionInCode = vscode.workspace.getConfiguration("vim").get<boolean>(this.id);
    return vimOptionInCode ? vimOptionInCode : vscode.workspace.getConfiguration("editor").get("wordSeparators", this.defaultValue);
  }

  initialize() {
    // TODO: modify Code's wordSeparators configuration.
  }
}

/**
 * Vim option override sequence.
 * 1. `:set {option}` on the fly
 * 2. VS Code Vim configuration section && overlap configurations between Code and Vim
 * 3. TODO .vimrc.
 * 4. VSCodeVim flavored Vim option default values
 */
export class Configuration {
  private static _instance: Configuration;

  constructor() {
    // TODO: Read the real Vim config and override existing configration.
    // Besides, vimrc settings' priority should be between Default and User Settings.
  }

  public static getInstance(): Configuration {
    if (Configuration._instance == null) {
      Configuration._instance = new Configuration();
    }

    return Configuration._instance;
  }

  set(option: string, value: number | string | boolean, source?: OptionValueSource): void {
    let targetOption = OptionMap.allOptions[option];

    if (!targetOption) {
      return;
    }

    if (value === targetOption.value) {
      targetOption.source = OptionValueSource.Runtime;
      return;
    }

    targetOption.value = value;
  }

  /**
   * Return a value of option from vim settings.
   * @param vim option.
   * @param defaultValue A value should be returned when no value could be found, is `undefined`.
   */
  get(option: string, defaultValue?: number | string | boolean): number | string | boolean {
    let targetOption = OptionMap.allOptions[option];

    if (targetOption) {
      // Return directly if the option from Runtime (including VimRc)
      // as in these two senarios configurations are updated automatically.
      return targetOption.value;
    }

    // TODO: Not sure if there is only overlap between Code's `editor` section and Vim.
    // Not sure if auto update of VS Code configuration is necessary
    // maybe we can just require users to restart VS Code after they update User Setting?
    return vscode.workspace.getConfiguration("editor").get(option, defaultValue);
  }
}