import * as _ from 'lodash';
import * as vscode from 'vscode';

import { commandLine } from '../cmd_line/commandLine';
import { configuration } from '../configuration/configuration';
import { ModeName } from '../mode/mode';
import { ModeHandler } from '../mode/modeHandler';
import { VimState } from './../state/vimState';
import { IKeyRemapping } from './iconfiguration';
import { logger } from '../util/logger';

interface IRemapper {
  /**
   * Send keys to remapper
   */
  sendKey(keys: string[], modeHandler: ModeHandler, vimState: VimState): Promise<boolean>;

  /**
   * Given keys pressed thus far, denotes if it is a potential remap
   */
  readonly isPotentialRemap: boolean;
}

export class Remappers implements IRemapper {
  private remappers: IRemapper[];

  constructor() {
    this.remappers = [
      new InsertModeRemapper(true),
      new NormalModeRemapper(true),
      new VisualModeRemapper(true),
      new InsertModeRemapper(false),
      new NormalModeRemapper(false),
      new VisualModeRemapper(false),
    ];
  }

  get isPotentialRemap(): boolean {
    return _.some(this.remappers, r => r.isPotentialRemap);
  }

  public async sendKey(
    keys: string[],
    modeHandler: ModeHandler,
    vimState: VimState
  ): Promise<boolean> {
    let handled = false;
    for (let remapper of this.remappers) {
      handled = handled || (await remapper.sendKey(keys, modeHandler, vimState));
    }
    return handled;
  }
}

class Remapper implements IRemapper {
  private readonly _configKey: string;
  private readonly _remappedModes: ModeName[];
  private readonly _recursive: boolean;

  private _isPotentialRemap = false;
  get isPotentialRemap(): boolean {
    return this._isPotentialRemap;
  }

  constructor(configKey: string, remappedModes: ModeName[], recursive: boolean) {
    this._configKey = configKey;
    this._recursive = recursive;
    this._remappedModes = remappedModes;
  }

  public async sendKey(
    keys: string[],
    modeHandler: ModeHandler,
    vimState: VimState
  ): Promise<boolean> {
    this._isPotentialRemap = false;

    if (this._remappedModes.indexOf(vimState.currentMode) === -1) {
      return false;
    }

    const userDefinedRemappings = configuration[this._configKey] as IKeyRemapping[];
    for (let userDefinedRemapping of userDefinedRemappings) {
      logger.debug(
        `Remapper: ${this._configKey}. loaded remappings. before=${
          userDefinedRemapping.before
        }. after=${userDefinedRemapping.after}. commands=${userDefinedRemapping.commands}.`
      );
    }

    // Check to see if the keystrokes match any user-specified remapping.
    let remapping: IKeyRemapping | undefined;
    if (vimState.currentMode === ModeName.Insert) {
      // In insert mode, we allow users to precede remapped commands
      // with extraneous keystrokes (e.g. "hello world jj")
      const longestKeySequence = Remapper._getLongestedRemappedKeySequence(userDefinedRemappings);
      for (let sliceLength = 1; sliceLength <= longestKeySequence; sliceLength++) {
        const slice = keys.slice(-sliceLength);
        const result = _.find(userDefinedRemappings, map => map.before.join('') === slice.join(''));

        if (result) {
          remapping = result;
          break;
        }
      }
    } else {
      // In other modes, we have to precisely match the entire keysequence
      remapping = _.find(userDefinedRemappings, map => {
        return map.before.join('') === keys.join('');
      });
    }

    if (remapping) {
      logger.debug(
        `Remapper: ${this._configKey}. match found. before=${remapping.before}. after=${
          remapping.after
        }. command=${remapping.commands}.`
      );

      if (!this._recursive) {
        vimState.isCurrentlyPerformingRemapping = true;
      }

      // Record length of remapped command
      vimState.recordedState.numberOfRemappedKeys += remapping.before.length;

      const numToRemove = remapping.before.length - 1;
      // Revert previously inserted characters
      // (e.g. jj remapped to esc, we have to revert the inserted "jj")
      if (vimState.currentMode === ModeName.Insert) {
        // Revert every single inserted character.
        // We subtract 1 because we haven't actually applied the last key.
        await vimState.historyTracker.undoAndRemoveChanges(
          Math.max(0, numToRemove * vimState.allCursors.length)
        );
        vimState.cursorPosition = vimState.cursorPosition.getLeft(numToRemove);
      }

      // We need to remove the keys that were remapped into different keys
      // from the state.
      vimState.recordedState.actionKeys = vimState.recordedState.actionKeys.slice(0, -numToRemove);
      vimState.keyHistory = vimState.keyHistory.slice(0, -numToRemove);

      if (remapping.after) {
        const count = vimState.recordedState.count || 1;
        vimState.recordedState.count = 0;

        for (let i = 0; i < count; i++) {
          await modeHandler.handleMultipleKeyEvents(remapping.after);
        }
      }

      if (remapping.commands) {
        for (const command of remapping.commands) {
          // Check if this is a vim command by looking for :
          if (command.command.slice(0, 1) === ':') {
            await commandLine.Run(
              command.command.slice(1, command.command.length),
              modeHandler.vimState
            );
            await modeHandler.updateView(modeHandler.vimState);
          } else {
            if (command.args) {
              await vscode.commands.executeCommand(command.command, command.args);
            } else {
              await vscode.commands.executeCommand(command.command);
            }
          }
        }
      }

      vimState.isCurrentlyPerformingRemapping = false;
      return true;
    }

    // Check to see if a remapping could potentially be applied when more keys are received
    for (let remap of userDefinedRemappings) {
      if (keys.join('') === remap.before.slice(0, keys.length).join('')) {
        this._isPotentialRemap = true;
        break;
      }
    }

    return false;
  }

  private static _getLongestedRemappedKeySequence(remappings: IKeyRemapping[]): number {
    if (remappings.length === 0) {
      return 1;
    }
    return _.maxBy(remappings, map => map.before.length)!.before.length;
  }
}

class InsertModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'insertModeKeyBindings' + (recursive ? '' : 'NonRecursive'),
      [ModeName.Insert, ModeName.Replace],
      recursive
    );
  }
}

class NormalModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'normalModeKeyBindings' + (recursive ? '' : 'NonRecursive'),
      [ModeName.Normal],
      recursive
    );
  }
}

class VisualModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'visualModeKeyBindings' + (recursive ? '' : 'NonRecursive'),
      [ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock],
      recursive
    );
  }
}
