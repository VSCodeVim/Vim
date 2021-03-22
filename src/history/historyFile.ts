import { Logger } from '../util/logger';
import { configuration } from '../configuration/configuration';
import { Globals } from '../globals';
import { HistoryBase } from 'platform/history';

export class HistoryFile {
  private readonly _logger = Logger.get('HistoryFile');
  private _base: HistoryBase;

  get historyFilePath(): string {
    return this._base.historyKey;
  }

  constructor(historyFileName: string) {
    this._base = new HistoryBase(historyFileName, Globals.extensionStoragePath, this._logger);
  }

  public async add(value: string | undefined): Promise<void> {
    return this._base.add(value, configuration.history);
  }

  public get(): string[] {
    return this._base.get(configuration.history);
  }

  public clear() {
    this._base.clear();
  }

  public async load(): Promise<void> {
    await this._base.load();
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
