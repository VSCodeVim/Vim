import * as _ from 'lodash';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'platform/fs';
import * as vscode from 'vscode';
import { window } from 'vscode';
import { Logger } from '../util/logger';
import { IConfiguration, IVimrcKeyRemapping } from './iconfiguration';
import { vimrcKeyRemappingBuilder } from './vimrcKeyRemappingBuilder';

export class VimrcImpl {
  private _vimrcPath?: string;

  /**
   * Fully resolved path to the user's .vimrc
   */
  public get vimrcPath(): string | undefined {
    return this._vimrcPath;
  }

  private static readonly SOURCE_REG_REX = /^(source)\s+(.+)/i;

  private static buildSource(line: string) {
    const matches = VimrcImpl.SOURCE_REG_REX.exec(line);
    if (!matches || matches.length < 3) {
      return undefined;
    }

    const sourceKeyword = matches[1];
    const filePath = matches[2];

    return VimrcImpl.expandHome(filePath);
  }

  private static async loadConfig(config: IConfiguration, configPath: string) {
    try {
      const vscodeCommands = await vscode.commands.getCommands();
      const lines = (await fs.readFileAsync(configPath, 'utf8')).split(/\r?\n/);
      for (const line of lines) {
        if (line.trimStart().startsWith('"')) {
          continue;
        }

        const source = this.buildSource(line);
        if (source) {
          if (!(await fs.existsAsync(source))) {
            Logger.warn(`Unable to find "${source}" file for configuration.`);
            continue;
          }
          Logger.debug(`Loading "${source}" file for configuration.`);
          await VimrcImpl.loadConfig(config, source);
          continue;
        }
        const remap = await vimrcKeyRemappingBuilder.build(line, vscodeCommands);
        if (remap) {
          VimrcImpl.addRemapToConfig(config, remap);
          continue;
        }
        const unremap = await vimrcKeyRemappingBuilder.buildUnmapping(line);
        if (unremap) {
          VimrcImpl.removeRemapFromConfig(config, unremap);
          continue;
        }
        const clearRemap = await vimrcKeyRemappingBuilder.buildClearMapping(line);
        if (clearRemap) {
          VimrcImpl.clearRemapsFromConfig(config, clearRemap);
          continue;
        }
      }
    } catch (err) {
      window.showWarningMessage(`vimrc file "${configPath}" is broken, err=${err}`);
    }
  }

  public async load(config: IConfiguration) {
    const _path = config.vimrc.path
      ? VimrcImpl.expandHome(config.vimrc.path)
      : await VimrcImpl.findDefaultVimrc();
    if (!_path) {
      await window.showWarningMessage('No .vimrc found. Please set `vim.vimrc.path.`');
      return;
    }
    if (!(await fs.existsAsync(_path))) {
      window
        .showWarningMessage(`No .vimrc found at ${_path}.`, 'Create it')
        .then(async (choice: string | undefined) => {
          if (choice === 'Create it') {
            const newVimrc = await vscode.window.showSaveDialog({
              defaultUri: vscode.Uri.file(_path),
            });
            if (newVimrc) {
              await fs.writeFileAsync(newVimrc.fsPath, '', 'utf-8');
              const document = vscode.window.activeTextEditor?.document;
              const resource = document
                ? { uri: document.uri, languageId: document.languageId }
                : undefined;
              vscode.workspace
                .getConfiguration('vim', resource)
                .update('vimrc.path', newVimrc.fsPath, true);
              await vscode.workspace.openTextDocument(newVimrc);
              // TODO: add some sample remaps/settings in here?
              await vscode.window.showTextDocument(newVimrc);
            }
          }
        });
    } else {
      this._vimrcPath = _path;

      // Remove all the old remappings from the .vimrc file
      VimrcImpl.removeAllRemapsFromConfig(config);

      // Add the new remappings
      await VimrcImpl.loadConfig(config, this._vimrcPath);
    }
  }

