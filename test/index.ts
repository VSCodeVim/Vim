//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testRoot: string, clb: (error:Error) => void) that the extension
// host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.

import * as vscode from 'vscode';
import { Globals } from '../src/globals';
import {
  IConfiguration,
  IHandleKeys,
  IModeSpecificStrings,
  IKeyBinding,
  IKeyRemapping,
} from '../src/configuration/iconfiguration';

Globals.isTesting = true;

export class TestConfiguration implements IConfiguration {
  reload(): void {
    return;
  }
  getConfiguration(section: string): vscode.WorkspaceConfiguration {
    throw new Error('Method not implemented.');
  }
  getCursorStyleForMode(mode: string): vscode.TextEditorCursorStyle | undefined {
    throw new Error('Method not implemented.');
  }
  handleKeys: IHandleKeys[];
  useSystemClipboard: boolean;
  useCtrlKeys: boolean;
  overrideCopy: boolean;
  textwidth: number;
  hlsearch: boolean;
  ignorecase: boolean;
  smartcase: boolean;
  autoindent: boolean;
  surround: boolean;
  easymotion: boolean;
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
  timeout: number;
  showcmd: boolean;
  showmodename: boolean;
  leader: string;
  history: number;
  incsearch: boolean;
  startInInsertMode: boolean;
  statusBarColorControl: boolean;
  statusBarColors: IModeSpecificStrings;
  searchHighlightColor: string;
  tabstop: number;
  userCursor: number | undefined;
  expandtab: boolean;
  number: boolean;
  relativenumber: boolean;
  iskeyword: string;
  boundKeyCombinations: IKeyBinding[];
  visualstar: boolean;
  mouseSelectionGoesIntoVisualMode: boolean;
  foldfix: boolean;
  disableExt: boolean;
  enableNeovim: boolean;
  neovimPath: string;
  substituteGlobalFlag: boolean;
  cursorStylePerMode: IModeSpecificStrings;
  cmdLineInitialColon: boolean;
  insertModeKeyBindings: IKeyRemapping[];
  insertModeKeyBindingsNonRecursive: IKeyRemapping[];
  otherModesKeyBindings: IKeyRemapping[];
  otherModesKeyBindingsNonRecursive: IKeyRemapping[];
}

// See https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options for more info
var testRunner = require('vscode/lib/testrunner');
testRunner.configure({
  ui: 'tdd',
  useColors: true,
  timeout: 10000,
});

module.exports = testRunner;
