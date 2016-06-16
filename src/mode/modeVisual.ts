"use strict";

import { ModeName, Mode } from './mode';

export class VisualMode extends Mode {
    public text = "Visual Mode";

    constructor() {
        super(ModeName.Visual);
    }
}
