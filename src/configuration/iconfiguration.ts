import * as vscode from 'vscode';

export interface IHandleKeys {
  [key: string]: boolean;
}

export interface IModeSpecificStrings {
  normal: string | undefined;
  insert: string | undefined;
  visual: string | undefined;
  visualline: string | undefined;
  visualblock: string | undefined;
  replace: string | undefined;
}

export interface IKeyBinding {
  key: string;
  command: string;
}

export interface IKeyRemapping {
  before: string[];
  after?: string[];
  commands?: { command: string; args: any[] }[];
}

export interface IConfiguration {
  /**
   * Delegate certain key combinations back to VSCode to be handled natively
   */
  handleKeys: IHandleKeys[];

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
   * Use surround plugin?
   */
  surround: boolean;

  /**
   * Use EasyMotion plugin?
   */
  easymotion: boolean;

  /**
   * Easymotion marker appearance settings
   */
  easymotionMarkerBackgroundColor: string;
  easymotionMarkerForegroundColorOneChar: string;
  easymotionMarkerForegroundColorTwoChar: string;
  easymotionMarkerWidthPerChar: number;
  easymotionMarkerHeight: number;
  easymotionMarkerFontFamily: string;
  easymotionMarkerFontSize: string;
  easymotionMarkerFontWeight: string;
  easymotionMarkerYOffset: number;
  easymotionKeys: string;

  /**
   * Timeout in milliseconds for remapped commands.
   */
  timeout: number;

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
  statusBarColors: IModeSpecificStrings;

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
  userCursor: number | undefined;

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
   * Array of all bound key combinations in angle bracket notation
   */
  boundKeyCombinations: IKeyBinding[];

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

  /**
   * Disables extension
   */
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

  /**
   * Cursor style to set based on mode
   */
  getCursorStyleForMode(mode: string): vscode.TextEditorCursorStyle | undefined;

  getConfiguration(section?: string): vscode.WorkspaceConfiguration;

  reload(): void;
}
