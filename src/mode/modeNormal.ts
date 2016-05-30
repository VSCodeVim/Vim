"use strict";

import * as _ from 'lodash';

import { CommandKeyHandler } from './../configuration/commandKeyMap';
import { ModeName, Mode } from './mode';
import { Motion } from './../motion/motion';
import { ModeHandler, ActionState } from './modeHandler';

export class NormalMode extends Mode {
    private _modeHandler: ModeHandler;

    constructor(motion: Motion, modeHandler: ModeHandler) {
        super(ModeName.Normal, motion);

        this._modeHandler = modeHandler;
    }
}
