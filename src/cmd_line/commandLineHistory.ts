import * as vscode from 'vscode';

import { configuration } from '../configuration/configuration';

export class CommandLineHistory {
  private _history: string[] = [];
  private _is_loaded: boolean = false;
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

  public load(): void {
    const fs = require('fs');

    fs.readFile(this._filePath, 'utf-8', (err: Error, data: string) => {
      this._is_loaded = true;

      if (err) {
        console.log(err);

        // add ccommands that were run before history was loaded.
        if (this._history.length > 0) {
          this.save();
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
        } else {
          console.log('CommandLine: Failed to load history.');
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  public save(): void {
    if (!this._is_loaded) {
      console.log('CommandLine: Failed to save history because history is unloaded.');
      return;
    }

    const fs = require('fs');

    fs.writeFile(this._filePath, JSON.stringify(this._history), 'utf-8', (err: Error) => {
      if (err) {
        console.log(err);
      }
    });
  }
}
