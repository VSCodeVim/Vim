"use strict";

import * as vscode from "vscode";

export class KeyboardLayout {
    private mapper : IKeyMapper;

    constructor(mapper? : IKeyMapper) {
        this.mapper = mapper;
    }

    get name() : string {
        return this.mapper ? this.mapper.name : 'en-US (QWERTY)';
    }

    translate (key : string) : string {
        return this.mapper ? this.mapper.get(key) : key;
    }

    static fromUserConfiguration() : KeyboardLayout {
        const layout = vscode.workspace.getConfiguration('vim').get("keyboardLayout");

        console.log("Using Vim keyboard layout: " + layout);

        switch (layout) {
            case 'es-ES (QWERTY)':
                return new KeyboardLayout(new KeyMapperEsEsQwerty());
            case 'de-DE (QWERTZ)':
                return new KeyboardLayout(new KeyMapperDeDeQwertz());
            case 'da-DK (QWERTY)':
                return new KeyboardLayout(new KeyMapperDaDKQwerty());
            case 'sv-SE (QWERTY)':
                return new KeyboardLayout(new KeyMapperSvSEQwerty());
            default:
                return new KeyboardLayout();
        }
    }
}

export interface IKeyMapper {
    name : string;
    get(key : string) : string;
}

class KeyMapperEsEsQwerty implements IKeyMapper {

    private mappings = {};

    constructor() {
        this.mappings = {
            '>': ':',
            // '\\': '<', // doesn't really work; in my keyboard there are two keys for \ in US
            ';': 'ñ',
            "'": "´"
        };
    }

    get name() : string {
        return 'es-ES (QWERTY)';
    }

    get(key : string) : string {
        return this.mappings[key] || key;
    }
}

class KeyMapperDeDeQwertz implements IKeyMapper {

    private mappings = {};

    constructor() {
        this.mappings = {
            '>': ':',
            '\\': '<',
            '<': ';',
            '^': '&'
        };
    }

    get name() : string {
        return 'de-DE (QWERTZ)';
    }

    get(key : string) : string {
        return this.mappings[key] || key;
    }
}


class KeyMapperDaDKQwerty implements IKeyMapper {

    private mappings = {};

    constructor() {
        this.mappings = {
            '>': ':',
            '\\': '<',
            '<': ';',
            ':': '^',
            '^': '&'
        };
    }

    get name() : string {
        return 'da-DK (QWERTY)';
    }

    get(key : string) : string {
        return this.mappings[key] || key;
    }
}

class KeyMapperSvSEQwerty implements IKeyMapper {

    private mappings = {};

    constructor() {
        this.mappings = {
            'oem_102': '<', // Only works when building from source atm, should work next vscode update
            'shift+oem_102': '>', // Only works when building from source atm, should work next vscode update
            '>': ':',
            '<': ';',
            ':': '^',
            '^': '&'
        };
    }

    get name() : string {
        return 'sv-SE (QWERTY)';
    }

    get(key : string) : string {
        return this.mappings[key] || key;
    }
}
