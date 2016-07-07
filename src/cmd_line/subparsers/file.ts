"use strict";

import * as node from "../commands/file";
import {Scanner} from '../scanner';

export function parseEditFileCommandArgs(args: string): node.FileCommand {
    if (!args) {
        return new node.FileCommand({});
    }

    var scanner = new Scanner(args);
    let name = scanner.nextWord();

    return new node.FileCommand({
        name: name
    });
}