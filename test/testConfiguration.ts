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
  highlightedyank: {
    enable: false;
    color: 'rgba(250, 240, 170, 0.5)';
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
  neovimPath = 'nvim';
  substituteGlobalFlag = false;
  cursorStylePerMode: IModeSpecificStrings<string> = {
    normal: 'line',
    insert: 'block',
    visual: 'underline',
    visualline: 'thin-lin',
    visualblock: 'block-outline',
    replace: 'underline-thin,',
  };
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
  whichwrap = '';
  wrapKeys = {};
  report = 2;
  digraphs: {};
}
