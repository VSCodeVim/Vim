"use strict";

export enum ModeName {
    Normal,
    Insert,
    Visual,
    VisualLine,
    SearchInProgressMode,
}

export enum VSCodeVimCursorType {
    Native,
    TextDecoration
}

export abstract class Mode {
    private _isActive: boolean;
    private _name: ModeName;

    public text: string;
    public cursorType: VSCodeVimCursorType;

    constructor(name: ModeName) {
        this._name = name;
        this._isActive = false;
    }

    get name(): ModeName {
        return this._name;
    }

    get isActive() : boolean {
        return this._isActive;
    }

    set isActive(val : boolean) {
        this._isActive = val;
    }
}