"use strict";

import * as vscode from "vscode";

export class KeyboardLayout {
    private _mapper: IKeyMapper | undefined;
    private _defaultKeyboardLayout = 'en-US (QWERTY)';

    constructor(mapper?: IKeyMapper) {
        this._mapper = mapper;
    }

    get name(): string {
        return this._mapper ? this._mapper.name : this._defaultKeyboardLayout;
    }

    translate (key : string) : string {
        return this._mapper ? this._mapper.get(key) : key;
    }

    static fromUserConfiguration() : KeyboardLayout {
        const supportedKeyMappers : IKeyMapper[] = [
            new KeyMapperEsEsQwerty(),
            new KeyMapperDeDeQwertz(),
            new KeyMapperDaDKQwerty(),
            new KeyMapperSvSEQwerty(),
        ];
        let requestedKeyboardLayout = vscode.workspace.getConfiguration('vim').get("keyboardLayout", "");
        let keyboardLayout = supportedKeyMappers.find(layout => layout.name.toLowerCase() === requestedKeyboardLayout.toLowerCase());

        if (keyboardLayout) {
            return new KeyboardLayout(keyboardLayout);
        } else {
            return new KeyboardLayout();
        }
    }
}

export interface IKeyMapper {
    name : string;
    get(key : string) : string;
}

class KeyMapperEsEsQwerty implements IKeyMapper {
    private _name = 'es-ES (QWERTY)';
    private _mappings: { [key: string]: string } = {
        '>': ':',
        '<': ';',
        '`': '<',
        '~': '>',
        ';': 'ñ',
        ':': 'Ñ',
        "'": "´",
        '\\': 'ç',
        '}': '*'
    };

    get name() : string {
        return this._name;
    }

    get(key : string) : string {
        return this._mappings[key] || key;
    }
}

class KeyMapperDeDeQwertz implements IKeyMapper {
    private _name = 'de-DE (QWERTZ)';
    private _mappings: {[key: string]: string } = {
        '>': ':',
        '\\': '<',
        '<': ';',
        '^': '&'
    };

    get name() : string {
        return this._name;
    }

    get(key : string) : string {
        return this._mappings[key] || key;
    }
}


class KeyMapperDaDKQwerty implements IKeyMapper {
    private _name = 'da-DK (QWERTY)';
    private _mappings: { [key: string]: string } = {
        '>': ':',
        '\\': '<',
        '<': ';',
        ':': '^',
        '^': '&'
    };

    get name() : string {
        return this._name;
    }

    get(key : string) : string {
        return this._mappings[key] || key;
    }
}

class KeyMapperSvSEQwerty implements IKeyMapper {
    private _name = "sv-SE (QWERTY)";
    private _mappings: { [key: string]: string } = {
        'oem_102': '<',
        'shift+oem_102': '>',
        '>': ':',
        '<': ';',
        ':': '^',
        '^': '&'
    };

    get name() : string {
        return this._name;
    }

    get(key : string) : string {
        return this._mappings[key] || key;
    }
}
