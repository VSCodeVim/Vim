"use strict";

import { ModeName, Mode } from './mode';
import { VSCodeVimCursorType } from './mode';

export class SearchInProgressMode extends Mode {
    public text = "Search In Progress";
    public cursorType = VSCodeVimCursorType.Native;

     constructor() {
        super(ModeName.SearchInProgressMode);
    }
}
