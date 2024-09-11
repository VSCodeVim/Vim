import * as vscode from 'vscode';
import { configuration } from '../configuration/configuration';
import { ErrorCode, ForceStopRemappingError, VimError } from '../error';
import { Mode } from '../mode/mode';
import { ModeHandler } from '../mode/modeHandler';
import { StatusBar } from '../statusBar';
import { Logger } from '../util/logger';
import { SpecialKeys } from '../util/specialKeys';
import { exCommandParser } from '../vimscript/exCommandParser';
import { IKeyRemapping } from './iconfiguration';

interface IRemapper {
  /**
   * Send keys to remapper
   */
  sendKey(keys: string[], modeHandler: ModeHandler): Promise<boolean>;

  /**
   * Given keys pressed thus far, denotes if it is a potential remap
   */
  readonly isPotentialRemap: boolean;
}

export class Remappers implements IRemapper {
  private readonly remappers = [
    new InsertModeRemapper(),
    new NormalModeRemapper(),
    new VisualModeRemapper(),
    new CommandLineModeRemapper(),
    new OperatorPendingModeRemapper(),
  ];

  get isPotentialRemap(): boolean {
    return this.remappers.some((r) => r.isPotentialRemap);
  }

  public async sendKey(keys: string[], modeHandler: ModeHandler): Promise<boolean> {
    for (const remapper of this.remappers) {
      if (await remapper.sendKey(keys, modeHandler)) {
        return true;
      }
    }
    return false;
  }
}

export class Remapper implements IRemapper {
  private readonly configKey: string;
  private readonly remappedModes: Mode[];

  /**
   * Checks if the current commandList is a potential remap.
   */
  private _isPotentialRemap = false;

  /**
   * If the commandList has a remap but there is still another potential remap we
   * call it an Ambiguous Remap and we store it here. If later we need to handle it
   * we don't need to go looking for it.
   */
  private hasAmbiguousRemap: IKeyRemapping | undefined;

  /**
   * If the commandList is a potential remap but has no ambiguous remap
   * yet, we say that it has a Potential Remap.
   *
   * This is to distinguish the commands with ambiguous remaps and the
   * ones without.
   *
   * Example 1: if 'aaaa' is mapped and so is 'aa', when the user has pressed
   * 'aaa' we say it has an Ambiguous Remap which is 'aa', because if the
   * user presses other key than 'a' next or waits for the timeout to finish
   * we need to now that there was a remap to run so we first run the 'aa'
   * remap and then handle the remaining keys.
   *
   * Example 2: if only 'aaaa' is mapped, when the user has pressed 'aaa'
   * we say it has a Potential Remap, because if the user presses other key
   * than 'a' next or waits for the timeout to finish we need to now that
   * there was a potential remap that never came or was broken, so we can
   * resend the keys again without allowing for a potential remap on the first
   * key, which means we won't get to the same state because the first key
   * will be handled as an action (in this case a 'CommandInsertAfterCursor')
   */
  private hasPotentialRemap = false;

  get isPotentialRemap(): boolean {
    return this._isPotentialRemap;
  }

  constructor(configKey: string, remappedModes: Mode[]) {
    this.configKey = configKey;
    this.remappedModes = remappedModes;
  }

