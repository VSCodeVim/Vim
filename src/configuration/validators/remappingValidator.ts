import * as vscode from 'vscode';
import { IConfiguration, IKeyRemapping } from '../iconfiguration';
import { Notation } from '../notation';
import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';
import { configurationValidator } from '../configurationValidator';
import { PluginDefaultMappings } from '../../actions/plugins/pluginDefaultMappings';

export class RemappingValidator implements IConfigurationValidator {
  private commandMap!: Map<string, boolean>;

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
      const keybindings = config[modeKeyBindingsKey];
      // add default mappings for activated plugins
      // because we process keybindings backwards in next loop, user mapping will override
      for (const pluginMapping of PluginDefaultMappings.getPluginDefaultMappings(
        modeKeyBindingsKey,
        config,
      )) {
        // note concat(all mappings) does not work somehow
        keybindings.push(pluginMapping);
      }

      const isRecursive = modeKeyBindingsKey.indexOf('NonRecursive') === -1;

      const modeMapName = modeKeyBindingsKey.replace('NonRecursive', '');
      let modeKeyBindingsMap = config[modeMapName + 'Map'] as Map<string, IKeyRemapping>;
      if (!modeKeyBindingsMap) {
        modeKeyBindingsMap = new Map<string, IKeyRemapping>();
      }
      for (let i = keybindings.length - 1; i >= 0; i--) {
        const remapping = keybindings[i] as IKeyRemapping;

        // set 'recursive' of the remapping according to where it was stored
        remapping.recursive = isRecursive;

        // validate
        const remappingError = await this.isRemappingValid(remapping);
        result.concat(remappingError);
        if (remappingError.hasError) {
          // errors with remapping, skip
          keybindings.splice(i, 1);
          continue;
        }

        // normalize
        if (remapping.before) {
          remapping.before.forEach(
            (key, idx) => (remapping.before[idx] = Notation.NormalizeKey(key, config.leader)),
          );
        }

        if (remapping.after) {
          remapping.after.forEach(
            (key, idx) => (remapping.after![idx] = Notation.NormalizeKey(key, config.leader)),
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

  private async isRemappingValid(remapping: IKeyRemapping): Promise<ValidatorResults> {
    const result = new ValidatorResults();

    if (!remapping.after && !remapping.commands) {
      result.append({
        level: 'error',
        message: `${remapping.before} missing 'after' key or 'commands'.`,
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
        } else if (command.command) {
          cmd = command.command;

          if (!(await this.isCommandValid(cmd))) {
            result.append({ level: 'warning', message: `${cmd} does not exist.` });
          }
        } else {
          result.append({
            level: 'error',
            message: `Remapping of '${remapping.before}' has wrong "commands" structure. Should be 'string[] | { "command": string, "args": any[] }[]'.`,
          });
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
    if (this.commandMap == null) {
      this.commandMap = new Map(
        (await vscode.commands.getCommands(true)).map((x) => [x, true] as [string, boolean]),
      );
    }
    return this.commandMap;
  }
}

configurationValidator.registerValidator(new RemappingValidator());
