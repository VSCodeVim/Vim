import * as fs from 'fs';
import * as path from 'path';
import { configuration } from '../configuration/configuration';
import { logger } from '../util/logger';

const mkdirp = require('mkdirp');

export class SearchHistory {
  private static readonly _searchHistoryFileName = '.search_history';
  private _searchHistoryDir: string;
  private _searchHistory: string[] = [];
  private get _searchHistoryFilePath(): string {
    return path.join(this._searchHistoryDir, SearchHistory._searchHistoryFileName);
  }

  constructor(searchHistoryDir: string) {
    this._searchHistoryDir = searchHistoryDir;
    this._loadFromFile();
  }

  public add(searchTerm: string | undefined): void {
    if (!searchTerm || searchTerm.length === 0) {
      return;
    }

    // remove duplicates
    let index: number = this._searchHistory.indexOf(searchTerm);
    if (index !== -1) {
      this._searchHistory.splice(index, 1);
    }

    // append to the end
    this._searchHistory.push(searchTerm);

    // resize array if necessary
    if (this._searchHistory.length > configuration.history) {
      this._searchHistory = this._searchHistory.slice(this._searchHistory.length - configuration.history);
    }

    this.save();
  }

  public get(): string[] {
    // resize array if necessary
    if (this._searchHistory.length > configuration.history) {
      this._searchHistory = this._searchHistory.slice(this._searchHistory.length - configuration.history);
    }

    return this._searchHistory;
  }

  public clear() {
    try {
      fs.unlinkSync(this._searchHistoryFilePath);
    } catch (err) {
      logger.warn(`SearchHistory: unable to delete ${this._searchHistoryFilePath}. err=${err}.`);
    }
  }

  public async save(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!fs.existsSync(this._searchHistoryDir)) {
          mkdirp.sync(this._searchHistoryDir, 0o775);
        }
      } catch (err) {
        logger.error(
          `SearchHistory: Failed to create directory. path=${this._searchHistoryDir}. err=${err}.`
        );
        reject(err);
      }

      try {
        fs.writeFileSync(this._searchHistoryFilePath, JSON.stringify(this._searchHistory), 'utf-8');
      } catch (err) {
        logger.error(`SearchHistory: Failed to save history. err=${err}.`);
        reject(err);
      }

      resolve();
    });
  }

  private _loadFromFile() {
    let data = '';

    try {
      data = fs.readFileSync(this._searchHistoryFilePath, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        logger.debug('SearchHistory: History does not exist.');
      } else {
        logger.error(`SearchHistory: Failed to load history. err=${err}.`);
        return;
      }
    }

    if (data.length === 0) {
      return;
    }

    try {
      let parsedData = JSON.parse(data);
      if (!Array.isArray(parsedData)) {
        throw Error('Expected JSON');
      }
      this._searchHistory = parsedData;
    } catch (e) {
      logger.error(`SearchHistory: Deleting corrupted history file. err=${e}.`);
      this.clear();
    }
  }
}