  public async sendKey(keys: string[], modeHandler: ModeHandler): Promise<boolean> {
    const { vimState, remapState } = modeHandler;

    this._isPotentialRemap = false;
    const allowPotentialRemapOnFirstKey = vimState.recordedState.allowPotentialRemapOnFirstKey;
    let remainingKeys: string[] = [];

    /**
     * Means that the timeout finished so we now can't allow the keys to be buffered again
     * because the user already waited for timeout.
     */
    let allowBufferingKeys = true;

    if (!this.remappedModes.includes(vimState.currentModeIncludingPseudoModes)) {
      return false;
    }

    const userDefinedRemappings = configuration[this.configKey] as Map<string, IKeyRemapping>;

    if (keys[keys.length - 1] === SpecialKeys.TimeoutFinished) {
      // Timeout finished. Don't let an ambiguous or potential remap start another timeout again
      keys = keys.slice(0, keys.length - 1);
      allowBufferingKeys = false;
    }

    if (keys.length === 0) {
      return true;
    }

    Logger.trace(
      `trying to find matching remap. keys=${keys}. mode=${
        Mode[vimState.currentMode]
      }. keybindings=${this.configKey}.`,
    );

    let remapping: IKeyRemapping | undefined = this.findMatchingRemap(userDefinedRemappings, keys);

    // Check to see if a remapping could potentially be applied when more keys are received
    let isPotentialRemap = Remapper.hasPotentialRemap(keys, userDefinedRemappings);

    this._isPotentialRemap =
      isPotentialRemap && allowBufferingKeys && allowPotentialRemapOnFirstKey;

    /**
     * Handle a broken potential or ambiguous remap
     * 1. If this Remapper doesn't have a remapping AND
     * 2. (It previously had an AmbiguousRemap OR a PotentialRemap) AND
     * 3. (It doesn't have a potential remap anymore OR timeout finished) AND
     * 4. keys length is more than 1
     *
     * Points 1-3: If we no longer have a remapping but previously had one or a potential one
     * and there is no longer potential remappings because of another pressed key or because the
     * timeout has passed we need to handle those situations by resending the keys or handling the
     * ambiguous remap and resending any remaining keys.
     * Point 4: if there is only one key there is no point in resending it without allowing remaps
     * on first key, we can let the remapper go to the end because since either there was no potential
     * remap anymore or the timeout finished so this means that the next two checks (the 'Buffer keys
     * and create timeout' and 'Handle remapping and remaining keys') will never be hit, so it reaches
     * the end without doing anything which means that this key will be handled as an action as intended.
     */
    if (
      !remapping &&
      (this.hasAmbiguousRemap || this.hasPotentialRemap) &&
      (!isPotentialRemap || !allowBufferingKeys) &&
      keys.length > 1
    ) {
      if (this.hasAmbiguousRemap) {
        remapping = this.hasAmbiguousRemap;
        isPotentialRemap = false;
        this._isPotentialRemap = false;

        // Use the commandList to get the remaining keys so that it includes any existing
        // '<TimeoutFinished>' key
        remainingKeys = vimState.recordedState.commandList.slice(remapping.before.length);
        this.hasAmbiguousRemap = undefined;
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
          // keys but resend the '<TimeoutFinished>' key as well so we don't wait
          // for the timeout again but can still handle potential remaps.
          //
          // Example 1: if 'ccc' is mapped in normal mode and user presses 'cc' and
          // waits for the timeout to finish, this will resend the 'cc<TimeoutFinished>'
          // keys without allowing a potential remap on first key, which makes the
          // first 'c' be handled as a 'ChangeOperator' and the second 'c' which has
          // potential remaps (the 'ccc' remap) is buffered and the timeout started
          // but then the '<TimeoutFinished>' key comes straight away that clears the
          // timeout without waiting again, and makes the second 'c' be handled normally
          // as another 'ChangeOperator'.
          //
          // Example 2: if 'iiii' is mapped in normal and 'ii' is mapped in insert
          // mode, and the user presses 'iii' in normal mode and waits for the timeout
          // to finish, this will resend the 'iii<TimeoutFinished>' keys without allowing
          // a potential remap on first key, which makes the first 'i' be handled as
          // an 'CommandInsertAtCursor' and goes to insert mode, next the second 'i'
          // is buffered, then the third 'i' finds the insert mode remapping of 'ii'
          // and handles that remap, after the remapping being handled the '<TimeoutFinished>'
          // key comes that clears the timeout and since the commandList will be empty
          // we return true as we finished handling this sequence of keys.

          keys.push(SpecialKeys.TimeoutFinished); // include the '<TimeoutFinished>' key

          Logger.trace(
            `${this.configKey}. timeout finished, handling timed out buffer keys without allowing a new timeout.`,
          );
        }
        Logger.trace(
          `${this.configKey}. potential remap broken. resending keys without allowing a potential remap on first key. keys=${keys}`,
        );
        this.hasPotentialRemap = false;
        vimState.recordedState.allowPotentialRemapOnFirstKey = false;
        vimState.recordedState.resetCommandList();

        if (remapState.wasPerformingRemapThatFinishedWaitingForTimeout) {
          // Some keys that broke the possible remap were typed by the user so handle them seperatly
          const lastRemapLength =
            remapState.wasPerformingRemapThatFinishedWaitingForTimeout.after!.length;
          const keysPressedByUser = keys.slice(lastRemapLength);
          keys = keys.slice(0, lastRemapLength);

          try {
            remapState.isCurrentlyPerformingRecursiveRemapping = true;
            await modeHandler.handleMultipleKeyEvents(keys);
          } catch (e) {
            if (e instanceof ForceStopRemappingError) {
              Logger.trace(
                `${this.configKey}. Stopped the remapping in the middle, ignoring the rest. Reason: ${e.message}`,
              );
            }
          } finally {
            remapState.isCurrentlyPerformingRecursiveRemapping = false;
            remapState.wasPerformingRemapThatFinishedWaitingForTimeout = false;
            await modeHandler.handleMultipleKeyEvents(keysPressedByUser);
          }
        } else {
          Logger.debug(`Remapping to ${keys}`);
          await modeHandler.handleMultipleKeyEvents(keys);
        }
        return true;
      }
    }

