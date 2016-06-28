"use strict";

import * as node from "../commands/tab";
import {Scanner} from '../scanner';
import {VimError, ErrorCode} from '../../error';

export function parseTabNCommandArgs(args : string) : node.TabCommand {
    return new node.TabCommand({
        tab: node.Tab.Next
    });
}

export function parseTabPCommandArgs(args : string) : node.TabCommand {
    return new node.TabCommand({
        tab: node.Tab.Previous
    });
}

export function parseTabFirstCommandArgs(args : string) : node.TabCommand {
    return new node.TabCommand({
        tab: node.Tab.First
    });
}

export function parseTabLastCommandArgs(args : string) : node.TabCommand {
    return new node.TabCommand({
        tab: node.Tab.Last
    });
}