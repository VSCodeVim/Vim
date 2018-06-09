import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';
import { logger } from '../util/logger';

export class CommandLineHistory {
  private _history: string[] = [];
  private _is_loading: boolean = false;
  private _filePath: string = '';

  public add(command: string | undefined): void {
    if (!command || command.length === 0) {
      return;
    }

    let index: number = this._history.indexOf(command);
    if (index !== -1) {
      this._history.splice(index, 1);
    }
    this._history.unshift(command);

    if (this._history.length > configuration.history) {
      this._history.pop();
    }
  }

  public get(): string[] {
    if (this._history.length > configuration.history) {
      // resize history because "vim.history" is updated.
      this._history = this._history.slice(0, configuration.history);
      this.save();
    }

    return this._history;
  }

  public setFilePath(filePath: string): void {
    this._filePath = filePath;
  }

  public async load(): Promise<void> {
    this._history = [];
    this._is_loading = true;

    return new Promise<void>((resolve, reject) => {
      const fs = require('fs');
      fs.readFile(this._filePath, 'utf-8', (err: any, data: string) => {
        this._is_loading = false;

        if (err) {
          if (err.code === 'ENOENT') {
            logger.debug('CommandLineHistory: History does not exist.');
            // add ccommands that were run before history was loaded.
            if (this._history.length > 0) {
              this.save();
            }
            resolve();
          } else {
            logger.error(`CommandLineHistory: Failed to load history. err=${err}.`);
            reject();
          }
          return;
        }

        try {
          let parsedData = JSON.parse(data);
          if (Array.isArray(parsedData)) {
            let not_saved_history: string[] = this._history;
            this._history = parsedData;

            // add ccommands that were run before history was loaded.
            if (not_saved_history.length > 0) {
              for (let cmd of not_saved_history.reverse()) {
                this.add(cmd);
              }
              this.save();
            }
            resolve();
          } else {
            logger.error('CommandLineHistory: The history format is unknown.');
            reject();
          }
        } catch (e) {
          logger.error(`CommandLineHistory: Failed to load history. err=${e}.`);
          reject(e);
        }
      });
    });
  }

  public async save(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._is_loading) {
        logger.debug('CommandLineHistory: Failed to save history because history is loading.');
        resolve();
        return;
      }

      const fs = require('fs');

      fs.writeFile(this._filePath, JSON.stringify(this._history), 'utf-8', (err: Error) => {
        if (!err) {
          resolve();
        } else {
          logger.error(`CommandLineHistory: Failed to save history. err=${err}.`);
          reject();
        }
      });
    });
  }
}