    /**
     * Buffer keys and create timeout
     * 1. If the current keys have a potential remap AND
     * 2. The timeout hasn't finished yet so we allow buffering keys AND
     * 3. We allow potential remap on first key (check the note on RecordedState. TLDR: this will only
     * be false for one key, the first one, when we resend keys that had a potential remap but no longer
     * have it or the timeout finished)
     *
     * Points 1-3: If the current keys still have a potential remap and the timeout hasn't finished yet
     * and we are not preventing a potential remap on the first key then we need to buffer this keys
     * and wait for another key or the timeout to finish.
     */
    if (isPotentialRemap && allowBufferingKeys && allowPotentialRemapOnFirstKey) {
      if (remapping) {
        // There are other potential remaps (ambiguous remaps), wait for other key or for the timeout
        // to finish. Also store this current ambiguous remap on '_hasAmbiguousRemap' so that if later
        // this ambiguous remap is broken or the user waits for timeout we don't need to go looking for
        // it again.
        this.hasAmbiguousRemap = remapping;

        Logger.trace(
          `${this.configKey}. ambiguous match found. before=${remapping.before}. after=${remapping.after}. command=${remapping.commands}. waiting for other key or timeout to finish.`,
        );
      } else {
        this.hasPotentialRemap = true;
        Logger.trace(
          `${this.configKey}. potential remap found. waiting for other key or timeout to finish.`,
        );
      }

      // Store BufferedKeys
      vimState.recordedState.bufferedKeys = [...keys];

      // Create Timeout
      vimState.recordedState.bufferedKeysTimeoutObj = setTimeout(() => {
        void modeHandler.handleKeyEvent(SpecialKeys.TimeoutFinished);
      }, configuration.timeout);
      return true;
    }

