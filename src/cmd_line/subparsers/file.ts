"use strict";

import * as node from "../commands/file";
import {Scanner} from '../scanner';

export function parseEditFileCommandArgs(args: string): node.FileCommand {
    if (!args) {
        return new node.FileCommand({});
    }

    var scanner = new Scanner(args);
    scanner.skipWhiteSpace();

    let name = "";
    while (true) {
        if (scanner.isAtEof) {
            break;
        }
        let c = scanner.next();

        if (/\s/.test(c)) {
            break;
        } else {
            name += c;
        }
    }

    return new node.FileCommand({
        name: name
    });
}