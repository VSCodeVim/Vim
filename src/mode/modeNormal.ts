"use strict";

import { ModeName, Mode } from './mode';
import { Motion } from './../motion/motion';
import { ModeHandler } from './modeHandler';

export class NormalMode extends Mode {
    private _modeHandler: ModeHandler;

    constructor(motion: Motion, modeHandler: ModeHandler) {
        super(ModeName.Normal, motion);

        this._modeHandler = modeHandler;
    }
}
