import * as path from 'path';
import { Logger } from '../util/logger';
import { configuration } from '../configuration/configuration';
import { Globals } from '../globals';
import { readFileAsync, mkdirAsync, writeFileAsync, unlinkSync } from '../util/fs';

export class HistoryFile {
  private readonly _logger = Logger.get('HistoryFile');
  private _historyFileName: string;
  private _history: string[] = [];

  public get historyFilePath(): string {
    return path.join(Globals.extensionStoragePath, this._historyFileName);
  }

  constructor(historyFileName: string) {
    this._historyFileName = historyFileName;
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
      unlinkSync(this.historyFilePath);
    } catch (err) {
      this._logger.warn(`Unable to delete ${this.historyFilePath}. err=${err}.`);
    }
  }

  public async load(): Promise<void> {
    let data = '';

    try {
      data = await readFileAsync(this.historyFilePath, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        this._logger.debug(`History does not exist. path=${this.historyFilePath}`);
      } else {
        this._logger.warn(`Failed to load history. path=${this.historyFilePath} err=${err}.`);
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
      this._logger.warn(`Deleting corrupted history file. path=${this.historyFilePath} err=${e}.`);
      this.clear();
    }
  }

  private async save(): Promise<void> {
    try {
      // create supplied directory. if directory already exists, do nothing and move on
      try {
        await mkdirAsync(Globals.extensionStoragePath, { recursive: true });
      } catch (createDirectoryErr) {
        if (createDirectoryErr.code !== 'EEXIST') {
          throw createDirectoryErr;
        }
      }

      // create file
      await writeFileAsync(this.historyFilePath, JSON.stringify(this._history), 'utf-8');
    } catch (err) {
      this._logger.error(`Failed to save history. filepath=${this.historyFilePath}. err=${err}.`);
      throw err;
    }
  }
}

export class SearchHistory extends HistoryFile {
  constructor() {
    super('.search_history');
  }
}

export class CommandLineHistory extends HistoryFile {
  constructor() {
    super('.cmdline_history');
  }
}
