"use strict";

import * as _ from 'lodash';

import { CommandKeyHandler } from './../configuration/commandKeyMap';
import { ModeName, Mode } from './mode';
import { Motion } from './../motion/motion';
import { ModeHandler, ActionState } from './modeHandler';

export class NormalMode extends Mode {
    private _modeHandler: ModeHandler;

    constructor(motion: Motion, modeHandler: ModeHandler, keymap: CommandKeyHandler) {
        super(ModeName.Normal, motion, keymap);

        this._modeHandler = modeHandler;
    }

    shouldBeActivated(key: string, currentMode: ModeName) : boolean {
        return (key === '<esc>' || key === '<c-[>' || (key === "v" && currentMode === ModeName.Visual));
    }

    async handleActivation(key: string): Promise<void> { ; }

    //TODO: Remove! Never used.
    public async handleAction(action: ActionState): Promise<void> {
        this.motion.moveTo(action.motionStop.line, action.motionStop.character);
    }
}
