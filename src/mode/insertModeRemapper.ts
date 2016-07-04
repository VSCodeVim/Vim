import * as vscode from 'vscode';
import * as _ from 'lodash';

import { ModeHandler } from './modeHandler';
import { HistoryTracker } from './../history/historyTracker';

interface IKeybinding {
    before: string[];
    after : string[];
}

export class InsertModeRemapper {
    private _mostRecentKeys: string[] = [];

    private _remappings: IKeybinding[] = [{
        before: ["j", "j"],
        after : ["<esc>"]
    }];

    constructor() {
        this._remappings = vscode.workspace.getConfiguration('vim')
            .get<IKeybinding[]>("insertModeKeyBindings", []);
    }

    private _longestKeySequence(): number {
        const keys = Object.keys(this._remappings);

        if (keys.length > 0) {
            return _.maxBy(this._remappings, map => map.before.length).before.length;
        } else {
            return 1;
        }
    }

    public async sendKey(key: string, modeHandler: ModeHandler, historyTracker: HistoryTracker): Promise<boolean> {
        this._mostRecentKeys.push(key);
        this._mostRecentKeys = this._mostRecentKeys.slice(-this._longestKeySequence());

        const remapping = _.find(this._remappings, map => map.before.join("") === this._mostRecentKeys.join(""));

        if (remapping) {
            historyTracker.undoAndRemoveChanges(this._mostRecentKeys.length);
            await modeHandler.handleMultipleKeyEvents(remapping.after);

            this._mostRecentKeys = [];
        }

        return !!remapping;
    }

    public reset(): void {
        this._mostRecentKeys = [];
    }
}