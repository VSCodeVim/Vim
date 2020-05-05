import * as vscode from 'vscode';
import { IKeyRemapping } from './iconfiguration';
import { Logger } from '../util/logger';
import { ModeHandler } from '../mode/modeHandler';
import { Mode } from '../mode/mode';
import { VimState } from './../state/vimState';
import { commandLine } from '../cmd_line/commandLine';
import { configuration } from '../configuration/configuration';
import { StatusBar } from '../statusBar';

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
      new CommandLineModeRemapper(true),
      new InsertModeRemapper(false),
      new NormalModeRemapper(false),
      new VisualModeRemapper(false),
      new CommandLineModeRemapper(false),
    ];
  }

  get isPotentialRemap(): boolean {
    return this.remappers.some((r) => r.isPotentialRemap);
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
  private readonly _remappedModes: Mode[];
  private readonly _recursive: boolean;
  private readonly _logger = Logger.get('Remapper');

  private _isPotentialRemap = false;
  private _allowPotentialRemapOnFirstKey = true;
  private _hasAmbiguousRemap = false;
  private _hasPotentialRemap = false;
  get isPotentialRemap(): boolean {
    return this._isPotentialRemap;
  }

  constructor(configKey: string, remappedModes: Mode[], recursive: boolean) {
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
    let allowBufferingKeys = true;
    let remainingKeys: string[] = [];

    if (!this._remappedModes.includes(vimState.currentMode)) {
      return false;
    }

    const userDefinedRemappings = configuration[this._configKey] as Map<string, IKeyRemapping>;

    if (keys[keys.length - 1] === '<BufferedKeys>') {
      // Timeout finished. Don't let an ambiguous remap start another timeout again
      keys = keys.slice(0, keys.length - 1);
      allowBufferingKeys = false;
    }

    if (keys.length === 0) {
      return true;
    }

    this._logger.debug(
      `trying to find matching remap. keys=${keys}. mode=${
        Mode[vimState.currentMode]
      }. keybindings=${this._configKey}.`
    );

    let remapping: IKeyRemapping | undefined = this.findMatchingRemap(
      userDefinedRemappings,
      keys,
      vimState.currentMode
    );

    let isPotentialRemap = false;
    // Check to see if a remapping could potentially be applied when more keys are received
    const keysAsString = vimState.recordedState.commandWithoutCountPrefix.replace(
      '<BufferedKeys>',
      ''
    );
    if (keysAsString !== '') {
      for (let remap of userDefinedRemappings.keys()) {
        if (remap.startsWith(keysAsString) && remap !== keysAsString) {
          isPotentialRemap = true;
          break;
        }
      }
    }

    this._isPotentialRemap =
      isPotentialRemap && allowBufferingKeys && this._allowPotentialRemapOnFirstKey;

    if (
      !remapping &&
      (this._hasAmbiguousRemap || this._hasPotentialRemap) &&
      (!isPotentialRemap || !allowBufferingKeys) &&
      keys.length > 1
    ) {
      if (this._hasAmbiguousRemap) {
        // Check what was the previous ambiguous remap
        const range = Remapper.getRemappedKeysLengthRange(userDefinedRemappings);
        for (let sliceLength = keys.length - 1; sliceLength >= range[0]; sliceLength--) {
          const keysSlice = keys.slice(0, sliceLength);
          let possibleBrokenRemap: IKeyRemapping | undefined = this.findMatchingRemap(
            userDefinedRemappings,
            keysSlice,
            vimState.currentMode
          );
          if (possibleBrokenRemap) {
            remapping = possibleBrokenRemap;
            isPotentialRemap = false;
            this._isPotentialRemap = false;
            remainingKeys = keys.slice(remapping.before.length);
            break;
          }
        }
        this._hasAmbiguousRemap = false;
      }
      if (!remapping) {
        // if there is still no remapping, handle all the keys without allowing
        // a potential remap on the first key so that we don't repeat everything
        // again, but still allow for other ambiguous remaps after the first key.
        //
        // Example: if 'iiii' is mapped in normal and 'ii' is mapped in insert mode,
        // and the user presses 'iiia' in normal mode or presses 'iii' and waits
        // for the timeout to finish, we want the first 'i' to be handled without
        // allowing potential remaps, which means it will go into insert mode,
        // but then the next 'ii' should be remapped in insert mode and after the
        // remap the 'a' should be handled.
        if (!allowBufferingKeys) {
          // Timeout finished and there is no remapping, so handle the buffered
          // keys but resend the '<BufferedKeys>' key as well so we don't wait
          // for the timeout again but can still handle potential remaps.
          //
          // Example 1: if 'ccc' is mapped in normal mode and user presses 'cc' and
          // waits for the timeout to finish, this will resend the 'cc<BufferedKeys>'
          // keys without allowing a potential remap on first key, which makes the
          // first 'c' be handled as a 'ChangeOperator' and the second 'c' which has
          // potential remaps (the 'ccc' remap) is buffered and the timeout started
          // but then the '<BufferedKeys>' key comes straight away that clears the
          // timeout without waiting again, and makes the second 'c' be handled normally
          // as another 'ChangeOperator'.
          //
          // Example 2: if 'iiii' is mapped in normal and 'ii' is mapped in insert
          // mode, and the user presses 'iii' in normal mode and waits for the timeout
          // to finish, this will resend the 'iii<BufferedKeys>' keys without allowing
          // a potential remap on first key, which makes the first 'i' be handled as
          // an 'CommandInsertAtCursor' and goes to insert mode, next the second 'i'
          // is buffered, then the third 'i' finds the insert mode remapping of 'ii'
          // and handles that remap, after the remapping being handled the '<BufferedKeys>'
          // key comes that clears the timeout and since the commandList will be empty
          // we return true as we finished handling this sequence of keys.

          keys = vimState.recordedState.commandList; // includes the '<BufferedKeys>' key

          this._logger.debug(
            `${this._configKey}. timeout finished, handling timed out buffer keys without allowing a new timeout.`
          );
        }
        this._logger.debug(
          `${this._configKey}. potential remap broken. resending keys without allowing a potential remap on first key. keys=${keys}`
        );
        this._hasPotentialRemap = false;
        this._allowPotentialRemapOnFirstKey = false;
        vimState.recordedState.resetCommandList();
        await modeHandler.handleMultipleKeyEvents(keys);
        return true;
      }
    }

    if (isPotentialRemap && allowBufferingKeys && this._allowPotentialRemapOnFirstKey) {
      if (remapping) {
        // There are other potential remaps (ambiguous remaps), wait for other
        // key or for the timeout to finish.
        this._hasAmbiguousRemap = true;

        this._logger.debug(
          `${this._configKey}. ambiguous match found. before=${remapping.before}. after=${remapping.after}. command=${remapping.commands}. waiting for other key or timeout to finish.`
        );
      } else {
        this._hasPotentialRemap = true;
        this._logger.debug(
          `${this._configKey}. potential remap found. waiting for other key or timeout to finish.`
        );
      }
      vimState.recordedState.bufferedKeys = keys.slice(0);
      vimState.recordedState.bufferedKeysTimeoutObj = setTimeout(() => {
        modeHandler.handleKeyEvent('<BufferedKeys>');
      }, configuration.timeout);
      return true;
    } else if (!this._allowPotentialRemapOnFirstKey) {
      // First key was already prevented from buffering to wait for other remaps
      // so we can allow for ambiguous remaps again.
      this._allowPotentialRemapOnFirstKey = true;
    }

    if (remapping) {
      this._logger.debug(
        `${this._configKey}. match found. before=${remapping.before}. after=${remapping.after}. command=${remapping.commands}. remainingKeys=${remainingKeys}`
      );

      this._hasAmbiguousRemap = false;
      this._hasPotentialRemap = false;

      if (!this._recursive) {
        vimState.isCurrentlyPerformingRemapping = true;
      }

      try {
        await this.handleRemapping(remapping, vimState, modeHandler);
      } finally {
        vimState.isCurrentlyPerformingRemapping = false;
        if (remainingKeys.length > 0) {
          vimState.recordedState.commandList = vimState.recordedState.commandList.slice(
            0,
            -remainingKeys.length
          );
          await modeHandler.handleMultipleKeyEvents(remainingKeys);
          return true;
        }
      }

      return true;
    }

    this._hasPotentialRemap = false;
    return false;
  }

  private async handleRemapping(
    remapping: IKeyRemapping,
    vimState: VimState,
    modeHandler: ModeHandler
  ) {
    vimState.recordedState.resetCommandList();
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

        StatusBar.setText(vimState, `${commandString} ${commandArgs}`);
      }
    }
  }

  protected findMatchingRemap(
    userDefinedRemappings: Map<string, IKeyRemapping>,
    inputtedKeys: string[],
    currentMode: Mode
  ): IKeyRemapping | undefined {
    if (userDefinedRemappings.size === 0) {
      return undefined;
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
        if (currentMode !== Mode.Insert) {
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

        return userDefinedRemappings.get(keySlice);
      }
    }

    return undefined;
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
    const keyLengths = Array.from(remappings.keys()).map((k) => k.length);
    return [Math.min(...keyLengths), Math.max(...keyLengths)];
  }
}

class InsertModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'insertModeKeyBindings' + (recursive ? '' : 'NonRecursive') + 'Map',
      [Mode.Insert, Mode.Replace],
      recursive
    );
  }
}

class NormalModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'normalModeKeyBindings' + (recursive ? '' : 'NonRecursive') + 'Map',
      [Mode.Normal],
      recursive
    );
  }
}

class VisualModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'visualModeKeyBindings' + (recursive ? '' : 'NonRecursive') + 'Map',
      [Mode.Visual, Mode.VisualLine, Mode.VisualBlock],
      recursive
    );
  }
}

class CommandLineModeRemapper extends Remapper {
  constructor(recursive: boolean) {
    super(
      'commandLineModeKeyBindings' + (recursive ? '' : 'NonRecursive') + 'Map',
      [Mode.CommandlineInProgress, Mode.SearchInProgressMode],
      recursive
    );
  }
}