    /**
     * Handle Remapping and any remaining keys
     * If we get here with a remapping that means we need to handle it.
     */
    if (remapping) {
      if (!allowBufferingKeys) {
        // If the user already waited for the timeout to finish, prevent the
        // remapping from waiting for the timeout again by making a clone of
        // remapping and change 'after' to send the '<TimeoutFinished>' key at
        // the end.
        const newRemapping = { ...remapping };
        newRemapping.after = remapping.after?.slice(0);
        newRemapping.after?.push(SpecialKeys.TimeoutFinished);
        remapping = newRemapping;
      }

      this.hasAmbiguousRemap = undefined;
      this.hasPotentialRemap = false;

      let skipFirstCharacter = false;

      // If we were performing a remapping already, it means this remapping has a parent remapping
      const hasParentRemapping = remapState.isCurrentlyPerformingRemapping;
      if (!hasParentRemapping) {
        remapState.mapDepth = 0;
      }

      if (!remapping.recursive) {
        remapState.isCurrentlyPerformingNonRecursiveRemapping = true;
      } else {
        remapState.isCurrentlyPerformingRecursiveRemapping = true;

        // As per the Vim documentation: (:help recursive)
        // If the {rhs} starts with {lhs}, the first character is not mapped
        // again (this is Vi compatible).
        // For example:
        // map ab abcd
        // will execute the "a" command and insert "bcd" in the text. The "ab"
        // in the {rhs} will not be mapped again.
        if (remapping.after?.join('').startsWith(remapping.before.join(''))) {
          skipFirstCharacter = true;
        }
      }

      // Increase mapDepth
      remapState.mapDepth++;

      Logger.trace(
        `${this.configKey}. match found. before=${remapping.before}. after=${remapping.after}. command=${remapping.commands}. remainingKeys=${remainingKeys}. mapDepth=${remapState.mapDepth}.`,
      );

      let remapFailed = false;

      try {
        // Check maxMapDepth
        if (remapState.mapDepth >= configuration.maxmapdepth) {
          const vimError = VimError.fromCode(ErrorCode.RecursiveMapping);
          StatusBar.displayError(vimState, vimError);
          throw ForceStopRemappingError.fromVimError(vimError);
        }

        // Hacky code incoming!!! If someone has a better way to do this please change it
        if (remapState.mapDepth % 10 === 0) {
          // Allow the user to press <C-c> or <Esc> key when inside an infinite looping remap.
          // When inside an infinite looping recursive mapping it would block the editor until it reached
          // the maxmapdepth. This 0ms wait allows the extension to handle any key typed by the user which
          // means it allows the user to press <C-c> or <Esc> to force stop the looping remap.
          // This shouldn't impact the normal use case because we're only running this every 10 nested
          // remaps. Also when the logs are set to Error only, a looping recursive remap takes around 1.5s
          // to reach 1000 mapDepth and give back control to the user, but when logs are set to debug it
          // can take as long as 7 seconds.
          const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
          await wait(0);
        }

        remapState.remapUsedACharacter = false;

        await this.handleRemapping(remapping, modeHandler, skipFirstCharacter);
      } catch (e) {
        if (e instanceof ForceStopRemappingError) {
          // If a motion fails or a VimError happens during any kind of remapping or if the user presses the
          // force stop remapping key (<C-c> or <Esc>) during a recursive remapping it should stop handling
          // the remap and all its parent remaps if we are on a chain of recursive remaps.
          // (Vim documentation :help map-error)
          remapFailed = true;

          // keep throwing until we reach the first parent
          if (hasParentRemapping) {
            throw e;
          }

          Logger.trace(
            `${this.configKey}. Stopped the remapping in the middle, ignoring the rest. Reason: ${e.message}`,
          );
        } else {
          // If some other error happens during the remapping handling it should stop the remap and rethrow
          Logger.trace(
            `${this.configKey}. error found in the middle of remapping, ignoring the rest of the remap. error: ${e}`,
          );
          throw e;
        }
      } finally {
        // Check if we are still inside a recursive remap
        if (!hasParentRemapping && remapState.isCurrentlyPerformingRecursiveRemapping) {
          // no more recursive remappings being handled
          if (vimState.recordedState.bufferedKeysTimeoutObj !== undefined) {
            // In order to be able to receive other keys and at the same time wait for timeout, we need
            // to create a timeout and return from the remapper so that modeHandler can be free to receive
            // more keys. This means that if we are inside a recursive remapping, when we return on the
            // last key of that remapping it will think that it is finished and set the currently
            // performing recursive remapping flag to false, which would result in the current bufferedKeys
            // not knowing they had a parent remapping. So we store that remapping here.
            remapState.wasPerformingRemapThatFinishedWaitingForTimeout = { ...remapping };
          }
          remapState.isCurrentlyPerformingRecursiveRemapping = false;
          remapState.forceStopRecursiveRemapping = false;
        }

        if (!hasParentRemapping) {
          // Last remapping finished handling. Set undo step.
          vimState.historyTracker.finishCurrentStep();
        }

        // NonRecursive remappings can't have nested remaps so after a finished remap we always set this to
        // false, because either we were performing a non recursive remap and now we finish or we weren't
        // performing a non recursive remapping and this was false anyway.
        remapState.isCurrentlyPerformingNonRecursiveRemapping = false;

        // if there were other remaining keys on the buffered keys that weren't part of the remapping
        // handle them now, except if the remap failed and the remaining keys weren't typed by the user.
        // (we know that if this remapping has a parent remapping then the remaining keys weren't typed
        // by the user, but instead were sent by the parent remapping handler)
        if (remainingKeys.length > 0 && !(remapFailed && hasParentRemapping)) {
          if (remapState.wasPerformingRemapThatFinishedWaitingForTimeout) {
            // If there was a performing remap that finished waiting for timeout then only the remaining keys
            // that are not part of that remap were typed by the user.
            let specialKey: string | undefined = '';
            if (remainingKeys[remainingKeys.length - 1] === SpecialKeys.TimeoutFinished) {
              specialKey = remainingKeys.pop();
            }
            const lastRemap = remapState.wasPerformingRemapThatFinishedWaitingForTimeout.after!;
            const lastRemapWithoutAmbiguousRemap = lastRemap.slice(remapping.before.length);
            const keysPressedByUser = remainingKeys.slice(lastRemapWithoutAmbiguousRemap.length);
            remainingKeys = remainingKeys.slice(0, remainingKeys.length - keysPressedByUser.length);
            if (specialKey) {
              remainingKeys.push(specialKey);
              if (keysPressedByUser.length !== 0) {
                keysPressedByUser.push(specialKey);
              }
            }
            try {
              remapState.isCurrentlyPerformingRecursiveRemapping = true;
              await modeHandler.handleMultipleKeyEvents(remainingKeys);
            } catch (e) {
              Logger.trace(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                `${this.configKey}. Stopped the remapping in the middle, ignoring the rest. Reason: ${e.message}`,
              );
            } finally {
              remapState.isCurrentlyPerformingRecursiveRemapping = false;
              remapState.wasPerformingRemapThatFinishedWaitingForTimeout = false;
              if (keysPressedByUser.length > 0) {
                await modeHandler.handleMultipleKeyEvents(keysPressedByUser);
              }
            }
          } else {
            await modeHandler.handleMultipleKeyEvents(remainingKeys);
          }
        }
      }

      return true;
    }

