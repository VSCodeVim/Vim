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

export class Remapper implements IRemapper {
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

    const userDefinedRemappings = this._getRemappings();

    let remapping: IKeyRemapping | undefined = Remapper._findMatchingRemap(
      userDefinedRemappings,
      keys,
      vimState.currentMode
    );

    if (remapping) {
      logger.debug(
        `Remapper: ${this._configKey}. match found. before=${remapping.before}. after=${
          remapping.after
        }. command=${remapping.commands}.`
      );

      if (!this._recursive) {
        vimState.isCurrentlyPerformingRemapping = true;
      }

      const numCharsToRemove = remapping.before.length - 1;
      // Revert previously inserted characters
      // (e.g. jj remapped to esc, we have to revert the inserted "jj")
      if (vimState.currentMode === ModeName.Insert) {
        // Revert every single inserted character.
        // We subtract 1 because we haven't actually applied the last key.
        await vimState.historyTracker.undoAndRemoveChanges(
          Math.max(0, numCharsToRemove * vimState.allCursors.length)
        );
        vimState.cursorPosition = vimState.cursorPosition.getLeft(numCharsToRemove);
      }

      // We need to remove the keys that were remapped into different keys
      // from the state.
      vimState.recordedState.actionKeys = vimState.recordedState.actionKeys.slice(
        0,
        -numCharsToRemove
      );
      vimState.keyHistory = vimState.keyHistory.slice(0, -numCharsToRemove);

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
          let commandString: string;
          let commandArgs: string[];

          if (typeof command === 'string') {
            commandString = command;
            commandArgs = [];
          } else {
            commandString = command.command;
            commandArgs = command.args;
          }

          if (commandString.slice(0, 1) === ':') {
            await commandLine.Run(
              commandString.slice(1, commandString.length),
              modeHandler.vimState
            );
            await modeHandler.updateView(modeHandler.vimState);
          } else {
            if (commandArgs) {
              await vscode.commands.executeCommand(commandString, commandArgs);
            } else {
              await vscode.commands.executeCommand(commandString);
            }
          }
        }
      }

      vimState.isCurrentlyPerformingRemapping = false;
      return true;
    }

    // Check to see if a remapping could potentially be applied when more keys are received
    for (let remap of Object.keys(userDefinedRemappings)) {
      if (keys.join('') === remap.slice(0, keys.length)) {
        this._isPotentialRemap = true;
        break;
      }
    }

    return false;
  }

  private _getRemappings(): { [key: string]: IKeyRemapping } {
    let remappings: { [key: string]: IKeyRemapping } = {};
    for (let remapping of configuration[this._configKey] as IKeyRemapping[]) {
      let debugMsg = `before=${remapping.before}. `;

      if (remapping.after) {
        debugMsg += `after=${remapping.after}. `;
      }

      if (remapping.commands) {
        for (const command of remapping.commands) {
          if (typeof command === 'string') {
            debugMsg += `command=${command}. args=.`;
          } else {
            debugMsg += `command=${command.command}. args=${command.args}.`;
          }
        }
      }

      if (!remapping.after && !remapping.commands) {
        logger.error(
          `Remapper: ${
            this._configKey
          }. Invalid configuration. Missing 'after' key or 'command'. ${debugMsg}`
        );
        continue;
      }

      const keys = remapping.before.join('');
      if (keys in remappings) {
        logger.error(`Remapper: ${this._configKey}. Duplicate configuration. ${debugMsg}`);
        continue;
      }

      logger.debug(`Remapper: ${this._configKey}. ${debugMsg}`);
      remappings[keys] = remapping;
    }

    return remappings;
  }

  protected static _findMatchingRemap(
    userDefinedRemappings: { [key: string]: IKeyRemapping },
    inputtedKeys: string[],
    currentMode: ModeName
  ) {
    let remapping: IKeyRemapping | undefined;

    let range = Remapper._getRemappedKeysLengthRange(userDefinedRemappings);
    const startingSliceLength = Math.max(range[1], inputtedKeys.length);
    for (let sliceLength = startingSliceLength; sliceLength >= range[0]; sliceLength--) {
      const keySlice = inputtedKeys.slice(-sliceLength).join('');

      if (keySlice in userDefinedRemappings) {
        // In Insert mode, we allow users to precede remapped commands
        // with extraneous keystrokes (eg. "hello world jj")
        // In other modes, we have to precisely match the keysequence
        // unless the preceding keys are numbers
        if (currentMode !== ModeName.Insert) {
          const precedingKeys = inputtedKeys
            .slice(0, inputtedKeys.length - keySlice.length)
            .join('');
          if (precedingKeys.length > 0 && !/^[0-9]+$/.test(precedingKeys)) {
            break;
          }
        }

        remapping = userDefinedRemappings[keySlice];
        break;
      }
    }

    return remapping;
  }

  /**
   * Given list of remappings, returns the length of the shortest and longest remapped keys
   * @param remappings
   */
  protected static _getRemappedKeysLengthRange(remappings: {
    [key: string]: IKeyRemapping;
  }): [number, number] {
    const keys = Object.keys(remappings);
    if (keys.length === 0) {
      return [0, 0];
    }
    return [_.minBy(keys, m => m.length)!.length, _.maxBy(keys, m => m.length)!.length];
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
