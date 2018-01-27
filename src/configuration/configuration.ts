import * as vscode from 'vscode';

import { Globals } from '../globals';
import { taskQueue } from '../taskQueue';
import { Notation } from './notation';
import { IConfiguration, IKeyRemapping, IModeSpecificStrings } from './iconfiguration';

const packagejson: {
  contributes: {
    keybindings: VSCodeKeybinding[];
  };
} = require('../../../package.json');

type OptionValue = number | string | boolean;
type ValueMapping = {
  [key: number]: number | string | boolean;
  [key: string]: number | string | boolean;
};

interface VSCodeKeybinding {
  key: string;
  mac?: string;
  linux?: string;
  command: string;
  when: string;
}

interface IHandleKeys {
  [key: string]: boolean;
}

interface IKeyBinding {
  key: string;
  command: string;
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
class Configuration implements IConfiguration {
  private readonly leaderDefault = '\\';
  private readonly cursorTypeMap = {
    line: vscode.TextEditorCursorStyle.Line,
    block: vscode.TextEditorCursorStyle.Block,
    underline: vscode.TextEditorCursorStyle.Underline,
    'line-thin': vscode.TextEditorCursorStyle.LineThin,
    'block-outline': vscode.TextEditorCursorStyle.BlockOutline,
    'underline-thin': vscode.TextEditorCursorStyle.UnderlineThin,
  };

  constructor() {
    this.reload();
  }

  reload() {
    let vimConfigs: any = Globals.isTesting ? Globals.mockConfiguration : this.getConfiguration('vim');

    /* tslint:disable:forin */
    // Disable forin rule here as we make accessors enumerable.`
    for (const option in this) {
      const val = vimConfigs[option] as any;
      if (val !== null && val !== undefined) {
        this[option] = val;
      }
    }

    this.leader = Notation.NormalizeKey(this.leader, this.leaderDefault);

    // normalize keys
    const keybindingList: IKeyRemapping[][] = [
      this.insertModeKeyBindings,
      this.insertModeKeyBindingsNonRecursive,
      this.otherModesKeyBindings,
      this.otherModesKeyBindingsNonRecursive,
    ];
    for (const keybindings of keybindingList) {
      for (let remapping of keybindings) {
        if (remapping.before) {
          remapping.before.forEach(
            (key, idx) => (remapping.before[idx] = Notation.NormalizeKey(key, this.leader))
          );
        }

        if (remapping.after) {
          remapping.after.forEach(
            (key, idx) => (remapping.after![idx] = Notation.NormalizeKey(key, this.leader))
          );
        }
      }
    }

    // read package.json for bound keys
    this.boundKeyCombinations = [];
    for (let keybinding of packagejson.contributes.keybindings) {
      if (keybinding.when.indexOf('listFocus') !== -1) {
        continue;
      }

      let key = keybinding.key;
      if (process.platform === 'darwin') {
        key = keybinding.mac || key;
      } else if (process.platform === 'linux') {
        key = keybinding.linux || key;
      }

      this.boundKeyCombinations.push({
        key: Notation.NormalizeKey(key, this.leader),
        command: keybinding.command,
      });
    }

    // enable/disable certain key combinations
    for (const boundKey of this.boundKeyCombinations) {
      // By default, all key combinations are used
      let useKey = true;

      let handleKey = this.handleKeys[boundKey.key];
      if (handleKey !== undefined) {
        // enabled/disabled through `vim.handleKeys`
        useKey = handleKey;
      } else if (!this.useCtrlKeys && boundKey.key.slice(1, 3) === 'C-') {
        // user has disabled CtrlKeys and the current key is a CtrlKey
        // <C-c>, still needs to be captured to overrideCopy
        if (boundKey.key === '<C-c>' && this.overrideCopy) {
          useKey = true;
        } else {
          useKey = false;
        }
      }

      vscode.commands.executeCommand('setContext', `vim.use${boundKey.key}`, useKey);
    }

    vscode.commands.executeCommand('setContext', 'vim.overrideCopy', this.overrideCopy);
    vscode.commands.executeCommand(
      'setContext',
      'vim.overrideCtrlC',
      this.overrideCopy || this.useCtrlKeys
    );
  }

  getConfiguration(section: string = ''): vscode.WorkspaceConfiguration {
    let resource: vscode.Uri | undefined = undefined;
    let activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
      resource = activeTextEditor.document.uri;
    }
    return vscode.workspace.getConfiguration(section, resource);
  }

