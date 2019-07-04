import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { IConfiguration, IKeyRemapping, IVimrcKeyRemapping } from './iconfiguration';
import { vimrcKeyRemappingBuilder } from './vimrcKeyRemappingBuilder';

class VimrcImpl {
  public load(configuration: IConfiguration) {
    if (configuration.vimrcPath) {
      configuration.vimrcPath = VimrcImpl.expandHome(configuration.vimrcPath);
      if (!fs.existsSync(configuration.vimrcPath)) {
        return;
      }
    } else {
      configuration.vimrcPath = VimrcImpl.findDefaultVimrc();
      if (!configuration.vimrcPath) {
        return;
      }
    }

    let vimrcContent = fs.readFileSync(configuration.vimrcPath, { encoding: 'utf8' });
    let lines = vimrcContent.split(/\r?\n/);

    for (const line of lines) {
      VimrcImpl.tryKeyRemapping(configuration, line);
    }
  }

  private static tryKeyRemapping(configuration: IConfiguration, line: string): boolean {
    let mapping: IVimrcKeyRemapping | null = vimrcKeyRemappingBuilder.build(line);
    if (!mapping) {
      return false;
    }

    let collection: IKeyRemapping[];
    switch (mapping.keyRemappingType) {
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
        return false;
    }

    // Don't override a mapping present in settings.json; those are more specific to VSCodeVim.
    if (!collection.some(r => _.isEqual(r.before, mapping!.keyRemapping.before))) {
      collection.push(mapping.keyRemapping);
    }

    return true;
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
