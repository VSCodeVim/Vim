import * as vscode from 'vscode';
import { EditorIdentity } from '../editorIdentity';
import { ModeHandler } from './modeHandler';

class ModeHandlerMapImpl {
  modeHandlerMap: { [key: string]: ModeHandler } = {};

  async getOrCreate(key: string): Promise<[ModeHandler, boolean]> {
    let isNew = false;
    let modeHandler = this.modeHandlerMap[key];
    if (!modeHandler) {
      isNew = true;
      modeHandler = await new ModeHandler();
      this.modeHandlerMap[key] = modeHandler;
    }
    return [modeHandler, isNew];
  }

  getKeys(): string[] {
    return Object.keys(this.modeHandlerMap);
  }

  getAll(): ModeHandler[] {
    return this.getKeys().map(key => this.modeHandlerMap[key]);
  }

  delete(key: string) {
    delete this.modeHandlerMap[key];
  }

  clear() {
    this.modeHandlerMap = {};
  }
}

export let ModeHandlerMap = new ModeHandlerMapImpl();
