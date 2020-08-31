import * as path from 'path';
import * as vscode from 'vscode';
import { readFileAsync, mkdirAsync, writeFileAsync, unlinkSync } from 'platform/fs';
import { ILogger } from '../common/logger';
import { Globals } from '../../globals';

export class HistoryBase {
  private _historyFileName: string;
  private _history: string[] = [];

  get historyKey(): string {
    return path.join(this._extensionStoragePath, this._historyFileName);
  }

  private _context: vscode.ExtensionContext;
  private _extensionStoragePath: string;
  private _logger: ILogger;

  constructor(
    context: vscode.ExtensionContext,
    historyFileName: string,
    extensionStoragePath: string,
    logger: ILogger
  ) {
    this._historyFileName = historyFileName;
    this._context = context;
    this._extensionStoragePath = extensionStoragePath;
    this._logger = logger;
  }

  public async add(value: string | undefined, history: number): Promise<void> {
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
    if (this._history.length > history) {
      this._history = this._history.slice(this._history.length - history);
    }

    return this.save();
  }

  public get(history: number): string[] {
    // resize array if necessary
    if (this._history.length > history) {
      this._history = this._history.slice(this._history.length - history);
    }

    return this._history;
  }

  public clear() {
    try {
      this._history = [];
      unlinkSync(this.historyKey);
    } catch (err) {
      this._logger.warn(`Unable to delete ${this.historyKey}. err=${err}.`);
    }
  }

  public async load(): Promise<void> {
    // await this._base.load();
    let data = '';

    try {
      data = await readFileAsync(this.historyKey, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        this._logger.debug(`History does not exist. path=${this.historyKey}`);
      } else {
        this._logger.warn(`Failed to load history. path=${this.historyKey} err=${err}.`);
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
      this._logger.warn(`Deleting corrupted history file. path=${this.historyKey} err=${e}.`);
      this.clear();
    }
  }

  async save(): Promise<void> {
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
      await writeFileAsync(this.historyKey, JSON.stringify(this._history), 'utf-8');
    } catch (err) {
      this._logger.error(`Failed to save history. filepath=${this.historyKey}. err=${err}.`);
      throw err;
    }
  }
}
