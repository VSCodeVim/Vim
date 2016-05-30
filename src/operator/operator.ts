"use strict";

import { Position } from './../motion/position';
import { ModeHandler } from './../mode/modeHandler.ts';
import { BaseAction } from './../actions/actions';
import { RegisterAction } from './../actions/actions';

@RegisterAction
export abstract class BaseOperator extends BaseAction {
    /**
     * Run this operator on a range.
     */
    abstract run(modeHandler: ModeHandler, start: Position, stop: Position): Promise<void>;
}