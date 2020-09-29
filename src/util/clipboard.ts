import * as vscode from 'vscode';
import { Logger } from './logger';

/**
 * A thin wrapper around `vscode.env.clipboard`
 */
export class Clipboard {
  private static readonly logger = Logger.get('Clipboard');

  public static async Copy(text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text);
    } catch (e) {
      this.logger.error(`Error copying to clipboard. err=${e}`);
    }
  }

  public static async Paste(): Promise<string> {
    return vscode.env.clipboard.readText();
  }
}
