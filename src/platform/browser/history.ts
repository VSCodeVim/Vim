import * as vscode from 'vscode';

export class HistoryBase {
  private readonly context: vscode.ExtensionContext;
  private readonly historyFileName: string;
  private history: string[] = [];

  get historyKey(): string {
    return `vim.${this.historyFileName}`;
  }

  constructor(
    context: vscode.ExtensionContext,
    historyFileName: string,
    extensionStoragePath: string,
  ) {
    this.context = context;
    this.historyFileName = historyFileName;
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

  public async clear() {
    void this.context.workspaceState.update(this.historyKey, undefined);
    this.history = [];
  }

  public async load(): Promise<void> {
    const data = this.context.workspaceState.get<string>(this.historyKey) || '';
    if (data.length === 0) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData)) {
      throw Error('Unexpected format in history. Expected JSON.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.history = parsedData;
  }

  async save(): Promise<void> {
    void this.context.workspaceState.update(this.historyKey, JSON.stringify(this.history));
  }
}
