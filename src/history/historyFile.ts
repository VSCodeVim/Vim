import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { configuration } from '../configuration/configuration';
import { logger } from '../util/logger';
import { getExtensionDirPath } from '../util/util';

const mkdirp = require('mkdirp');

export class HistoryFile {
  private _historyFileName: string;
  private _historyDir: string;
  private _history: string[] = [];

  public get historyFilePath(): string {
    return path.join(this._historyDir, this._historyFileName);
  }

  constructor(historyFileName: string, historyDir?: string) {
    this._historyFileName = historyFileName;
    this._historyDir = historyDir ? historyDir : getExtensionDirPath();
  }

  public async add(value: string | undefined): Promise<void> {
    if (!value || value.length === 0) {
      return;
    }

    // remove duplicates
    let index: number = this._history.indexOf(value);
    if (index !== -1) {
      this._history.splice(index, 1);
    }

    // append to the end
    this._history.push(value);

    // resize array if necessary
    if (this._history.length > configuration.history) {
      this._history = this._history.slice(this._history.length - configuration.history);
    }

    return this.save();
  }

  public get(): string[] {
    // resize array if necessary
    if (this._history.length > configuration.history) {
      this._history = this._history.slice(this._history.length - configuration.history);
    }

    return this._history;
  }

  public clear() {
    try {
      this._history = [];
      fs.unlinkSync(this.historyFilePath);
    } catch (err) {
      logger.warn(`historyFile: Unable to delete ${this.historyFilePath}. err=${err}.`);
    }
  }

  public async load(): Promise<void> {
    let data = '';

    try {
      data = await promisify(fs.readFile)(this.historyFilePath, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        logger.debug(`historyFile: History does not exist. path=${this._historyDir}`);
      } else {
        logger.warn(`historyFile: Failed to load history. path=${this._historyDir} err=${err}.`);
      }
      return;
    }

    if (data.length === 0) {
      return;
    }

    try {
      let parsedData = JSON.parse(data);
      if (!Array.isArray(parsedData)) {
        throw Error('Unexpected format in history file. Expected JSON.');
      }
      this._history = parsedData;
    } catch (e) {
      logger.warn(
        `historyFile: Deleting corrupted history file. path=${this._historyDir} err=${e}.`
      );
      this.clear();
    }
  }

  private async save(): Promise<void> {
    try {
      // create supplied directory. if directory already exists, do nothing.
      await promisify(mkdirp)(this._historyDir, 0o775);
      // create file
      await promisify(fs.writeFile)(this.historyFilePath, JSON.stringify(this._history), 'utf-8');
    } catch (err) {
      logger.error(
        `historyFile: Failed to save history. filepath=${this.historyFilePath}. err=${err}.`
      );
      throw err;
    }
  }
}

export class SearchHistory extends HistoryFile {
  constructor(historyFileDir?: string) {
    super('.search_history', historyFileDir);
  }
}

export class CommandLineHistory extends HistoryFile {
  constructor(historyFileDir?: string) {
    super('.cmdline_history', historyFileDir);
  }
}
