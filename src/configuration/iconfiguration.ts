import * as vscode from 'vscode';

export type Digraph = [string, number | number[]];

export interface IModeSpecificStrings<T> {
  normal: T | undefined;
  insert: T | undefined;
  visual: T | undefined;
  visualline: T | undefined;
  visualblock: T | undefined;
  replace: T | undefined;
}

export interface IKeyRemapping {
  before: string[];
  after?: string[];
  // 'recursive' is calculated when validating, according to the config that stored the remapping
  recursive?: boolean;
  commands?: ({ command: string; args: any[] } | string)[];
  source?: 'vscode' | 'vimrc';
}

export interface IVimrcKeyRemapping {
  keyRemapping: IKeyRemapping;
  keyRemappingType: string;
}

export interface IAutoSwitchInputMethod {
  enable: boolean;
  defaultIM: string;
  switchIMCmd: string;
  obtainIMCmd: string;
}

export interface IDebugConfiguration {
  /**
   * Boolean indicating whether all logs should be suppressed
   * This value overrides both `loggingLevelForAlert` and `loggingLevelForConsole`
   */
  silent: boolean;

  /**
   * Maximum level of messages to show as VS Code information message
   */
  loggingLevelForAlert: 'error' | 'warn' | 'info' | 'verbose' | 'debug';

  /**
   * Maximum level of messages to log to console.
   */
  loggingLevelForConsole: 'error' | 'warn' | 'info' | 'verbose' | 'debug';
}

export interface IHighlightedYankConfiguration {
  /**
   * Boolean indicating whether yank highlighting should be enabled.
   */
  enable: boolean;

  /**
   * Color of the yank highlight.
   */
  color: string;

  /**
   * Color of the text being highlighted.
   */
  textColor: string | undefined;

  /**
   * Duration in milliseconds of the yank highlight.
   */
  duration: number;
}

export interface ICamelCaseMotionConfiguration {
  /**
   * Enable CamelCaseMotion plugin or not
   */
  enable: boolean;
}

export interface IConfiguration {
  /**
   * Use the system's clipboard when copying.
   */
  useSystemClipboard: boolean;

  /**
   * Enable ctrl- actions that would override existing VSCode actions.
   */
  useCtrlKeys: boolean;

  /**
   * Override default VSCode copy behavior.
   */
  overrideCopy: boolean;

  /**
   * Width in characters to word-wrap to.
   */
  textwidth: number;

  /**
   * Should we highlight incremental search matches?
   */
  hlsearch: boolean;

  /**
   * Ignore case when searching with / or ?.
   */
  ignorecase: boolean;

  /**
   * In / or ?, default to ignorecase=true unless the user types a capital
   * letter.
   */
  smartcase: boolean;

  /**
   * Indent automatically?
   */
  autoindent: boolean;

  /**
   * CamelCaseMotion plugin options
   */
  camelCaseMotion: ICamelCaseMotionConfiguration;

  /**
   * Use EasyMotion plugin?
   */
  easymotion: boolean;

  /**
   * Use ReplaceWithRegister plugin?
   */
  replaceWithRegister: boolean;

  /**
   * Use SmartRelativeLine plugin?
   */
  smartRelativeLine: boolean;

  /**
   * Use sneak plugin?
   */
  sneak: boolean;

  /**
   * Case sensitivity is determined by 'ignorecase' and 'smartcase'
   */
  sneakUseIgnorecaseAndSmartcase: boolean;

  /**
   * Use single-character `sneak` instead of Vim's native `f`"
   */
  sneakReplacesF: boolean;

  /**
   * Use surround plugin?
   */
  surround: boolean;

  /**
   * Customize argument textobject delimiter and separator characters
   */
  argumentObjectSeparators: string[];
  argumentObjectOpeningDelimiters: string[];
  argumentObjectClosingDelimiters: string[];

  /**
   * Easymotion marker appearance settings
   */
  easymotionMarkerBackgroundColor: string;
  easymotionMarkerForegroundColorOneChar: string;
  easymotionMarkerForegroundColorTwoChar: string; // Deprecated! Use the ones bellow
  easymotionMarkerForegroundColorTwoCharFirst: string;
  easymotionMarkerForegroundColorTwoCharSecond: string;
  easymotionIncSearchForegroundColor: string;
  easymotionDimColor: string;
  easymotionMarkerWidthPerChar: number; // Deprecated! No longer needed!
  easymotionDimBackground: boolean;
  easymotionMarkerFontFamily: string; // Deprecated! No longer needed!
  easymotionMarkerFontSize: string; // Deprecated! No longer needed!
  easymotionMarkerFontWeight: string;
  easymotionMarkerMargin: number; // Deprecated! No longer needed!
  easymotionKeys: string;

  /**
   * Timeout in milliseconds for remapped commands.
   */
  timeout: number;

  /**
   * Maximum number of times a mapping is done without resulting in a
   * character to be used. This normally catches endless mappings, like
   * ":map x y" with ":map y x". It still does not catch ":map g wg",
   * because the 'w' is used before the next mapping is done.
   */
  maxmapdepth: number;

