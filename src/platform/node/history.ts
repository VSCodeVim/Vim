import * as vscode from 'vscode';
import * as path from 'path';
import { readFileAsync, mkdirAsync, writeFileAsync, unlinkSync } from 'platform/fs';
import { ILogger } from '../common/logger';
import { Globals } from '../../globals';

export class HistoryBase {
  private readonly extensionStoragePath: string;
  private readonly logger: ILogger;
  private readonly historyFileName: string;
  private history: string[] = [];

  get historyKey(): string {
    return path.join(this.extensionStoragePath, this.historyFileName);
  }

  constructor(
    context: vscode.ExtensionContext,
    historyFileName: string,
    extensionStoragePath: string,
    logger: ILogger
  ) {
    this.historyFileName = historyFileName;
    this.extensionStoragePath = extensionStoragePath;
    this.logger = logger;
  }

  public async add(value: string | undefined, history: number): Promise<void> {
    if (!value || value.length === 0) {
      return;
    }

    // remove duplicates
    const index: number = this.history.indexOf(value);
    if (index !== -1) {
      this.history.splice(index, 1);
    }

    // append to the end
    this.history.push(value);

    // resize array if necessary
    if (this.history.length > history) {
      this.history = this.history.slice(this.history.length - history);
    }

    return this.save();
  }

  public get(history: number): string[] {
    // resize array if necessary
    if (this.history.length > history) {
      this.history = this.history.slice(this.history.length - history);
    }

    return this.history;
  }

  public clear() {
    try {
      this.history = [];
      unlinkSync(this.historyKey);
    } catch (err) {
      this.logger.warn(`Unable to delete ${this.historyKey}. err=${err}.`);
    }
  }

  public async load(): Promise<void> {
    // await this._base.load();
    let data = '';

    try {
      data = await readFileAsync(this.historyKey, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.logger.debug(`History does not exist. path=${this.historyKey}`);
      } else {
        this.logger.warn(`Failed to load history. path=${this.historyKey} err=${err}.`);
      }
      return;
    }

    if (data.length === 0) {
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      if (!Array.isArray(parsedData)) {
        throw Error('Unexpected format in history file. Expected JSON.');
      }
      this.history = parsedData;
    } catch (e) {
      this.logger.warn(`Deleting corrupted history file. path=${this.historyKey} err=${e}.`);
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
      await writeFileAsync(this.historyKey, JSON.stringify(this.history), 'utf-8');
    } catch (err) {
      this.logger.error(`Failed to save history. filepath=${this.historyKey}. err=${err}.`);
      throw err;
    }
  }
}
