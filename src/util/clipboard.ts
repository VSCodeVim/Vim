import { logger } from './logger';
import * as vscode from 'vscode';

export class Clipboard {
  public static async Copy(text: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(text);
    } catch (e) {
      logger.error(e, `Clipboard: Error copying to clipboard. err=${e}`);
    }
  }

  public static Paste(): Thenable<string> {
    return vscode.env.clipboard.readText();
  }
}
