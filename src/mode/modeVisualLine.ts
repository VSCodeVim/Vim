"use strict";

import { ModeName, Mode } from './mode';

export class VisualLineMode extends Mode {
    public text = "Visual Line Mode";

    constructor() {
        super(ModeName.VisualLine);
    }
}
