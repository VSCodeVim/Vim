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

export abstract class ConfigurationBase {
  protected readonly stringToCursorTypeMap = {
    line: vscode.TextEditorCursorStyle.Line,
    block: vscode.TextEditorCursorStyle.Block,
    underline: vscode.TextEditorCursorStyle.Underline,
    'line-thin': vscode.TextEditorCursorStyle.LineThin,
    'block-outline': vscode.TextEditorCursorStyle.BlockOutline,
    'underline-thin': vscode.TextEditorCursorStyle.UnderlineThin,
  };

  /**
   * Cursor style to set based on mode
   */
  getCursorStyleForMode(mode: string): vscode.TextEditorCursorStyle | undefined {
    return this.stringToCursorTypeMap[this.cursorStylePerMode[mode]];
  }

  getConfiguration(section: string = ''): vscode.WorkspaceConfiguration {
    let resource: vscode.Uri | undefined = undefined;
    let activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
      resource = activeTextEditor.document.uri;
    }
    return vscode.workspace.getConfiguration(section, resource);
  }

  abstract reload(): void;
  /**
   * Delegate certain key combinations back to VSCode to be handled natively
   */
  handleKeys: IHandleKeys[] = [];

  /**
   * Use the system's clipboard when copying.
   */
  useSystemClipboard = false;

  /**
   * Enable ctrl- actions that would override existing VSCode actions.
   */
  useCtrlKeys = false;

  /**
   * Override default VSCode copy behavior.
   */
  overrideCopy = true;

  /**
   * Width in characters to word-wrap to.
   */
  textwidth = 80;

  /**
   * Should we highlight incremental search matches?
   */
  hlsearch = false;

  /**
   * Ignore case when searching with / or ?.
   */
  ignorecase = true;

  /**
   * In / or ?, default to ignorecase=true unless the user types a capital
   * letter.
   */
  smartcase = true;

  /**
   * Indent automatically?
   */
  autoindent = true;

  /**
   * Use surround plugin?
   */
  surround = true;

  /**
   * Use EasyMotion plugin?
   */
  easymotion = false;

  /**
   * Easymotion marker appearance settings
   */
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

  /**
   * Timeout in milliseconds for remapped commands.
   */
  timeout = 1000;

  /**
   * Display partial commands on status bar?
   */
  showcmd = true;

  /**
   * Display mode name text on status bar?
   */
  showmodename = true;

  /**
   * What key should <leader> map to in key remappings?
   */
  leader = '\\';

  /**
   * How much search or command history should be remembered
   */
  history = 50;

  /**
   * Show results of / or ? search as user is typing?
   */
  incsearch = true;

  /**
   * Start in insert mode?
   */
  startInInsertMode = false;

  /**
   * Enable changing of the status bar color based on mode
   */
  statusBarColorControl = false;

  /**
   * Status bar colors to change to based on mode
   */
  statusBarColors: IModeSpecificStrings = {
    normal: '#005f5f',
    insert: '#5f0000',
    visual: '#5f00af',
    visualline: '#005f87',
    visualblock: '#86592d',
    replace: '#000000',
  };

  /**
   * Color of search highlights.
   */
  searchHighlightColor = 'rgba(150, 150, 255, 0.3)';

  /**
   * Size of a tab character.
   */
  tabstop= 8;

  /**
   * Type of cursor user is using native to vscode
   */
  userCursor = vscode.TextEditorCursorStyle.Line;

  expandtab = false;

  /**
   * Show line numbers
   */
  number= true;

  /**
   * Show relative line numbers?
   */
  relativenumber= false;

  /**
   * Disable/Enable Extension
   */
  protected disableExtension = false;


  iskeyword = '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?-';

  /**
   * Array of all bound key combinations in angle bracket notation
   */
  boundKeyCombinations: IKeyBinding[] = [];

  /**
   * In visual mode, start a search with * or # using the current selection
   */
  visualstar = false;

  /**
   * Does dragging with the mouse put you into visual mode
   */
  mouseSelectionGoesIntoVisualMode = true;

  /**
   * Uses a hack to fix moving around folds.
   */
  foldfix = false;

  /**
   * Disables extension
   */
  disableExt = false;

  /**
   * Neovim
   */
  enableNeovim = false;
  neovimPath = 'nvim';

  /**
   * Automatically apply the /g flag to substitute commands.
   */
  substituteGlobalFlag = false;

  /**
   * When typing a command show the initial colon ':' character
   */
  cmdLineInitialColon = false;

  /**
   * Keybindings
   */
  insertModeKeyBindings: IKeyRemapping[] = [];
  insertModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  otherModesKeyBindings: IKeyRemapping[] = [];
  otherModesKeyBindingsNonRecursive: IKeyRemapping[] = [];

  protected cursorStylePerMode: IModeSpecificStrings = {
    normal: undefined,
    insert: undefined,
    visual: undefined,
    visualline: undefined,
    visualblock: undefined,
    replace: undefined,
  };
}
