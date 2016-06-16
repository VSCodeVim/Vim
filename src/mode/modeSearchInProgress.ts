"use strict";

import { ModeName, Mode } from './mode';

export class SearchInProgressMode extends Mode {
    public text = "Search In Progress";

     constructor() {
        super(ModeName.SearchInProgressMode);
    }
}
