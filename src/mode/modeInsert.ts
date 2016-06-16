"use strict";

import { ModeName, Mode } from './mode';

export class InsertMode extends Mode {
    public text = "Insert Mode";

     constructor() {
        super(ModeName.Insert);
    }
}
