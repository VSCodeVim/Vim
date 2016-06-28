"use strict";

import * as node from "../commands/tab";
import {Scanner} from '../scanner';

function parseCount(args: string): number {
    if (!args) {
        return 1;
    }

    let scanner = new Scanner(args);
    scanner.skipWhiteSpace();

    if (scanner.isAtEof) {
        return 1;
    }

    let c = scanner.next();
    let count = Number.parseInt(c);

    if (Number.isInteger(count) && count > 0 ) {
        if (count > 999) {
            count = 999;
        }

        return count;
    } else {
        throw new Error(`Invalid tab number: ${c}!`);
    }
}

export function parseTabNCommandArgs(args : string) : node.TabCommand {
    return new node.TabCommand({
        tab: node.Tab.Next,
        count: parseCount(args)
    });
}

export function parseTabPCommandArgs(args : string) : node.TabCommand {
    return new node.TabCommand({
        tab: node.Tab.Previous,
        count: parseCount(args)
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

export function parseTabNewCommandArgs(args: string) : node.TabCommand {
    // New Tab command should support `count`
    // And the new created Tab's position depends on `count`
    // For now VS Code only allows open tab next to current Tab
    // So `count == 0` is not possible. But we can workaround this once we can move tabs through API.
    return new node.TabCommand({
        tab: node.Tab.New
    });
}