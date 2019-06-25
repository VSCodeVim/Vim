import * as vscode from 'vscode';
import { Logger } from './logger';

export class Clipboard {
  private static readonly logger = Logger.get('Clipboard');

  public static async Copy(text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text);
    } catch (e) {
      this.logger.error(e, `Error copying to clipboard. err=${e}`);
    }
  }

  public static async Paste(): Promise<string> {
    return vscode.env.clipboard.readText();
  }
}
