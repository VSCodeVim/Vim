"use strict";

import { Motion } from './../motion/motion';

export enum ModeName {
    Normal,
    Insert,
    Visual,
    VisualLine,
}

export abstract class Mode {
    private _isActive : boolean;
    private _name : ModeName;
    private _motion : Motion;

    constructor(name: ModeName, motion: Motion) {
        this._name = name;
        this._motion = motion;
        this._isActive = false;
    }

    get name(): ModeName {
        return this._name;
    }

    get motion() : Motion {
        return this._motion;
    }

    set motion(val : Motion) {
        this._motion = val;
    }

    get isActive() : boolean {
        return this._isActive;
    }

    set isActive(val : boolean) {
        this._isActive = val;
    }
}