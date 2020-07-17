import * as vscode from 'vscode';

import {
  IConfiguration,
  IKeyRemapping,
  IModeSpecificStrings,
} from '../src/configuration/iconfiguration';

export class Configuration implements IConfiguration {
  useSystemClipboard = false;
  useCtrlKeys = false;
  overrideCopy = true;
  textwidth = 80;
  hlsearch = false;
  ignorecase = true;
  smartcase = true;
  autoindent = true;
  camelCaseMotion = {
    enable: false,
  };
  replaceWithRegister = false;
  sneak = false;
  sneakUseIgnorecaseAndSmartcase = false;
  sneakReplacesF = false;
  surround = false;
  argumentObjectSeparators = [','];
  argumentObjectOpeningDelimiters = ['(', '['];
  argumentObjectClosingDelimiters = [')', ']'];
  easymotion = false;
  easymotionMarkerBackgroundColor = '';
  easymotionMarkerForegroundColorOneChar = '#ff0000';
  easymotionMarkerForegroundColorTwoChar = '#ffa500';
  easymotionMarkerWidthPerChar = 8;
  easymotionDimBackground = true;
  easymotionMarkerFontFamily = 'Consolas';
  easymotionMarkerFontSize = '14';
  easymotionMarkerFontWeight = 'normal';
  easymotionMarkerMargin = 0;
  easymotionKeys = 'hklyuiopnm,qwertzxcvbasdgjf;';
  autoSwitchInputMethod = {
    enable: false,
    defaultIM: '',
    switchIMCmd: '',
    obtainIMCmd: '',
  };
  timeout = 1000;
  showcmd = true;
  showmodename = true;
  leader = '//';
  history = 50;
  incsearch = true;
  startInInsertMode = false;
  statusBarColorControl = false;
  statusBarColors: IModeSpecificStrings<string | string[]> = {
    normal: ['#8FBCBB', '#434C5E'],
    insert: '#BF616A',
    visual: '#B48EAD',
    visualline: '#B48EAD',
    visualblock: '#A3BE8C',
    replace: '#D08770',
  };
  debug: {
    silent: false;
    loggingLevelForAlert: 'error';
    loggingLevelForConsole: 'debug';
  };
  searchHighlightColor = 'rgba(150, 150, 255, 0.3)';
  searchHighlightTextColor = '';
  highlightedyank: {
    enable: false;
    color: 'rgba(250, 240, 170, 0.5)';
    textColor: '';
    duration: 200;
  };
  tabstop = 2;
  editorCursorStyle = vscode.TextEditorCursorStyle.Line;
  expandtab = true;
  number = true;
  relativenumber = false;
  iskeyword = '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?-';
  visualstar = false;
  mouseSelectionGoesIntoVisualMode = true;
  changeWordIncludesWhitespace = false;
  foldfix = false;
  disableExtension = false;
  enableNeovim = false;
  gdefault = false;
  substituteGlobalFlag = false; // Deprecated in favor of gdefault
  neovimPath = 'nvim';
  vimrc = {
    enable: false,
    path: '',
  };
  cursorStylePerMode: IModeSpecificStrings<string> = {
    normal: 'line',
    insert: 'block',
    visual: 'underline',
    visualline: 'line-thin',
    visualblock: 'block-outline',
    replace: 'underline-thin,',
  };
  insertModeKeyBindings: IKeyRemapping[] = [];
  insertModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  normalModeKeyBindings: IKeyRemapping[] = [];
  normalModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  visualModeKeyBindings: IKeyRemapping[] = [];
  visualModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  commandLineModeKeyBindings: IKeyRemapping[] = [];
  commandLineModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  insertModeKeyBindingsMap: Map<string, IKeyRemapping>;
  insertModeKeyBindingsNonRecursiveMap: Map<string, IKeyRemapping>;
  normalModeKeyBindingsMap: Map<string, IKeyRemapping>;
  normalModeKeyBindingsNonRecursiveMap: Map<string, IKeyRemapping>;
  visualModeKeyBindingsMap: Map<string, IKeyRemapping>;
  visualModeKeyBindingsNonRecursiveMap: Map<string, IKeyRemapping>;
  commandLineModeKeyBindingsMap: Map<string, IKeyRemapping>;
  commandLineModeKeyBindingsNonRecursiveMap: Map<string, IKeyRemapping>;
  whichwrap = '';
  wrapKeys = {};
  report = 2;
  digraphs: {};
  wrapscan = true;
  scroll = 20;
  startofline = true;
}
