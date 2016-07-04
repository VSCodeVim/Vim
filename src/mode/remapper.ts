import * as vscode from 'vscode';
import * as _ from 'lodash';

import { ModeName } from './mode';
import { ModeHandler, VimState } from './modeHandler';

interface IKeybinding {
    before: string[];
    after : string[];
}

class Remapper {
    private _mostRecentKeys: string[] = [];

    private _remappings: IKeybinding[] = [];

    private _isInsertModeRemapping = false;

    constructor(configKey: string, insertModeRemapping = false) {
        this._isInsertModeRemapping = insertModeRemapping;
        this._remappings = vscode.workspace.getConfiguration('vim')
            .get<IKeybinding[]>(configKey, []);
    }

    private _longestKeySequence(): number {
        if (this._remappings.length > 0) {
            return _.maxBy(this._remappings, map => map.before.length).before.length;
        } else {
            return 1;
        }
    }

    public async sendKey(key: string, modeHandler: ModeHandler, vimState: VimState): Promise<boolean> {
        if ((vimState.currentMode === ModeName.Insert && !this._isInsertModeRemapping) ||
            (vimState.currentMode !== ModeName.Insert && this._isInsertModeRemapping)) {

            this._reset();

            return false;
        }

        const longestKeySequence = this._longestKeySequence();

        this._mostRecentKeys.push(key);
        this._mostRecentKeys = this._mostRecentKeys.slice(-longestKeySequence);

        for (let sliceLength = 1; sliceLength <= longestKeySequence; sliceLength++) {
            const slice = this._mostRecentKeys.slice(-sliceLength);
            const remapping = _.find(this._remappings, map => map.before.join("") === slice.join(""));

            if (remapping) {
                if (this._isInsertModeRemapping) {
                    vimState.historyTracker.undoAndRemoveChanges(this._mostRecentKeys.length);
                }

                await modeHandler.handleMultipleKeyEvents(remapping.after);

                this._mostRecentKeys = [];

                return true;
            }
        }

        return false;
    }

    private _reset(): void {
        this._mostRecentKeys = [];
    }
}

export class InsertModeRemapper extends Remapper {
    constructor() {
        super("insertModeKeyBindings", true);
    }
}

export class OtherModesRemapper extends Remapper {
    constructor() {
        super("normalModeKeyBindings", false);
    }
}