"use strict";

import {parseQuitCommandArgs} from './subparsers/quit';
import {parseWriteCommandArgs} from './subparsers/write';
import {parseWriteQuitCommandArgs} from './subparsers/writequit';
import * as tabCmd from './subparsers/tab';
import * as fileCmd from './subparsers/file';

// maps command names to parsers for said commands.
export const commandParsers = {
    w: parseWriteCommandArgs,
    write: parseWriteCommandArgs,

    quit: parseQuitCommandArgs,
    q: parseQuitCommandArgs,

    wq: parseWriteQuitCommandArgs,
    writequit: parseWriteQuitCommandArgs,

    tabn: tabCmd.parseTabNCommandArgs,
    tabnext: tabCmd.parseTabNCommandArgs,

    tabp: tabCmd.parseTabPCommandArgs,
    tabprevious: tabCmd.parseTabPCommandArgs,

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

    e: fileCmd.parseEditFileCommandArgs
};
