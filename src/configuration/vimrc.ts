import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { IConfiguration, IKeyRemapping, IVimrcKeyRemapping } from './iconfiguration';
import { vimrcKeyRemappingBuilder } from './vimrcKeyRemappingBuilder';

class VimrcImpl {
  public load(configuration: IConfiguration) {
    if (configuration.vimrc.path) {
      configuration.vimrc.path = VimrcImpl.expandHome(configuration.vimrc.path);
      if (!fs.existsSync(configuration.vimrc.path)) {
        return;
      }
    } else {
      configuration.vimrc.path = VimrcImpl.findDefaultVimrc();
      if (!configuration.vimrc.path) {
        return;
      }
    }

    let vimrcContent = fs.readFileSync(configuration.vimrc.path, { encoding: 'utf8' });
    let lines = vimrcContent.split(/\r?\n/);

    for (const line of lines) {
      const remap: IVimrcKeyRemapping | undefined = vimrcKeyRemappingBuilder.build(line);
      if (remap) {
        VimrcImpl.addRemapToConfig(configuration, remap);
      }
    }
  }

  /**
   * Adds a remapping from .vimrc to the given configuration
   */
  private static addRemapToConfig(configuration: IConfiguration, remap: IVimrcKeyRemapping): void {
    let collection: IKeyRemapping[];
    switch (remap.keyRemappingType) {
      case 'nmap':
        collection = configuration.normalModeKeyBindings;
        break;
      case 'vmap':
        collection = configuration.visualModeKeyBindings;
        break;
      case 'imap':
        collection = configuration.insertModeKeyBindings;
        break;
      case 'nnoremap':
        collection = configuration.normalModeKeyBindingsNonRecursive;
        break;
      case 'vnoremap':
        collection = configuration.visualModeKeyBindingsNonRecursive;
        break;
      case 'inoremap':
        collection = configuration.insertModeKeyBindingsNonRecursive;
        break;
      default:
        return;
    }

    // Don't override a mapping present in settings.json; those are more specific to VSCodeVim.
    if (!collection.some(r => _.isEqual(r.before, remap!.keyRemapping.before))) {
      collection.push(remap.keyRemapping);
    }
  }

  private static findDefaultVimrc(): string {
    if (!process.env.HOME) {
      return '';
    }

    let vimrcPath = path.join(process.env.HOME, '.vimrc');
    if (!fs.existsSync(vimrcPath)) {
      vimrcPath = path.join(process.env.HOME, '_vimrc');
      if (!fs.existsSync(vimrcPath)) {
        return '';
      }
    }

    return vimrcPath;
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
