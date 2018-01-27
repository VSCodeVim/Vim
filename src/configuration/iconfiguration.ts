import * as vscode from 'vscode';

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
  commands?: { command: string; args: any[] }[];
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
   * Use EasyMotion plugin?
   */
  easymotion: boolean;

  /**
   * Use surround plugin?
   */
  surround: boolean;

  /**
   * Easymotion marker appearance settings
   */
  easymotionMarkerBackgroundColor: string;
  easymotionMarkerForegroundColorOneChar: string;
  easymotionMarkerForegroundColorTwoChar: string;
  easymotionMarkerWidthPerChar : number;
  easymotionMarkerHeight : number;
  easymotionMarkerFontFamily: string;
  easymotionMarkerFontSize: string;
  easymotionMarkerFontWeight: string;
  easymotionMarkerYOffset : number;
  easymotionKeys: string;

  /**
   * Timeout in milliseconds for remapped commands.
   */
  timeout : number;

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
  leader : string;

  /**
   * How much search or command history should be remembered
   */
  history : number;

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
  statusBarColors: IModeSpecificStrings<string>;

  /**
   * Color of search highlights.
   */
  searchHighlightColor: string;

  /**
   * Size of a tab character.
   */
  tabstop: number;

  /**
   * Type of cursor user is using native to vscode
   */
  userCursor: vscode.TextEditorCursorStyle | undefined;

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
   * Uses a hack to fix moving around folds.
   */
  foldfix: boolean;

  disableExt: boolean;

  /**
   * Neovim
   */
  enableNeovim: boolean;
  neovimPath: string;

  /**
   * Automatically apply the /g flag to substitute commands.
   */
  substituteGlobalFlag: boolean;

  modeToCursorStyleMap: IModeSpecificStrings<vscode.TextEditorCursorStyle>;

  /**
   * When typing a command show the initial colon ':' character
   */
  cmdLineInitialColon: boolean;

  /**
   * Keybindings
   */
  insertModeKeyBindings: IKeyRemapping[];
  insertModeKeyBindingsNonRecursive: IKeyRemapping[];
  otherModesKeyBindings: IKeyRemapping[];
  otherModesKeyBindingsNonRecursive: IKeyRemapping[];
}