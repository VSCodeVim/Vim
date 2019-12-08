import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { IConfiguration, IVimrcKeyRemapping } from './iconfiguration';
import { vimrcKeyRemappingBuilder } from './vimrcKeyRemappingBuilder';

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
      : VimrcImpl.findDefaultVimrc();
    if (!_path || !fs.existsSync(_path)) {
      // TODO: we may want to offer to create the file for them
      throw new Error(`Unable to find .vimrc file`);
    }
    this._vimrcPath = _path;

    // Remove all the old remappings from the .vimrc file
    VimrcImpl.removeAllRemapsFromConfig(config);

    // Add the new remappings
    const lines = fs.readFileSync(this.vimrcPath, { encoding: 'utf8' }).split(/\r?\n/);
    for (const line of lines) {
      const remap = await vimrcKeyRemappingBuilder.build(line);
      if (remap) {
        VimrcImpl.addRemapToConfig(config, remap);
      }
    }
  }

  /**
   * Adds a remapping from .vimrc to the given configuration
   */
  private static addRemapToConfig(config: IConfiguration, remap: IVimrcKeyRemapping): void {
    const remaps = (() => {
      switch (remap.keyRemappingType) {
        case 'nmap':
          return config.normalModeKeyBindings;
        case 'vmap':
          return config.visualModeKeyBindings;
        case 'imap':
          return config.insertModeKeyBindings;
        case 'nnoremap':
          return config.normalModeKeyBindingsNonRecursive;
        case 'vnoremap':
          return config.visualModeKeyBindingsNonRecursive;
        case 'inoremap':
          return config.insertModeKeyBindingsNonRecursive;
        default:
          return undefined;
      }
    })();

    // Don't override a mapping present in settings.json; those are more specific to VSCodeVim.
    if (remaps && !remaps.some(r => _.isEqual(r.before, remap!.keyRemapping.before))) {
      remaps.push(remap.keyRemapping);
    }
  }

  private static removeAllRemapsFromConfig(config: IConfiguration): void {
    const remapCollections = [
      config.normalModeKeyBindings,
      config.visualModeKeyBindings,
      config.insertModeKeyBindings,
      config.normalModeKeyBindingsNonRecursive,
      config.visualModeKeyBindingsNonRecursive,
      config.insertModeKeyBindingsNonRecursive,
    ];
    for (const remaps of remapCollections) {
      _.remove(remaps, remap => remap.source === 'vimrc');
    }
  }

  private static findDefaultVimrc(): string | undefined {
    if (process.env.HOME) {
      let vimrcPath = path.join(process.env.HOME, '.vimrc');
      if (fs.existsSync(vimrcPath)) {
        return vimrcPath;
      }

      vimrcPath = path.join(process.env.HOME, '_vimrc');
      if (fs.existsSync(vimrcPath)) {
        return vimrcPath;
      }
    }

    return undefined;
  }

  private static expandHome(filePath: string): string {
    if (!process.env.HOME) {
      return filePath;
    }

    if (!filePath.startsWith('~')) {
      return filePath;
    }

    return path.join(process.env.HOME, filePath.slice(1));
  }
}

export const vimrc = new VimrcImpl();
