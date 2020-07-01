import * as _ from 'lodash';
import * as fs from '../util/fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { IConfiguration, IVimrcKeyRemapping } from './iconfiguration';
import { vimrcKeyRemappingBuilder } from './vimrcKeyRemappingBuilder';
import { window } from 'vscode';
import { configuration } from './configuration';

class VimrcImpl {
  private _vimrcPath: string;

  /**
   * Fully resolved path to the user's .vimrc
   */
  public get vimrcPath(): string {
    return this._vimrcPath;
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
              configuration.getConfiguration('vim').update('vimrc.path', newVimrc.fsPath, true);
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
      try {
        const lines = (await fs.readFileAsync(this.vimrcPath, 'utf8')).split(/\r?\n/);
        for (const line of lines) {
          const remap = await vimrcKeyRemappingBuilder.build(line);
          if (remap) {
            VimrcImpl.addRemapToConfig(config, remap);
          }
        }
      } catch (err) {
        window.showWarningMessage(`vimrc file "${this._vimrcPath}" is broken, err=${err}`);
      }
    }
  }

  /**
   * Adds a remapping from .vimrc to the given configuration
   */
  private static addRemapToConfig(config: IConfiguration, remap: IVimrcKeyRemapping): void {
    const mappings = (() => {
      switch (remap.keyRemappingType) {
        case 'map':
          return [config.normalModeKeyBindings, config.visualModeKeyBindings];
        case 'nmap':
          return [config.normalModeKeyBindings];
        case 'vmap':
          return [config.visualModeKeyBindings];
        case 'imap':
          return [config.insertModeKeyBindings];
        case 'cmap':
          return [config.commandLineModeKeyBindings];
        case 'noremap':
          return [
            config.normalModeKeyBindingsNonRecursive,
            config.visualModeKeyBindingsNonRecursive,
          ];
        case 'nnoremap':
          return [config.normalModeKeyBindingsNonRecursive];
        case 'vnoremap':
          return [config.visualModeKeyBindingsNonRecursive];
        case 'inoremap':
          return [config.insertModeKeyBindingsNonRecursive];
        case 'cnoremap':
          return [config.commandLineModeKeyBindingsNonRecursive];
        default:
          console.warn(`Encountered an unrecognized mapping type: '${remap.keyRemappingType}'`);
          return undefined;
      }
    })();

    mappings?.forEach((remaps) => {
      // Don't override a mapping present in settings.json; those are more specific to VSCodeVim.
      if (!remaps.some((r) => _.isEqual(r.before, remap!.keyRemapping.before))) {
        remaps.push(remap.keyRemapping);
      }
    });
  }

  private static removeAllRemapsFromConfig(config: IConfiguration): void {
    const remapCollections = [
      config.normalModeKeyBindings,
      config.visualModeKeyBindings,
      config.insertModeKeyBindings,
      config.commandLineModeKeyBindings,
      config.normalModeKeyBindingsNonRecursive,
      config.visualModeKeyBindingsNonRecursive,
      config.insertModeKeyBindingsNonRecursive,
      config.commandLineModeKeyBindingsNonRecursive,
    ];
    for (const remaps of remapCollections) {
      _.remove(remaps, (remap) => remap.source === 'vimrc');
    }
  }

  private static async findDefaultVimrc(): Promise<string | undefined> {
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
