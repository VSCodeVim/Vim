import { ModeHandler } from './modeHandler';

class ModeHandlerMapImpl {
  modeHandlerMap: { [key: string]: ModeHandler } = {};

  async getOrCreate(key: string): Promise<[ModeHandler, boolean]> {
    let isNew = false;
    let modeHandler = this.modeHandlerMap[key];
    if (!modeHandler) {
      isNew = true;
      modeHandler = await ModeHandler.Create();
      this.modeHandlerMap[key] = modeHandler;
    }
    return [modeHandler, isNew];
  }

  get(key: string): ModeHandler | null {
    return this.modeHandlerMap[key];
  }

  getKeys(): string[] {
    return Object.keys(this.modeHandlerMap);
  }

  getAll(): ModeHandler[] {
    return this.getKeys().map(key => this.modeHandlerMap[key]);
  }

  delete(key: string) {
    if (key in this.modeHandlerMap) {
      this.modeHandlerMap[key].dispose();
    }

    delete this.modeHandlerMap[key];
  }

  clear() {
    for (const key of Object.keys(this.modeHandlerMap)) {
      this.delete(key);
    }
  }
}

export let ModeHandlerMap = new ModeHandlerMapImpl();
