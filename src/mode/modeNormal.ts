"use strict";

import { ModeName, Mode } from './mode';
import { ModeHandler } from './modeHandler';

export class NormalMode extends Mode {
    private _modeHandler: ModeHandler;

    constructor(modeHandler: ModeHandler) {
        super(ModeName.Normal);

        this._modeHandler = modeHandler;
    }
}
