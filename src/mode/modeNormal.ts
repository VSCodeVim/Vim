"use strict";

import * as _ from 'lodash';

import { CommandKeyHandler } from './../configuration/commandKeyMap';
import { ModeName, Mode } from './mode';
import { Motion } from './../motion/motion';
import { ModeHandler } from './modeHandler';
import { BaseAction, Actions } from './../actions/actions';

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

    public async handleAction(action: BaseAction): Promise<void> {
        const result = await action.execAction(this._modeHandler, this.motion.position);

        this.motion.moveTo(result.line, result.character);
    }
}
