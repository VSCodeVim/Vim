import * as vscode from 'vscode';
import { Logger } from '../util/logger';
import { configuration } from '../configuration/configuration';

export class HistoryFile {
  private readonly _logger = Logger.get('HistoryFile');
  private _historyFileName: string;
  private _history: string[] = [];

  private get historyKey(): string {
    return `vim.${this._historyFileName}`;
  }

  constructor(private _context: vscode.ExtensionContext, historyFileName: string) {
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

  public async clear() {
    this._context.workspaceState.update(this.historyKey, undefined);
    this._history = [];
  }

  public async load(): Promise<void> {
    let data = this._context.workspaceState.get<string>(this.historyKey) || '';
    if (data.length === 0) {
      return;
    }

    try {
      let parsedData = JSON.parse(data);
      if (!Array.isArray(parsedData)) {
        throw Error('Unexpected format in history. Expected JSON.');
      }
      this._history = parsedData;
    } catch (e) {
      this._logger.warn(`Deleting corrupted history. key=${this.historyKey} err=${e}.`);
      await this.clear();
    }
  }

  private async save(): Promise<void> {
    this._context.workspaceState.update(this.historyKey, JSON.stringify(this._history));
  }
}

export class SearchHistory extends HistoryFile {
  constructor(context: vscode.ExtensionContext) {
    super(context, 'search_history');
  }
}

export class CommandLineHistory extends HistoryFile {
  constructor(context: vscode.ExtensionContext) {
    super(context, 'cmdline_history');
  }
}
