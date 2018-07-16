import * as vscode from 'vscode';

import { IConfiguration, IKeyRemapping } from '../src/configuration/iconfiguration';

export class Configuration implements IConfiguration {
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
  statusBarColors: {
    normal: '#005f5f';
    insert: '#5f0000';
    visual: '#5f00af';
    visualline: '#005f87';
    visualblock: '#86592d';
    replace: '#000000';
  };
  debug: {
    loggingLevel: 'warn';
  };
  searchHighlightColor = 'rgba(150, 150, 255, 0.3)';
  tabstop = 2;
  userCursor = vscode.TextEditorCursorStyle.Line;
  expandtab = true;
  number = true;
  relativenumber = false;
  iskeyword = '/\\()"\':,.;<>~!@#$%^&*|+=[]{}`?-';
  visualstar = false;
  mouseSelectionGoesIntoVisualMode = true;
  foldfix = false;
  disableExt = false;
  enableNeovim = false;
  neovimPath = 'nvim';
  substituteGlobalFlag = false;
  modeToCursorStyleMap = {
    normal: vscode.TextEditorCursorStyle.Line,
    insert: vscode.TextEditorCursorStyle.Line,
    visual: vscode.TextEditorCursorStyle.Line,
    visualline: vscode.TextEditorCursorStyle.Line,
    visualblock: vscode.TextEditorCursorStyle.Line,
    replace: vscode.TextEditorCursorStyle.Line,
  };
  insertModeKeyBindings: IKeyRemapping[] = [];
  insertModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  normalModeKeyBindings: IKeyRemapping[] = [];
  normalModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
  visualModeKeyBindings: IKeyRemapping[] = [];
  visualModeKeyBindingsNonRecursive: IKeyRemapping[] = [];
}
