"use strict";

import { CommandKeyMap } from './commandKeyMap';

export class Configuration {

    commandKeyMap : CommandKeyMap;

    constructor(keyMap : CommandKeyMap) {
        this.commandKeyMap = keyMap;
    }

    static fromUserFile() {
        return new Configuration(
            CommandKeyMap.fromUserConfiguration()
        );
    }
}