    this.hasPotentialRemap = false;
    this.hasAmbiguousRemap = undefined;
    return false;
  }

  private async handleRemapping(
    remapping: IKeyRemapping,
    modeHandler: ModeHandler,
    skipFirstCharacter: boolean,
  ) {
    const { vimState, remapState } = modeHandler;

    vimState.recordedState.resetCommandList();
    if (remapping.after) {
      Logger.debug(`Remapping ${remapping.before} to ${remapping.after}`);
      if (skipFirstCharacter) {
        remapState.isCurrentlyPerformingNonRecursiveRemapping = true;
        await modeHandler.handleKeyEvent(remapping.after[0]);
        remapState.isCurrentlyPerformingNonRecursiveRemapping = false;
        await modeHandler.handleMultipleKeyEvents(remapping.after.slice(1));
      } else {
        await modeHandler.handleMultipleKeyEvents(remapping.after);
      }
    }

    if (remapping.commands) {
      const count = vimState.recordedState.count || 1;
      vimState.recordedState.count = 0;
      for (let i = 0; i < count; i++) {
        for (const command of remapping.commands) {
          let commandString: string;
          let commandArgs: string[];
          if (typeof command === 'string') {
            commandString = command;
            commandArgs = [];
          } else {
            commandString = command.command;
            commandArgs = Array.isArray(command.args)
              ? (command.args as string[])
              : command.args
                ? [command.args]
                : [];
          }

          if (commandString.slice(0, 1) === ':') {
            // Check if this is a vim command by looking for :
            // TODO: Parse once & cache?
            const result = exCommandParser.parse(commandString);
            if (result.status) {
              if (result.value.lineRange) {
                await result.value.command.executeWithRange(vimState, result.value.lineRange);
              } else {
                await result.value.command.execute(vimState);
              }
            } else {
              throw VimError.fromCode(ErrorCode.NotAnEditorCommand, commandString);
            }
            modeHandler.updateView();
          } else {
            await vscode.commands.executeCommand(commandString, ...commandArgs);
          }

          // TODO add test cases (silent defined in IKeyRemapping)
          if (!remapping.silent) {
            StatusBar.setText(vimState, `${commandString} ${commandArgs.join(' ')}`);
          }
        }
      }
    }
  }

  protected findMatchingRemap(
    userDefinedRemappings: Map<string, IKeyRemapping>,
    inputtedKeys: string[],
  ): IKeyRemapping | undefined {
    if (userDefinedRemappings.size === 0) {
      return undefined;
    }

    const range = Remapper.getRemappedKeysLengthRange(userDefinedRemappings);
    const startingSliceLength = inputtedKeys.length;
    const inputtedString = inputtedKeys.join('');
    for (let sliceLength = startingSliceLength; sliceLength >= range[0]; sliceLength--) {
      const keySlice = inputtedKeys.slice(-sliceLength).join('');

      Logger.trace(`key=${inputtedKeys}. keySlice=${keySlice}.`);
      if (userDefinedRemappings.has(keySlice)) {
        const precedingKeys = inputtedString.slice(0, inputtedString.length - keySlice.length);
        if (precedingKeys.length > 0 && !/^[0-9]+$/.test(precedingKeys)) {
          Logger.trace(`key sequences need to match precisely. precedingKeys=${precedingKeys}.`);
          break;
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
    remappings: ReadonlyMap<string, IKeyRemapping>,
  ): [number, number] {
    if (remappings.size === 0) {
      return [0, 0];
    }
    const keyLengths = Array.from(remappings.values()).map((remap) => remap.before.length);
    return [Math.min(...keyLengths), Math.max(...keyLengths)];
  }

  /**
   * Given list of keys and list of remappings, returns true if the keys are a potential remap
   * @param keys the list of keys to be checked for potential remaps
   * @param remappings The remappings Map
   * @param countRemapAsPotential If the current keys are themselves a remap should they be considered a potential remap as well?
   */
  protected static hasPotentialRemap(
    keys: string[],
    remappings: ReadonlyMap<string, IKeyRemapping>,
    countRemapAsPotential: boolean = false,
  ): boolean {
    const keysAsString = keys.join('');
    const re = /^<([^>]+)>/;
    if (keysAsString !== '') {
      for (const remap of remappings.keys()) {
        if (remap.startsWith(keysAsString) && (remap !== keysAsString || countRemapAsPotential)) {
          // Don't confuse a key combination starting with '<' that is not a special key like '<C-a>'
          // with a remap that starts with a special key.
          if (keysAsString.startsWith('<') && !re.test(keysAsString) && re.test(remap)) {
            continue;
          }
          return true;
        }
      }
    }
    return false;
  }
}

function keyBindingsConfigKey(mode: string): string {
  return `${mode}ModeKeyBindingsMap`;
}

class InsertModeRemapper extends Remapper {
  constructor() {
    super(keyBindingsConfigKey('insert'), [Mode.Insert, Mode.Replace]);
  }
}

class NormalModeRemapper extends Remapper {
  constructor() {
    super(keyBindingsConfigKey('normal'), [Mode.Normal]);
  }
}

class OperatorPendingModeRemapper extends Remapper {
  constructor() {
    super(keyBindingsConfigKey('operatorPending'), [Mode.OperatorPendingMode]);
  }
}

class VisualModeRemapper extends Remapper {
  constructor() {
    super(keyBindingsConfigKey('visual'), [Mode.Visual, Mode.VisualLine, Mode.VisualBlock]);
  }
}

class CommandLineModeRemapper extends Remapper {
  constructor() {
    super(keyBindingsConfigKey('commandLine'), [
      Mode.CommandlineInProgress,
      Mode.SearchInProgressMode,
    ]);
  }
}
