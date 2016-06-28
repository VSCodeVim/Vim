"use strict";

import {parseQuitCommandArgs} from './subparsers/quit';
import {parseWriteCommandArgs} from './subparsers/write';
import * as tabCmd from './subparsers/tab';

// maps command names to parsers for said commands.
export const commandParsers = {
    w: parseWriteCommandArgs,
    write: parseWriteCommandArgs,

    quit: parseQuitCommandArgs,
    q: parseQuitCommandArgs,

    tabn: tabCmd.parseTabNCommandArgs,
    tabnext: tabCmd.parseTabNCommandArgs,
    tabp: tabCmd.parseTabPCommandArgs,
    tabprevious: tabCmd.parseTabPCommandArgs,
    tabfirst: tabCmd.parseTabFirstCommandArgs,
    tabfir: tabCmd.parseTabFirstCommandArgs,
    tablast: tabCmd.parseTabLastCommandArgs,
    tabl: tabCmd.parseTabLastCommandArgs
};
