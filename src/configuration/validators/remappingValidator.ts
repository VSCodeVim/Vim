import * as vscode from 'vscode';
import { IConfiguration, IKeyRemapping } from '../iconfiguration';
import { Notation } from '../notation';
import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';
import { configurationValidator } from '../configurationValidator';

export class RemappingValidator implements IConfigurationValidator {
  private _commandMap: Map<string, boolean>;

  async validate(config: IConfiguration): Promise<ValidatorResults> {
    const result = new ValidatorResults();
    const modeKeyBindingsKeys = [
      'insertModeKeyBindings',
      'insertModeKeyBindingsNonRecursive',
      'normalModeKeyBindings',
      'normalModeKeyBindingsNonRecursive',
      'operatorPendingModeKeyBindings',
      'operatorPendingModeKeyBindingsNonRecursive',
      'visualModeKeyBindings',
      'visualModeKeyBindingsNonRecursive',
      'commandLineModeKeyBindings',
      'commandLineModeKeyBindingsNonRecursive',
    ];
    for (const modeKeyBindingsKey of modeKeyBindingsKeys) {
      let keybindings = config[modeKeyBindingsKey] as IKeyRemapping[];
      const isRecursive = modeKeyBindingsKey.indexOf('NonRecursive') === -1;

      let defaultKeybindings = [...(config['default' + modeKeyBindingsKey] as IKeyRemapping[])];
      // filter out the default keybindings whose 'after' already has a map to by the user and
      // the ones whose plugin is not active
      const filteredDefaultKeybindings = this.filterAndCloneKeybindings(
        config,
        defaultKeybindings,
        keybindings
      );
      keybindings.push(...filteredDefaultKeybindings);

      const modeMapName = modeKeyBindingsKey.replace('NonRecursive', '');
      let modeKeyBindingsMap = config[modeMapName + 'Map'] as Map<string, IKeyRemapping>;
      if (!modeKeyBindingsMap) {
        modeKeyBindingsMap = new Map<string, IKeyRemapping>();
      }
      for (let i = keybindings.length - 1; i >= 0; i--) {
        let remapping = keybindings[i] as IKeyRemapping;

        // set 'recursive' of the remapping according to where it was stored
        remapping.recursive = isRecursive;

        // validate
        let remappingError = await this.isRemappingValid(remapping);
        result.concat(remappingError);
        if (remappingError.hasError) {
          // errors with remapping, skip
          keybindings.splice(i, 1);
          continue;
        }

        // normalize
        if (remapping.before) {
          remapping.before.forEach(
            (key, idx) => (remapping.before[idx] = Notation.NormalizeKey(key, config.leader))
          );
        }

        if (remapping.after) {
          remapping.after.forEach(
            (key, idx) => (remapping.after![idx] = Notation.NormalizeKey(key, config.leader))
          );
        }

        // check for duplicates
        const beforeKeys = remapping.before.join('');
        if (modeKeyBindingsMap.has(beforeKeys)) {
          result.append({
            level: 'warning',
            message: `${remapping.before}. Duplicate remapped key for ${beforeKeys}.`,
          });
          continue;
        }

        // add to map
        modeKeyBindingsMap.set(beforeKeys, remapping);
      }

      config[modeMapName + 'Map'] = modeKeyBindingsMap;
    }

    return result;
  }

  disable(config: IConfiguration) {
    // no-op
  }

  private filterAndCloneKeybindings(
    config: IConfiguration,
    bindings: IKeyRemapping[],
    existingBindings: IKeyRemapping[]
  ) {
    const filteredKeybindings: IKeyRemapping[] = [];
    for (const keybinding of bindings) {
      if (!this.isPluginActive(config, (keybinding as any).plugin)) {
        continue;
      }

      const hasMapTo =
        existingBindings.find((ekb) => keybinding.after && keybinding.after === ekb.after) !==
        undefined;

      if (hasMapTo) {
        continue;
      }

      // need to make a clone of the remapping so that the NormalizeKey doesn't change
      // the default bindings. That would mess up the bindings when testing and using
      // different leader keys.
      let remapping: IKeyRemapping = {
        before: [...keybinding.before],
        after: keybinding.after ? [...keybinding.after] : undefined,
        commands: keybinding.commands ? [...keybinding.commands] : undefined,
        recursive: keybinding.recursive,
        source: keybinding.source,
      };
      filteredKeybindings.push(remapping);
    }
    return filteredKeybindings;
  }

  private isPluginActive(config: IConfiguration, pluginName: string | undefined) {
    if (!pluginName) {
      return true;
    } else {
      switch (pluginName) {
        case 'camelcasemotion':
          return config.camelCaseMotion.enable;
        case 'easymotion':
          return config.easymotion;
        default:
          return false;
      }
    }
  }

  private async isRemappingValid(remapping: IKeyRemapping): Promise<ValidatorResults> {
    const result = new ValidatorResults();

    if (!remapping.after && !remapping.commands) {
      result.append({
        level: 'error',
        message: `${remapping.before} missing 'after' key or 'command'.`,
      });
    }

    if (!(remapping.before instanceof Array)) {
      result.append({
        level: 'error',
        message: `Remapping of '${remapping.before}' should be a string array.`,
      });
    }

    if (remapping.recursive === undefined) {
      result.append({
        level: 'error',
        message: `Remapping of '${remapping.before}' missing 'recursive' info.`,
      });
    }

    if (remapping.after && !(remapping.after instanceof Array)) {
      result.append({
        level: 'error',
        message: `Remapping of '${remapping.after}' should be a string array.`,
      });
    }

    if (remapping.commands) {
      for (const command of remapping.commands) {
        let cmd: string;

        if (typeof command === 'string') {
          cmd = command;
        } else {
          cmd = command.command;
        }

        if (!(await this.isCommandValid(cmd))) {
          result.append({ level: 'warning', message: `${cmd} does not exist.` });
        }
      }
    }

    return result;
  }

  private async isCommandValid(command: string): Promise<boolean> {
    if (command.startsWith(':')) {
      return true;
    }

    return (await this.getCommandMap()).has(command);
  }

  private async getCommandMap(): Promise<Map<string, boolean>> {
    if (this._commandMap == null) {
      this._commandMap = new Map(
        (await vscode.commands.getCommands(true)).map((x) => [x, true] as [string, boolean])
      );
    }
    return this._commandMap;
  }
}

configurationValidator.registerValidator(new RemappingValidator());
