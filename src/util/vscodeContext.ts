import * as vscode from 'vscode';
import { Logger } from './logger';

type ContextValue = boolean | string;

/**
 * Wrapper around VS Code's `setContext`.
 * The API call takes several milliseconds to seconds to complete,
 * so let's cache the values and only call the API when necessary.
 */
export abstract class VSCodeContext {
  /** The value most recently passed to `set` for each key */
  private static readonly cache: Map<string, ContextValue> = new Map();
  /** For each key whose value is on its way to VS Code, resolves once VS Code has the latest value */
  private static readonly sending: Map<string, Promise<void>> = new Map();

  /**
   * Sets a context key, resolving once VS Code has this value or a later one. While one value is on
   * its way, newer ones wait for it and then only the latest is sent, so keys handled in quick
   * succession (e.g. by a macro) don't each send a value VS Code would replace right away.
   */
  public static async set(key: string, value: ContextValue): Promise<void> {
    if (this.cache.get(key) !== value) {
      Logger.trace(`Setting key='${key}' to value='${value}'`);
      this.cache.set(key, value);
      if (!this.sending.has(key)) {
        this.sending.set(key, this.send(key));
      }
    }
    return this.sending.get(key);
  }

  public static get(key: string): ContextValue | undefined {
    return this.cache.get(key);
  }

  /** Sends the key's latest value to VS Code until VS Code has it */
  private static async send(key: string): Promise<void> {
    try {
      let sent: ContextValue | undefined;
      do {
        sent = this.cache.get(key);
        await vscode.commands.executeCommand('setContext', key, sent);
      } while (this.cache.get(key) !== sent);
    } catch (e) {
      // VS Code may not have the cached value, so make the next `set` send its value
      this.cache.delete(key);
      throw e;
    } finally {
      this.sending.delete(key);
    }
  }
}
