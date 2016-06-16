"use strict";

import { ModeName, Mode } from './mode';
import { ModeHandler } from './modeHandler';

export class NormalMode extends Mode {
    private _modeHandler: ModeHandler;

    public text = "Normal Mode";

    constructor(modeHandler: ModeHandler) {
        super(ModeName.Normal);

        this._modeHandler = modeHandler;
    }
}
