import * as vscode from "vscode";

export class KeyboardLayout {
    private mapper : KeyMapper;

    constructor(mapper? : KeyMapper) {
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
            default:
                return new KeyboardLayout();
        }
    }
}

export interface KeyMapper {
    name : string;
    get(key : string) : string;
}

class KeyMapperEsEsQwerty implements KeyMapper {

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

class KeyMapperDeDeQwertz implements KeyMapper {

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