  cursorStyleFromString(cursorStyle: string): vscode.TextEditorCursorStyle | undefined {
    return this.cursorTypeMap[cursorStyle];
  }

  handleKeys: IHandleKeys[] = [];

  useSystemClipboard = false;

  useCtrlKeys = false;

  overrideCopy = true;

  textwidth = 80;

  hlsearch = false;

  ignorecase = true;

  smartcase = true;

  autoindent = true;

  surround = true;

  easymotion = false;
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

  timeout = 1000;

  showcmd = true;

  showmodename = true;

  leader = this.leaderDefault;

  history = 50;

  incsearch = true;

  startInInsertMode = false;

  statusBarColorControl = false;

  statusBarColors: IModeSpecificStrings<string> = {
    normal: '#005f5f',
    insert: '#5f0000',
    visual: '#5f00af',
    visualline: '#005f87',
    visualblock: '#86592d',
    replace: '#000000',
  };

  searchHighlightColor = 'rgba(150, 150, 255, 0.3)';

  @overlapSetting({ codeName: 'tabSize', default: 8 })
  tabstop: number;

  @overlapSetting({ codeName: 'cursorStyle', default: 'line' })
  private userCursorString: string;

  get userCursor(): vscode.TextEditorCursorStyle | undefined {
    return this.cursorStyleFromString(this.userCursorString);
  }
  set userCursor(val: vscode.TextEditorCursorStyle | undefined) {
    // nop
  }

  @overlapSetting({ codeName: 'insertSpaces', default: false })
  expandtab: boolean;

  @overlapSetting({
    codeName: 'lineNumbers',
    default: true,
    codeValueMapping: { true: 'on', false: 'off' },
  })
  number: boolean;

  @overlapSetting({
    codeName: 'lineNumbers',
    default: false,
    codeValueMapping: { true: 'relative', false: 'off' },
  })
  relativenumber: boolean;

  iskeyword: string = '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?-';

  boundKeyCombinations: IKeyBinding[] = [];

  visualstar = false;

  mouseSelectionGoesIntoVisualMode = true;

  foldfix = false;

  private disableExtension: boolean = false;

  get disableExt(): boolean {
    return this.disableExtension;
  }
  set disableExt(isDisabled: boolean) {
    this.disableExtension = isDisabled;
    this.getConfiguration('vim').update(
      'disableExtension',
      isDisabled,
      vscode.ConfigurationTarget.Global
    );
  }

  enableNeovim = false;
  neovimPath = 'nvim';

  substituteGlobalFlag = false;

  private cursorStylePerMode: IModeSpecificStrings<string> = {
    normal: undefined,
    insert: undefined,
    visual: undefined,
    visualline: undefined,
    visualblock: undefined,
    replace: undefined,
  };

  get modeToCursorStyleMap() : IModeSpecificStrings<vscode.TextEditorCursorStyle> {
    let map = <IModeSpecificStrings<vscode.TextEditorCursorStyle>>{};

    Object.keys(this.cursorStylePerMode).forEach(k => {
      let cursor = this.cursorStylePerMode[k];
      let cursorStyle = this.cursorStyleFromString(cursor);
      map[k] = cursorStyle;
    });

    return map;
  }
  set modeToCursorStyleMap(val: IModeSpecificStrings<vscode.TextEditorCursorStyle>) {
    // nop
  }

  cmdLineInitialColon = false;

  // remappings
  insertModeKeyBindings: IKeyRemapping[] = [];
  insertModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  otherModesKeyBindings: IKeyRemapping[] = [];
  otherModesKeyBindingsNonRecursive: IKeyRemapping[] = [];
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

        let val = this.getConfiguration('editor').get(args.codeName, args.default);
        if (args.codeValueMapping && val !== undefined) {
          val = args.codeValueMapping[val as string];
        }

        return val;
      },
      set: function(value) {
        this['_' + propertyKey] = value;

        if (value === undefined || Globals.isTesting) {
          return;
        }

        taskQueue.enqueueTask(async () => {
          if (args.codeValueMapping) {
            value = args.codeValueMapping[value];
          }

          await this.getConfiguration('editor').update(
            args.codeName,
            value,
            vscode.ConfigurationTarget.Global
          );
        }, 'config');
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export let configuration = new Configuration();
