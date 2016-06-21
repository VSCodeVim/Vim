"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';

export class VisualMode extends Mode {
    public text = "Visual Mode";
    public cursorType = VSCodeVimCursorType.TextDecoration;

    constructor() {
        super(ModeName.Visual);
    }
}
