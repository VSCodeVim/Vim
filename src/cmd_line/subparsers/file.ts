"use strict";

import * as node from "../commands/file";
import {Scanner} from '../scanner';

export function parseEditFileCommandArgs(args: string): node.FileCommand {
    if (!args) {
        return new node.FileCommand({});
    }

    var scanner = new Scanner(args);
    scanner.skipWhiteSpace();

    if (scanner.isAtEof) {
        return new node.FileCommand({});
    }

    let c = scanner.next();
    return new node.FileCommand({
        name: c
    });
}