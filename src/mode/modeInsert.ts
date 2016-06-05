"use strict";

import { ModeName, Mode } from './mode';
import { TextEditor } from './../textEditor';
import { Motion } from './../motion/motion';
import { ActionState } from './modeHandler';

export class InsertMode extends Mode {
     constructor(motion: Motion) {
        super(ModeName.Insert, motion);
    }

    async handleAction(action: ActionState): Promise<void> {
        // TODO: REALLY dumb, especially since there are actually actions
        // that work in insert mode.

        await TextEditor.insert(action.keysPressed[0]);
    }
}
