import * as vscode from 'vscode';
import { PluginDefaultMappings } from '../../actions/plugins/pluginDefaultMappings';
import { configurationValidator } from '../configurationValidator';
import { IConfiguration, IKeyRemapping, RemapMode } from '../iconfiguration';
import { IConfigurationValidator, ValidatorResults } from '../iconfigurationValidator';
import { Notation } from '../notation';

export class RemappingValidator implements IConfigurationValidator {
  private commandMap!: Map<string, boolean>;

  async validate(config: IConfiguration): Promise<ValidatorResults> {
    const result = new ValidatorResults();
    const remapModes: readonly RemapMode[] = [
      'insert',
      'normal',
      'operatorPending',
      'visual',
      'commandLine',
    ];
    for (const mode of remapModes) {
      // Recursive and non-recursive remappings for a mode go into the same map
      for (const isRecursive of [true, false]) {
        await this.validateKeyBindings(config, mode, isRecursive, result);
      }
    }

    return result;
  }

  private async validateKeyBindings(
    config: IConfiguration,
    mode: RemapMode,
    isRecursive: boolean,
    result: ValidatorResults,
  ): Promise<void> {
    const modeKeyBindingsKey =
      `${mode}ModeKeyBindings${isRecursive ? '' : 'NonRecursive'}` as const;
    const keybindings = config[modeKeyBindingsKey];
    const modeKeyBindingsMap = config[`${mode}ModeKeyBindingsMap`];

    // add default mappings for activated plugins
    // because we process keybindings backwards in next loop, user mapping will override
    for (const pluginMapping of PluginDefaultMappings.getPluginDefaultMappings(
      modeKeyBindingsKey,
      config,
    )) {
      // note concat(all mappings) does not work somehow
      keybindings.push(pluginMapping);
    }

    for (let i = keybindings.length - 1; i >= 0; i--) {
      const remapping = keybindings[i];

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
