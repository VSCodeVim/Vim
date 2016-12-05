import * as vscode from 'vscode';
import * as _ from 'lodash';
import { ModeName } from './mode';
import { ModeHandler, VimState } from './modeHandler';
import { AngleBracketNotation } from './../notation';

interface IKeybinding {
  before   : string[];
  after?   : string[];
  commands?: { command: string; args: any[] }[];
}

class Remapper {
  private _mostRecentKeys: string[] = [];
  private _remappings: IKeybinding[] = [];
  private _remappedModes: ModeName[];
  private _recursive: boolean;

  constructor(configKey: string, remappedModes: ModeName[], recursive: boolean) {
    this._recursive = recursive;
    this._remappedModes = remappedModes;

    let remappings = vscode.workspace.getConfiguration('vim')
      .get<IKeybinding[]>(configKey, []);

    for (let remapping of remappings) {
      let before: string[] = [];
      remapping.before.forEach(item => before.push(AngleBracketNotation.Normalize(item)));

      let after: string[] = [];
      if (remapping.after) {
        remapping.after.forEach(item => after.push(AngleBracketNotation.Normalize(item)));
      }

      this._remappings.push(<IKeybinding> {
        before: before,
        after: after,
        commands: remapping.commands,
      });
    }
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
        // If we remapped e.g. jj to esc, we have to revert the inserted "jj"

        if (this._remappedModes.indexOf(ModeName.Insert) >= 0) {
          // Revert every single inserted character. This is actually a bit of
          // a hack since we aren't guaranteed that each insertion inserted
          // only a single character.

          // We subtract 1 because we haven't actually applied the last key.

          // TODO(johnfn) - study - actions need to be paired up with text
          // changes... this is a complicated problem.

          // Update most recent keys to be the correct length based on the
          // remap length
          if (remapping.before.length < longestKeySequence) {
            this._mostRecentKeys = this._mostRecentKeys.slice(longestKeySequence - remapping.before.length);
          }

          await vimState.historyTracker.undoAndRemoveChanges(
            Math.max(0, (this._mostRecentKeys.length - 1) * vimState.allCursors.length));
        }

        if (!this._recursive) {
          vimState.isCurrentlyPerformingRemapping = true;
        }

        // We need to remove the keys that were remapped into different keys
        // from the state.
        const numToRemove = remapping.before.length - 1;
        vimState.recordedState.actionKeys = vimState.recordedState.actionKeys.slice(0, -numToRemove);

        if (remapping.after) {
          await modeHandler.handleMultipleKeyEvents(remapping.after);
        }

        if (remapping.commands) {
          for (const command of remapping.commands) {
            await vscode.commands.executeCommand(command.command, command.args);
          }
        }

        vimState.isCurrentlyPerformingRemapping = false;

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
  constructor(recursive: boolean) {
    super(
      "insertModeKeyBindings" + (recursive ? "" : "NonRecursive"),
      [ModeName.Insert],
      recursive
    );
  }
}

export class OtherModesRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      "otherModesKeyBindings" + (recursive ? "" : "NonRecursive"),
      [ModeName.Normal, ModeName.Visual, ModeName.VisualLine],
      recursive
    );
  }
}

