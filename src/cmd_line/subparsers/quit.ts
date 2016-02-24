"use strict";

import * as node from "../commands/quit";
import {Scanner} from '../scanner';
import {VimError, ErrorCode} from '../../error';

export function parseQuitCommandArgs(args : string) : node.QuitCommand {
    if (!args) {
        return new node.QuitCommand({});
    }
    var scannedArgs : node.IQuitCommandArguments = {};
    var scanner = new Scanner(args);
    const c = scanner.next();
    if (c === '!') {
        scannedArgs.bang = true;
        scanner.ignore();
    } else if (c !== ' ') {
        throw VimError.fromCode(ErrorCode.E488);
    }
    scanner.skipWhiteSpace();
    if (!scanner.isAtEof) {
        throw VimError.fromCode(ErrorCode.E488);
    }
    return new node.QuitCommand(scannedArgs);
}
