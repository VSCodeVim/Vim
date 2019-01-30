import * as vscode from 'vscode';
import { ConfigurationError } from './configurationError';
import { Globals } from '../globals';
import { Notation } from './notation';
import { VsCodeContext } from '../util/vscode-context';
import { configurationValidator } from './configurationValidator';
import {
  IConfiguration,
  IKeyRemapping,
  IModeSpecificStrings,
  IAutoSwitchInputMethod,
  IDebugConfiguration,
} from './iconfiguration';

const packagejson: {
  contributes: {
    keybindings: VSCodeKeybinding[];
  };
} = require('../../../package.json');

type OptionValue = number | string | boolean;

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
 * 2. `vim.{option}`
 * 3. VS Code configuration
 * 4. VSCodeVim configuration default values
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

  public async load(): Promise<ConfigurationError[]> {
    let vimConfigs: any = Globals.isTesting
      ? Globals.mockConfiguration
      : this.getConfiguration('vim');

    let configurationErrors = new Array<ConfigurationError>();

    /* tslint:disable:forin */
    // Disable forin rule here as we make accessors enumerable.`
    for (const option in this) {
      let val = vimConfigs[option] as any;
      if (val !== null && val !== undefined) {
        if (val.constructor.name === Object.name) {
          val = Configuration.unproxify(val);
        }
        this[option] = val;
      }
    }

    this.leader = Notation.NormalizeKey(this.leader, this.leaderDefault);

    // remapped keys
    const modeKeyBindingsKeys = [
      'insertModeKeyBindings',
      'insertModeKeyBindingsNonRecursive',
      'normalModeKeyBindings',
      'normalModeKeyBindingsNonRecursive',
      'visualModeKeyBindings',
      'visualModeKeyBindingsNonRecursive',
    ];
    for (const modeKeyBindingsKey of modeKeyBindingsKeys) {
      let keybindings = configuration[modeKeyBindingsKey];

      const modeKeyBindingsMap = new Map<string, IKeyRemapping>();
      for (let i = keybindings.length - 1; i >= 0; i--) {
        let remapping = keybindings[i];

        // validate
        let remappingErrors = await configurationValidator.isRemappingValid(remapping);
        configurationErrors = configurationErrors.concat(remappingErrors);

        if (remappingErrors.filter(e => e.level === 'error').length > 0) {
          // errors with remapping, skip
          keybindings.splice(i, 1);
          continue;
        }

        // normalize
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

        // check for duplicates
        const beforeKeys = remapping.before.join('');
        if (modeKeyBindingsMap.has(beforeKeys)) {
          configurationErrors.push({
            level: 'error',
            message: `${remapping.before}. Duplicate remapped key for ${beforeKeys}.`,
          });
          continue;
        }

        // add to map
        modeKeyBindingsMap.set(beforeKeys, remapping);
      }

      configuration[modeKeyBindingsKey + 'Map'] = modeKeyBindingsMap;
    }

    // wrap keys
    this.wrapKeys = {};
    for (const wrapKey of this.whichwrap.split(',')) {
      this.wrapKeys[wrapKey] = true;
    }

    // read package.json for bound keys
    // enable/disable certain key combinations
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

      VsCodeContext.Set(`vim.use${boundKey.key}`, useKey);
    }

    VsCodeContext.Set('vim.overrideCopy', this.overrideCopy);
    VsCodeContext.Set('vim.overrideCtrlC', this.overrideCopy || this.useCtrlKeys);

    return configurationErrors;
  }

  getConfiguration(section: string = ''): vscode.WorkspaceConfiguration {
    const activeTextEditor = vscode.window.activeTextEditor;
    const resource = activeTextEditor ? activeTextEditor.document.uri : undefined;
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

  sneak = false;
  sneakUseIgnorecaseAndSmartcase = false;

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
  easymotionJumpToAnywhereRegex = '\\b[A-Za-z0-9]|[A-Za-z0-9]\\b|_.|#.|[a-z][A-Z]';

  autoSwitchInputMethod: IAutoSwitchInputMethod = {
    enable: false,
    defaultIM: '',
    obtainIMCmd: '',
    switchIMCmd: '',
  };

  timeout = 1000;

  showcmd = true;

  showmodename = true;

  leader = this.leaderDefault;

  history = 50;

  incsearch = true;

  startInInsertMode = false;

  statusBarColorControl = false;

  statusBarColors: IModeSpecificStrings<string | string[]> = {
    normal: '#005f5f',
    insert: '#5f0000',
    visual: '#5f00af',
    visualline: '#005f87',
    visualblock: '#86592d',
    replace: '#000000',
  };

  debug: IDebugConfiguration = {
    silent: false,
    loggingLevelForAlert: 'error',
    loggingLevelForConsole: 'error',
  };

  searchHighlightColor = 'rgba(150, 150, 255, 0.3)';

  @overlapSetting({ settingName: 'tabSize', defaultValue: 8 })
  tabstop: number;

  @overlapSetting({ settingName: 'cursorStyle', defaultValue: 'line' })
  private editorCursorStyleRaw: string;

  get editorCursorStyle(): vscode.TextEditorCursorStyle | undefined {
    return this.cursorStyleFromString(this.editorCursorStyleRaw);
  }
  set editorCursorStyle(val: vscode.TextEditorCursorStyle | undefined) {
    // nop
  }

  @overlapSetting({ settingName: 'insertSpaces', defaultValue: false })
  expandtab: boolean;

  @overlapSetting({
    settingName: 'lineNumbers',
    defaultValue: true,
    map: new Map([['on', true], ['off', false], ['relative', false], ['interval', false]]),
  })
  number: boolean;

  @overlapSetting({
    settingName: 'lineNumbers',
    defaultValue: false,
    map: new Map([['on', false], ['off', false], ['relative', true], ['interval', false]]),
  })
  relativenumber: boolean;

  @overlapSetting({
    settingName: 'wordSeparators',
    defaultValue: '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?-',
  })
  iskeyword: string;

  boundKeyCombinations: IKeyBinding[] = [];

  visualstar = false;

  mouseSelectionGoesIntoVisualMode = true;

  changeWordIncludesWhitespace = false;

  foldfix = false;

  disableExtension: boolean = false;

  enableNeovim = false;
  neovimPath = 'nvim';

  substituteGlobalFlag = false;
  whichwrap = '';
  wrapKeys = {};

  report = 2;

  cursorStylePerMode: IModeSpecificStrings<string> = {
    normal: undefined,
    insert: undefined,
    visual: undefined,
    visualline: undefined,
    visualblock: undefined,
    replace: undefined,
  };

  getCursorStyleForMode(modeName: string): vscode.TextEditorCursorStyle | undefined {
    let cursorStyle = this.cursorStylePerMode[modeName.toLowerCase()];
    if (cursorStyle) {
      return this.cursorStyleFromString(cursorStyle);
    }

    return;
  }

  // remappings
  insertModeKeyBindings: IKeyRemapping[] = [];
  insertModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  normalModeKeyBindings: IKeyRemapping[] = [];
  normalModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  visualModeKeyBindings: IKeyRemapping[] = [];
  visualModeKeyBindingsNonRecursive: IKeyRemapping[] = [];

  insertModeKeyBindingsMap: Map<string, IKeyRemapping>;
  insertModeKeyBindingsNonRecursiveMap: Map<string, IKeyRemapping>;
  normalModeKeyBindingsMap: Map<string, IKeyRemapping>;
  normalModeKeyBindingsNonRecursiveMap: Map<string, IKeyRemapping>;
  visualModeKeyBindingsMap: Map<string, IKeyRemapping>;
  visualModeKeyBindingsNonRecursiveMap: Map<string, IKeyRemapping>;

  private static unproxify(obj: Object): Object {
    let result = {};
    for (const key in obj) {
      let val = obj[key] as any;
      if (val !== null && val !== undefined) {
        result[key] = val;
      }
    }
    return result;
  }
}

// handle mapped settings between vscode to vim
function overlapSetting(args: {
  settingName: string;
  defaultValue: OptionValue;
  map?: Map<string | number | boolean, string | number | boolean>;
}) {
  return function(target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function() {
        // retrieve value from vim configuration
        // if the value is not defined or empty
        // look at the equivalent `editor` setting
        // if that is not defined then defer to the default value
        let val = this['_' + propertyKey];
        if (val !== undefined && val !== '') {
          return val;
        }

        val = this.getConfiguration('editor').get(args.settingName, args.defaultValue);
        if (args.map && val !== undefined) {
          val = args.map.get(val);
        }

        return val;
      },
      set: function(value) {
        // synchronize the vim setting with the `editor` equivalent
        this['_' + propertyKey] = value;

        if (value === undefined || value === '' || Globals.isTesting) {
          return;
        }

        if (args.map) {
          for (let [vscodeSetting, vimSetting] of args.map.entries()) {
            if (value === vimSetting) {
              value = vscodeSetting;
              break;
            }
          }
        }

        // update configuration asynchronously
        this.getConfiguration('editor').update(
          args.settingName,
          value,
          vscode.ConfigurationTarget.Global
        );
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export const configuration = new Configuration();
