"use strict";

import {KeyboardLayout} from "./keyboard";

export class Configuration {

    keyboardLayout : KeyboardLayout;

    constructor(keyboard : KeyboardLayout) {
        this.keyboardLayout = keyboard;
    }

    static fromUserFile() {
        // TODO: read .vimrc or a similar file.
        return new Configuration(KeyboardLayout.fromUserConfiguration());
    }
}