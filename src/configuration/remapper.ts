import * as vscode from 'vscode';
import { IKeyRemapping } from './iconfiguration';
import { Logger } from '../util/logger';
import { ModeHandler } from '../mode/modeHandler';
import { ModeName } from '../mode/mode';
import { VimState } from './../state/vimState';
import { commandLine } from '../cmd_line/commandLine';
import { configuration } from '../configuration/configuration';

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
    return this.remappers.some(r => r.isPotentialRemap);
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
  private readonly _logger = Logger.get('Remapper');

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

    if (!this._remappedModes.includes(vimState.currentMode)) {
      return false;
    }

    const userDefinedRemappings = configuration[this._configKey] as Map<string, IKeyRemapping>;

    this._logger.debug(
      `trying to find matching remap. keys=${keys}. mode=${
        ModeName[vimState.currentMode]
      }. keybindings=${this._configKey}.`
    );
    let remapping: IKeyRemapping | undefined = this.findMatchingRemap(
      userDefinedRemappings,
      keys,
      vimState.currentMode
    );

    if (remapping) {
      this._logger.debug(
        `${this._configKey}. match found. before=${remapping.before}. after=${remapping.after}. command=${remapping.commands}.`
      );

      if (!this._recursive) {
        vimState.isCurrentlyPerformingRemapping = true;
      }

      try {
        await this.handleRemapping(remapping, vimState, modeHandler);
      } finally {
        vimState.isCurrentlyPerformingRemapping = false;
      }

      return true;
    }

    // Check to see if a remapping could potentially be applied when more keys are received
    for (let remap of userDefinedRemappings.keys()) {
      if (keys.join('') === remap.slice(0, keys.length)) {
        this._isPotentialRemap = true;
        break;
      }
    }

    return false;
  }

  private async handleRemapping(
    remapping: IKeyRemapping,
    vimState: VimState,
    modeHandler: ModeHandler
  ) {
    const numCharsToRemove = remapping.before.length - 1;
    // Revert previously inserted characters
    // (e.g. jj remapped to esc, we have to revert the inserted "jj")
    if (vimState.currentMode === ModeName.Insert) {
      // Revert every single inserted character.
      // We subtract 1 because we haven't actually applied the last key.
      await vimState.historyTracker.undoAndRemoveChanges(
        Math.max(0, numCharsToRemove * vimState.cursors.length)
      );
      vimState.cursors = vimState.cursors.map(c => c.withNewStop(c.stop.getLeft(numCharsToRemove)));
    }
    // We need to remove the keys that were remapped into different keys from the state.
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
          // Check if this is a vim command by looking for :
          await commandLine.Run(commandString.slice(1, commandString.length), modeHandler.vimState);
          await modeHandler.updateView(modeHandler.vimState);
        } else if (commandArgs) {
          await vscode.commands.executeCommand(commandString, commandArgs);
        } else {
          await vscode.commands.executeCommand(commandString);
        }
      }
    }
  }

  protected findMatchingRemap(
    userDefinedRemappings: Map<string, IKeyRemapping>,
    inputtedKeys: string[],
    currentMode: ModeName
  ): IKeyRemapping | undefined {
    let remapping: IKeyRemapping | undefined;

    if (userDefinedRemappings.size === 0) {
      return remapping;
    }

    const range = Remapper.getRemappedKeysLengthRange(userDefinedRemappings);
    const startingSliceLength = Math.max(range[1], inputtedKeys.length);
    for (let sliceLength = startingSliceLength; sliceLength >= range[0]; sliceLength--) {
      const keySlice = inputtedKeys.slice(-sliceLength).join('');

      this._logger.verbose(`key=${inputtedKeys}. keySlice=${keySlice}.`);
      if (userDefinedRemappings.has(keySlice)) {
        // In Insert mode, we allow users to precede remapped commands
        // with extraneous keystrokes (eg. "hello world jj")
        // In other modes, we have to precisely match the keysequence
        // unless the preceding keys are numbers
        if (currentMode !== ModeName.Insert) {
          const precedingKeys = inputtedKeys
            .slice(0, inputtedKeys.length - keySlice.length)
            .join('');
          if (precedingKeys.length > 0 && !/^[0-9]+$/.test(precedingKeys)) {
            this._logger.verbose(
              `key sequences need to match precisely. precedingKeys=${precedingKeys}.`
            );
            break;
          }
        }

        remapping = userDefinedRemappings.get(keySlice);
        break;
      }
    }

    return remapping;
  }

  /**
   * Given list of remappings, returns the length of the shortest and longest remapped keys
   * @param remappings
   */
  protected static getRemappedKeysLengthRange(
    remappings: Map<string, IKeyRemapping>
  ): [number, number] {
    if (remappings.size === 0) {
      return [0, 0];
    }
    const keyLengths = Array.from(remappings.keys()).map(k => k.length);
    return [Math.min(...keyLengths), Math.max(...keyLengths)];
  }
}

class InsertModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'insertModeKeyBindings' + (recursive ? '' : 'NonRecursive') + 'Map',
      [ModeName.Insert, ModeName.Replace],
      recursive
    );
  }
}

class NormalModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'normalModeKeyBindings' + (recursive ? '' : 'NonRecursive') + 'Map',
      [ModeName.Normal],
      recursive
    );
  }
}

class VisualModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'visualModeKeyBindings' + (recursive ? '' : 'NonRecursive') + 'Map',
      [ModeName.Visual, ModeName.VisualLine, ModeName.VisualBlock],
      recursive
    );
  }
}
