import { TextEditor, Uri } from 'vscode';
import { ModeHandler } from './modeHandler';

/**
 * Stores one ModeHandler (and therefore VimState) per TextDocument.
 */
class ModeHandlerMapImpl {
  private modeHandlerMap = new Map<Uri, ModeHandler>();

  public async getOrCreate(editor: TextEditor): Promise<[ModeHandler, boolean]> {
    const editorId = editor.document.uri;

    let isNew = false;
    let modeHandler: ModeHandler | undefined = this.get(editorId);

    if (!modeHandler) {
      isNew = true;
      modeHandler = await ModeHandler.create(this, editor);
      this.modeHandlerMap.set(editorId, modeHandler);
    }
    return [modeHandler, isNew];
  }

  public get(uri: Uri): ModeHandler | undefined {
    return this.modeHandlerMap.get(uri);
  }

  public entries(): IterableIterator<[Uri, ModeHandler]> {
    return this.modeHandlerMap.entries();
  }

  public delete(editorId: Uri) {
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

export const ModeHandlerMap = new ModeHandlerMapImpl();