  /**
   * Adds a remapping from .vimrc to the given configuration
   */
  public static addRemapToConfig(config: IConfiguration, remap: IVimrcKeyRemapping): void {
    const mappings = (() => {
      switch (remap.keyRemappingType) {
        case 'map':
          return [
            config.normalModeKeyBindings,
            config.visualModeKeyBindings,
            config.operatorPendingModeKeyBindings,
          ];
        case 'nmap':
        case 'nma':
        case 'nm':
          return [config.normalModeKeyBindings];
        case 'vmap':
        case 'vma':
        case 'vm':
        case 'xmap':
        case 'xma':
        case 'xm':
          return [config.visualModeKeyBindings];
        case 'imap':
        case 'ima':
        case 'im':
          return [config.insertModeKeyBindings];
        case 'cmap':
        case 'cma':
        case 'cm':
          return [config.commandLineModeKeyBindings];
        case 'omap':
        case 'oma':
        case 'om':
          return [config.operatorPendingModeKeyBindings];
        case 'lmap':
        case 'lma':
        case 'lm':
        case 'map!':
          return [config.insertModeKeyBindings, config.commandLineModeKeyBindings];
        case 'noremap':
        case 'norema':
        case 'norem':
        case 'nore':
        case 'nor':
        case 'no':
          return [
            config.normalModeKeyBindingsNonRecursive,
            config.visualModeKeyBindingsNonRecursive,
            config.operatorPendingModeKeyBindingsNonRecursive,
          ];
        case 'nnoremap':
        case 'nnorema':
        case 'nnorem':
        case 'nnore':
        case 'nnor':
        case 'nno':
        case 'nn':
          return [config.normalModeKeyBindingsNonRecursive];
        case 'vnoremap':
        case 'vnorema':
        case 'vnorem':
        case 'vnore':
        case 'vnor':
        case 'vno':
        case 'vn':
        case 'xnoremap':
        case 'xnorema':
        case 'xnorem':
        case 'xnore':
        case 'xnor':
        case 'xno':
        case 'xn':
          return [config.visualModeKeyBindingsNonRecursive];
        case 'inoremap':
        case 'inorema':
        case 'inorem':
        case 'inore':
        case 'inor':
        case 'ino':
          return [config.insertModeKeyBindingsNonRecursive];
        case 'cnoremap':
        case 'cnorema':
        case 'cnorem':
        case 'cnore':
        case 'cnor':
        case 'cno':
          return [config.commandLineModeKeyBindingsNonRecursive];
        case 'onoremap':
        case 'onorema':
        case 'onorem':
        case 'onore':
        case 'onor':
        case 'ono':
          return [config.operatorPendingModeKeyBindingsNonRecursive];
        case 'lnoremap':
        case 'lnorema':
        case 'lnorem':
        case 'lnore':
        case 'lnor':
        case 'lno':
        case 'ln':
        case 'noremap!':
        case 'norema!':
        case 'norem!':
        case 'nore!':
        case 'nor!':
        case 'no!':
          return [
            config.insertModeKeyBindingsNonRecursive,
            config.commandLineModeKeyBindingsNonRecursive,
          ];
        default:
          Logger.warn(`Encountered an unrecognized mapping type: '${remap.keyRemappingType}'`);
          return undefined;
      }
    })();

    mappings?.forEach((remaps) => {
      // Don't override a mapping present in settings.json; those are more specific to VSCodeVim.
      if (!remaps.some((r) => _.isEqual(r.before, remap.keyRemapping.before))) {
        remaps.push(remap.keyRemapping);
      }
    });
  }

  /**
   * Removes a remapping from .vimrc from the given configuration
   */
  public static removeRemapFromConfig(config: IConfiguration, remap: IVimrcKeyRemapping): boolean {
    const mappings = (() => {
      switch (remap.keyRemappingType) {
        case 'unmap':
        case 'unma':
        case 'unm':
          return [
            config.normalModeKeyBindings,
            config.normalModeKeyBindingsNonRecursive,
            config.visualModeKeyBindings,
            config.visualModeKeyBindingsNonRecursive,
            config.operatorPendingModeKeyBindings,
            config.operatorPendingModeKeyBindingsNonRecursive,
          ];
        case 'nunmap':
        case 'nunma':
        case 'nunm':
        case 'nun':
          return [config.normalModeKeyBindings, config.normalModeKeyBindingsNonRecursive];
        case 'vunmap':
        case 'vunma':
        case 'vunm':
        case 'vun':
        case 'vu':
        case 'xunmap':
        case 'xunma':
        case 'xunm':
        case 'xun':
        case 'xu':
          return [config.visualModeKeyBindings, config.visualModeKeyBindingsNonRecursive];
        case 'iunmap':
        case 'iunma':
        case 'iunm':
        case 'iun':
        case 'iu':
          return [config.insertModeKeyBindings, config.insertModeKeyBindingsNonRecursive];
        case 'cunmap':
        case 'cunma':
        case 'cunm':
        case 'cun':
        case 'cu':
          return [config.commandLineModeKeyBindings, config.commandLineModeKeyBindingsNonRecursive];
        case 'ounmap':
        case 'ounma':
        case 'ounm':
        case 'oun':
        case 'ou':
          return [
            config.operatorPendingModeKeyBindings,
            config.operatorPendingModeKeyBindingsNonRecursive,
          ];
        case 'lunmap':
        case 'lunma':
        case 'lunm':
        case 'lun':
        case 'lu':
        case 'unmap!':
        case 'unma!':
        case 'unm!':
          return [
            config.insertModeKeyBindings,
            config.insertModeKeyBindingsNonRecursive,
            config.commandLineModeKeyBindings,
            config.commandLineModeKeyBindingsNonRecursive,
          ];
        default:
          Logger.warn(`Encountered an unrecognized unmapping type: '${remap.keyRemappingType}'`);
          return undefined;
      }
    })();

    if (mappings) {
      mappings.forEach((remaps) => {
        // Don't remove a mapping present in settings.json; those are more specific to VSCodeVim.
        _.remove(
          remaps,
          (r) => r.source === 'vimrc' && _.isEqual(r.before, remap.keyRemapping.before),
        );
      });
      return true;
    }
    return false;
  }

