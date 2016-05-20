"use strict";

import { CommandKeyMap } from './commandKeyMap';
import { KeyboardLayout } from './keyboard';

export class Configuration {

    keyboardLayout : KeyboardLayout;
    commandKeyMap : CommandKeyMap;

    constructor(keyboard : KeyboardLayout, keyMap : CommandKeyMap) {
        this.keyboardLayout = keyboard;
        this.commandKeyMap = keyMap;
    }

    static fromUserFile() {
        return new Configuration(
            KeyboardLayout.fromUserConfiguration(),
            CommandKeyMap.fromUserConfiguration()
        );
    }
}