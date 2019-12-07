import { ModeHandler } from './modeHandler';
import { EditorIdentity } from '../editorIdentity';

/**
 * Stores one ModeHandler (and therefore VimState) per editor.
 */
class ModeHandlerMapImpl {
  private modeHandlerMap = new Map<EditorIdentity, ModeHandler>();

  public async getOrCreate(editorId: EditorIdentity): Promise<[ModeHandler, boolean]> {
    let isNew = false;
    let modeHandler: ModeHandler | undefined;
    for (const [key, value] of this.modeHandlerMap.entries()) {
      if (key.isEqual(editorId)) {
        modeHandler = value;
      }
    }
    if (!modeHandler) {
      isNew = true;
      modeHandler = await ModeHandler.Create();
      this.modeHandlerMap.set(editorId, modeHandler);
    }
    return [modeHandler, isNew];
  }

  public get(editorId: EditorIdentity): ModeHandler | undefined {
    return this.modeHandlerMap.get(editorId);
  }

  public getKeys(): EditorIdentity[] {
    return [...this.modeHandlerMap.keys()];
  }

  public getAll(): ModeHandler[] {
    return [...this.modeHandlerMap.values()];
  }

  public delete(editorId: EditorIdentity) {
    const modeHandler = this.modeHandlerMap.get(editorId);
    if (modeHandler) {
      modeHandler.dispose();
      this.modeHandlerMap.delete(editorId);
    }
  }

  public clear() {
    for (const key of this.modeHandlerMap.keys()) {
      this.delete(key);
    }
  }
}

export let ModeHandlerMap = new ModeHandlerMapImpl();
