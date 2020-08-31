import * as vscode from 'vscode';
import { ILogger } from '../common/logger';

export class HistoryBase {
  private _historyFileName: string;
  private _history: string[] = [];
  get historyKey(): string {
    return `vim.${this._historyFileName}`;
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
    this._context = context;
    this._historyFileName = historyFileName;
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

  public async clear() {
    this._context.workspaceState.update(this.historyKey, undefined);
    this._history = [];
  }

  public async load(): Promise<void> {
    let data = this._context.workspaceState.get<string>(this.historyKey) || '';
    if (data.length === 0) {
      return;
    }

    let parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData)) {
      throw Error('Unexpected format in history. Expected JSON.');
    }
    this._history = parsedData;
  }

  async save(): Promise<void> {
    this._context.workspaceState.update(this.historyKey, JSON.stringify(this._history));
  }
}