  /**
   * Clears all remappings from .vimrc from the given configuration for specific mode
   */
  public static clearRemapsFromConfig(config: IConfiguration, remap: IVimrcKeyRemapping): boolean {
    const mappings = (() => {
      switch (remap.keyRemappingType) {
        case 'mapclear':
        case 'mapclea':
        case 'mapcle':
        case 'mapcl':
        case 'mapc':
          return [
            config.normalModeKeyBindings,
            config.normalModeKeyBindingsNonRecursive,
            config.visualModeKeyBindings,
            config.visualModeKeyBindingsNonRecursive,
            config.operatorPendingModeKeyBindings,
            config.operatorPendingModeKeyBindingsNonRecursive,
          ];
        case 'nmapclear':
        case 'nmapclea':
        case 'nmapcle':
        case 'nmapcl':
        case 'nmapc':
          return [config.normalModeKeyBindings, config.normalModeKeyBindingsNonRecursive];
        case 'vmapclear':
        case 'vmapclea':
        case 'vmapcle':
        case 'vmapcl':
        case 'vmapc':
        case 'xmapclear':
        case 'xmapclea':
        case 'xmapcle':
        case 'xmapcl':
        case 'xmapc':
          return [config.visualModeKeyBindings, config.visualModeKeyBindingsNonRecursive];
        case 'imapclear':
        case 'imapclea':
        case 'imapcle':
        case 'imapcl':
        case 'imapc':
          return [config.insertModeKeyBindings, config.insertModeKeyBindingsNonRecursive];
        case 'cmapclear':
        case 'cmapclea':
        case 'cmapcle':
        case 'cmapcl':
        case 'cmapc':
          return [config.commandLineModeKeyBindings, config.commandLineModeKeyBindingsNonRecursive];
        case 'omapclear':
        case 'omapclea':
        case 'omapcle':
        case 'omapcl':
        case 'omapc':
          return [
            config.operatorPendingModeKeyBindings,
            config.operatorPendingModeKeyBindingsNonRecursive,
          ];
        case 'lmapclear':
        case 'lmapclea':
        case 'lmapcle':
        case 'lmapcl':
        case 'lmapc':
        case 'mapclear!':
        case 'mapclea!':
        case 'mapcle!':
        case 'mapcl!':
        case 'mapc!':
          return [
            config.insertModeKeyBindings,
            config.insertModeKeyBindingsNonRecursive,
            config.commandLineModeKeyBindings,
            config.commandLineModeKeyBindingsNonRecursive,
          ];
        default:
          Logger.warn(`Encountered an unrecognized clearMapping type: '${remap.keyRemappingType}'`);
          return undefined;
      }
    })();

    if (mappings) {
      mappings.forEach((remaps) => {
        // Don't remove a mapping present in settings.json; those are more specific to VSCodeVim.
        _.remove(remaps, (r) => r.source === 'vimrc');
      });
      return true;
    }
    return false;
  }

  public static removeAllRemapsFromConfig(config: IConfiguration): void {
    const remapCollections = [
      config.normalModeKeyBindings,
      config.operatorPendingModeKeyBindings,
      config.visualModeKeyBindings,
      config.insertModeKeyBindings,
      config.commandLineModeKeyBindings,
      config.normalModeKeyBindingsNonRecursive,
      config.operatorPendingModeKeyBindingsNonRecursive,
      config.visualModeKeyBindingsNonRecursive,
      config.insertModeKeyBindingsNonRecursive,
      config.commandLineModeKeyBindingsNonRecursive,
    ];
    for (const remaps of remapCollections) {
      _.remove(remaps, (remap) => remap.source === 'vimrc');
    }
  }

  private static async findDefaultVimrc(): Promise<string | undefined> {
    const vscodeVimrcPath = path.join(os.homedir(), '.vscodevimrc');
    if (await fs.existsAsync(vscodeVimrcPath)) {
      return vscodeVimrcPath;
    }

    let vimrcPath = path.join(os.homedir(), '.vimrc');
    if (await fs.existsAsync(vimrcPath)) {
      return vimrcPath;
    }

    vimrcPath = path.join(os.homedir(), '_vimrc');
    if (await fs.existsAsync(vimrcPath)) {
      return vimrcPath;
    }

    vimrcPath = path.join(os.homedir(), '.config/', 'nvim/', 'init.vim');
    if (await fs.existsAsync(vimrcPath)) {
      return vimrcPath;
    }

    return undefined;
  }

  private static expandHome(filePath: string): string {
    // regex = Anything preceded by beginning of line
    // and immediately followed by '~' or '$HOME'
    const regex = /(?<=^(?:~|\$HOME)).*/;

    // Matches /pathToVimrc in $HOME/pathToVimrc or ~/pathToVimrc
    const matches = filePath.match(regex);

    if (!matches || matches.length > 1) {
      return filePath;
    }

    return path.join(os.homedir(), matches[0]);
  }
}

export const vimrc = new VimrcImpl();
