"use strict";

export enum ModeName {
    Normal,
    Insert,
    Visual,
    VisualLine,
    SearchInProgressMode,
}

export abstract class Mode {
    private _isActive : boolean;
    private _name : ModeName;

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