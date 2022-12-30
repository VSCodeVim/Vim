import { ExtensionContext } from 'vscode';
import { configuration } from '../configuration/configuration';
import { Globals } from '../globals';
import { HistoryBase } from 'platform/history';

// TODO(jfields): What's going on here? Just combine HistoryFile and HistoryBase...
export class HistoryFile {
  private base: HistoryBase;

  get historyFilePath(): string {
    return this.base.historyKey;
  }

  constructor(context: ExtensionContext, historyFileName: string) {
    this.base = new HistoryBase(context, historyFileName, Globals.extensionStoragePath);
  }

  public async add(value: string | undefined): Promise<void> {
    return this.base.add(value, configuration.history);
  }

  public get(): string[] {
    return this.base.get(configuration.history);
  }

  public clear() {
    this.base.clear();
  }

  public async load(): Promise<void> {
    await this.base.load();
  }
}

export class SearchHistory extends HistoryFile {
  constructor(context: ExtensionContext) {
    super(context, '.search_history');
  }
}

export class CommandLineHistory extends HistoryFile {
  constructor(context: ExtensionContext) {
    super(context, '.cmdline_history');
  }
}
