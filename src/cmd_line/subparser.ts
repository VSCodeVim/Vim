"use strict";

import {parseQuitCommandArgs} from './subparsers/quit';
import {parseWriteCommandArgs} from './subparsers/write';
import {parseWallCommandArgs} from './subparsers/wall';
import {parseWriteQuitCommandArgs} from './subparsers/writequit';
import * as tabCmd from './subparsers/tab';
import * as fileCmd from './subparsers/file';
import {parseOptionsCommandArgs} from './subparsers/setoptions';
import {parseSubstituteCommandArgs} from './subparsers/substitute';
import {parseRegisterCommandArgs} from './subparsers/register';

// maps command names to parsers for said commands.
export const commandParsers = {
  w: parseWriteCommandArgs,
  write: parseWriteCommandArgs,

  wa: parseWallCommandArgs,
  wall: parseWallCommandArgs,

  quit: parseQuitCommandArgs,
  q: parseQuitCommandArgs,

  wq: parseWriteQuitCommandArgs,
  writequit: parseWriteQuitCommandArgs,

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

  e: fileCmd.parseEditFileCommandArgs,

  s: parseSubstituteCommandArgs,
  vsp: fileCmd.parseEditFileInNewWindowCommandArgs,
  vsplit: fileCmd.parseEditFileInNewWindowCommandArgs,
  vne: fileCmd.parseEditNewFileInNewWindowCommandArgs,
  vnew: fileCmd.parseEditNewFileInNewWindowCommandArgs,

  set: parseOptionsCommandArgs,
  se: parseOptionsCommandArgs,

  reg: parseRegisterCommandArgs
};
