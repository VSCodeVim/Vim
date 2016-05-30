"use strict";

import { CommandKeyHandler } from './../configuration/commandKeyMap';
import { Motion } from './../motion/motion';
import { BaseMovement } from './../actions/actions';
import { ActionState } from './modeHandler';

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
    protected _keyHistory : string[];
    protected _keymap : CommandKeyHandler;

    constructor(name: ModeName, motion: Motion, keymap: CommandKeyHandler) {
        this._name = name;
        this._motion = motion;
        this._isActive = false;
        this._keyHistory = [];
        this._keymap = keymap;
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

    get keyHistory() : string[] {
        return this._keyHistory;
    }

    public handleDeactivation() : void {
        this._keyHistory = [];
    }

    abstract handleAction(action: ActionState): Promise<void>;

    abstract shouldBeActivated(key: string, currentMode: ModeName): boolean;

    abstract handleActivation(key: string): Promise<void>;
}