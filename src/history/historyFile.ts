import * as vscode from 'vscode';
import * as path from 'path';
import { Logger } from '../util/logger';
import { configuration } from '../configuration/configuration';
import { Globals } from '../globals';
import { HistoryBase } from 'platform/history';
import { readFileAsync, mkdirAsync, writeFileAsync, unlinkSync } from '../util/fs';

export class HistoryFile {
  private readonly _logger = Logger.get('HistoryFile');
  private _base: HistoryBase;
  private _history: string[] = [];

  get historyFilePath(): string {
    return this._base.historyKey;
  }

  constructor(context: vscode.ExtensionContext, historyFileName: string) {
    this._base = new HistoryBase(context, historyFileName, Globals.extensionStoragePath, this._logger);
  }

  public async add(value: string | undefined): Promise<void> {
    return this._base.add(value, configuration.history);
  }

  public get(): string[] {
    return this._base.get(configuration.history);
  }

  public clear() {
    try {
      // this._base.clear();
      this._history = [];
      unlinkSync(this.historyFilePath);
    } catch (err) {
      this._logger.warn(`Unable to delete ${this.historyFilePath}. err=${err}.`);
    }
  }

  public async load(): Promise<void> {
    // await this._base.load();
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
  constructor(context: vscode.ExtensionContext) {
    super(context, '.search_history');
  }
}

export class CommandLineHistory extends HistoryFile {
  constructor(context: vscode.ExtensionContext) {
    super(context, '.cmdline_history');
  }
}
