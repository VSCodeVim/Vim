import { ExtensionContext } from 'vscode';
import { Logger } from '../util/logger';
import { configuration } from '../configuration/configuration';
import { Globals } from '../globals';
import { HistoryBase } from 'platform/history';

export class HistoryFile {
  private readonly logger = Logger.get('HistoryFile');
  private base: HistoryBase;

  get historyFilePath(): string {
    return this.base.historyKey;
  }

  constructor(context: ExtensionContext, historyFileName: string) {
    this.base = new HistoryBase(
      context,
      historyFileName,
      Globals.extensionStoragePath,
      this.logger
    );
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
