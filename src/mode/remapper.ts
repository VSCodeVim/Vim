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

  private _remappedModes: ModeName[];

  constructor(configKey: string, remappedModes: ModeName[]) {
    this._remappedModes = remappedModes;
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
    if (this._remappedModes.indexOf(vimState.currentMode) === -1) {
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
        // if we remapped e.g. jj to esc, we have to revert the inserted "jj"

        if (this._remappedModes.indexOf(ModeName.Insert) >= 0) {
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
    super(
      "insertModeKeyBindings",
      [ModeName.Insert]
    );
  }
}

export class OtherModesRemapper extends Remapper {
  constructor() {
    super(
      "otherModesKeyBindings",
      [ModeName.Normal, ModeName.Visual, ModeName.VisualLine]
    );
  }
}