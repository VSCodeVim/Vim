import { logger } from './logger';
import * as clipboardy from 'clipboardy';

export class Clipboard {
  public static Copy(text: string) {
    try {
      clipboardy.writeSync(text);
    } catch (e) {
      logger.error(e, `Clipboard: Error copying to clipboard. err=${e}`);
    }
  }

  public static Paste(): string {
    return clipboardy.readSync();
  }
}
