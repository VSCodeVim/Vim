import { parseCloseCommandArgs } from './subparsers/close';
import { parseDeleteRangeLinesCommandArgs } from './subparsers/deleteRange';
import { parseDigraphCommandArgs } from './subparsers/digraph';
import * as fileCmd from './subparsers/file';
import { parseNohlCommandArgs } from './subparsers/nohl';
import { parseOnlyCommandArgs } from './subparsers/only';
import { parseQuitAllCommandArgs, parseQuitCommandArgs } from './subparsers/quit';
import { parseReadCommandArgs } from './subparsers/read';
import { parseRegisterCommandArgs } from './subparsers/register';
import { parseOptionsCommandArgs } from './subparsers/setoptions';
import { parseSortCommandArgs } from './subparsers/sort';
import { parseSubstituteCommandArgs } from './subparsers/substitute';
import * as tabCmd from './subparsers/tab';
import { parseWallCommandArgs } from './subparsers/wall';
import { parseWriteCommandArgs } from './subparsers/write';
import { parseWriteQuitCommandArgs } from './subparsers/writequit';
import { parseWriteQuitAllCommandArgs } from './subparsers/writequitall';

// maps command names to parsers for said commands.
export const commandParsers = {
  w: parseWriteCommandArgs,
  write: parseWriteCommandArgs,

  wa: parseWallCommandArgs,
  wall: parseWallCommandArgs,

  nohlsearch: parseNohlCommandArgs,
  noh: parseNohlCommandArgs,
  nohl: parseNohlCommandArgs,

  close: parseCloseCommandArgs,
  clo: parseCloseCommandArgs,

  quit: parseQuitCommandArgs,
  q: parseQuitCommandArgs,

  qa: parseQuitAllCommandArgs,
  qall: parseQuitAllCommandArgs,

  wq: parseWriteQuitCommandArgs,
  writequit: parseWriteQuitCommandArgs,
  x: parseWriteQuitCommandArgs,

  wqa: parseWriteQuitAllCommandArgs,
  wqall: parseWriteQuitAllCommandArgs,
  xa: parseWriteQuitAllCommandArgs,
  xall: parseWriteQuitAllCommandArgs,

  tabn: tabCmd.parseTabNCommandArgs,
  tabnext: tabCmd.parseTabNCommandArgs,

  tabp: tabCmd.parseTabPCommandArgs,
  tabprevious: tabCmd.parseTabPCommandArgs,
  tabN: tabCmd.parseTabPCommandArgs,
  tabNext: tabCmd.parseTabPCommandArgs,

  tabfirst: tabCmd.parseTabFirstCommandArgs,
  tabfir: tabCmd.parseTabFirstCommandArgs,

  tablast: tabCmd.parseTabLastCommandArgs,
  tabl: tabCmd.parseTabLastCommandArgs,

  tabe: tabCmd.parseTabNewCommandArgs,
  tabedit: tabCmd.parseTabNewCommandArgs,
  tabnew: tabCmd.parseTabNewCommandArgs,

  tabclose: tabCmd.parseTabCloseCommandArgs,
  tabc: tabCmd.parseTabCloseCommandArgs,

  tabo: tabCmd.parseTabOnlyCommandArgs,
  tabonly: tabCmd.parseTabOnlyCommandArgs,

  tabm: tabCmd.parseTabMovementCommandArgs,

  s: parseSubstituteCommandArgs,

  e: fileCmd.parseEditFileCommandArgs,
  edit: fileCmd.parseEditFileCommandArgs,
  ene: fileCmd.parseEditNewFileCommandArgs,
  enew: fileCmd.parseEditNewFileCommandArgs,

  sp: fileCmd.parseEditFileInNewHorizontalWindowCommandArgs,
  split: fileCmd.parseEditFileInNewHorizontalWindowCommandArgs,
  vs: fileCmd.parseEditFileInNewVerticalWindowCommandArgs,
  vsp: fileCmd.parseEditFileInNewVerticalWindowCommandArgs,
  vsplit: fileCmd.parseEditFileInNewVerticalWindowCommandArgs,

  new: fileCmd.parseEditNewFileInNewHorizontalWindowCommandArgs,
  vne: fileCmd.parseEditNewFileInNewVerticalWindowCommandArgs,
  vnew: fileCmd.parseEditNewFileInNewVerticalWindowCommandArgs,

  on: parseOnlyCommandArgs,
  only: parseOnlyCommandArgs,

  set: parseOptionsCommandArgs,
  se: parseOptionsCommandArgs,

  read: parseReadCommandArgs,
  r: parseReadCommandArgs,

  reg: parseRegisterCommandArgs,

  dig: parseDigraphCommandArgs,
  digr: parseDigraphCommandArgs,
  digraph: parseDigraphCommandArgs,
  digraphs: parseDigraphCommandArgs,

  d: parseDeleteRangeLinesCommandArgs,

  sort: parseSortCommandArgs,
};