  /**
   * Display partial commands on status bar?
   */
  showcmd: boolean;

  /**
   * Display mode name text on status bar?
   */
  showmodename: boolean;

  /**
   * What key should <leader> map to in key remappings?
   */
  leader: string;

  /**
   * How much search or command history should be remembered
   */
  history: number;

  /**
   * Show results of / or ? search as user is typing?
   */
  incsearch: boolean;

  /**
   * Start in insert mode?
   */
  startInInsertMode: boolean;

  /**
   * Enable changing of the status bar color based on mode
   */
  statusBarColorControl: boolean;

  /**
   * Status bar colors to change to based on mode
   */
  statusBarColors: IModeSpecificStrings<string | string[]>;

  /**
   * Extension debugging settings
   */
  debug: IDebugConfiguration;

  /**
   * Color of search highlights.
   */
  searchHighlightColor: string;
  searchHighlightTextColor: string;

  /**
   * Yank highlight settings.
   */
  highlightedyank: IHighlightedYankConfiguration;

  /**
   * Size of a tab character.
   */
  tabstop: number;

  /**
   * Type of cursor user is using native to vscode
   */
  editorCursorStyle: vscode.TextEditorCursorStyle | undefined;

  /**
   * Use spaces when the user presses tab?
   */
  expandtab: boolean;

  /**
   * Show line numbers
   */
  number: boolean;

  /**
   * Show relative line numbers?
   */
  relativenumber: boolean;

  /**
   * keywords contain alphanumeric characters and '_'.
   * If not configured `editor.wordSeparators` is used
   */
  iskeyword: string;

  /**
   * In visual mode, start a search with * or # using the current selection
   */
  visualstar: boolean;

  /**
   * Does dragging with the mouse put you into visual mode
   */
  mouseSelectionGoesIntoVisualMode: boolean;

  /**
   * Includes trailing whitespace when changing word.
   */
  changeWordIncludesWhitespace: boolean;

  /**
   * Uses a hack to fix moving around folds.
   */
  foldfix: boolean;

  /**
   * "Soft"-disabling of extension.
   * Differs from VS Code's disablng of the extension as the extension
   * will still be loaded and activated, but all functionality will be disabled.
   */
  disableExtension: boolean;

  /**
   * Neovim
   */
  enableNeovim: boolean;
  neovimPath: string;

  /**
   * .vimrc
   */
  vimrc: {
    enable: boolean;
    /**
     * Do not use this directly - VimrcImpl.path resolves this to a path that's guaranteed to exist.
     */
    path: string;
  };

  /**
   * Automatically apply the `/g` flag to substitute commands.
   */
  gdefault: boolean;
  substituteGlobalFlag: boolean; // Deprecated in favor of gdefault

  /**
   * InputMethodSwicher
   */
  autoSwitchInputMethod: IAutoSwitchInputMethod;

  /**
   * Keybindings
   */
  insertModeKeyBindings: IKeyRemapping[];
  insertModeKeyBindingsNonRecursive: IKeyRemapping[];
  normalModeKeyBindings: IKeyRemapping[];
  normalModeKeyBindingsNonRecursive: IKeyRemapping[];
  operatorPendingModeKeyBindings: IKeyRemapping[];
  operatorPendingModeKeyBindingsNonRecursive: IKeyRemapping[];
  visualModeKeyBindings: IKeyRemapping[];
  visualModeKeyBindingsNonRecursive: IKeyRemapping[];
  commandLineModeKeyBindings: IKeyRemapping[];
  commandLineModeKeyBindingsNonRecursive: IKeyRemapping[];

  /**
   * These are constructed by the RemappingValidator
   */
  insertModeKeyBindingsMap: Map<string, IKeyRemapping>;
  normalModeKeyBindingsMap: Map<string, IKeyRemapping>;
  operatorPendingModeKeyBindingsMap: Map<string, IKeyRemapping>;
  visualModeKeyBindingsMap: Map<string, IKeyRemapping>;
  commandLineModeKeyBindingsMap: Map<string, IKeyRemapping>;

  /**
   * Comma-separated list of motion keys that should wrap to next/previous line.
   */
  whichwrap: string;

  cursorStylePerMode: IModeSpecificStrings<string>;

  /**
   * Threshold to report changed lines to status bar
   */
  report: number;

  /**
   * User-defined digraphs
   */
  digraphs: { [shortcut: string]: Digraph };

  /**
   * Searches wrap around the end of the file.
   */
  wrapscan: boolean;

  /**
   * Number of lines to scroll with CTRL-U and CTRL-D commands. Set to 0 to use a half page scroll.
   */
  scroll: number;

  /**
   * When `true` the commands listed below move the cursor to the first non-blank of the line. When
   * `false` the cursor is kept in the same column (if possible). This applies to the commands:
   * `<C-d>`, `<C-u>`, `<C-b>`, `<C-f>`, `G`, `H`, `M`, `L`, `gg`, and to the commands `d`, `<<`
   * and `>>` with a linewise operator.
   */
  startofline: boolean;

  /**
   * Show the currently set mark(s) in the gutter.
   */
  showMarksInGutter: boolean;
}
