import * as assert from 'assert';
import { window, workspace } from 'vscode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { ModeHandlerMap } from '../../src/mode/modeHandlerMap';

suite('ModeHandler', () => {
  setup(() => {
    ModeHandlerMap.clear();
  });

  teardown(() => {
    ModeHandlerMap.clear();
  });

  test('ModeHandlerMap', async () => {
    let isNew: boolean;

    assert.deepStrictEqual([...ModeHandlerMap.entries()], []);

    const document1 = await workspace.openTextDocument({ content: 'document1' });
    const editor1 = await window.showTextDocument(document1);

    let modeHandler1: ModeHandler;
    {
      [modeHandler1, isNew] = await ModeHandlerMap.getOrCreate(editor1);
      assert.strictEqual(isNew, true);
      assert.notStrictEqual(modeHandler1, undefined);
      assert.deepStrictEqual(
        new Set(ModeHandlerMap.entries()),
        new Set([[document1.uri, modeHandler1]])
      );
    }

    const document2 = await workspace.openTextDocument({ content: 'document2' });
    const editor2 = await window.showTextDocument(document2);

    let modeHandler2: ModeHandler;
    {
      [modeHandler2, isNew] = await ModeHandlerMap.getOrCreate(editor2);
      assert.strictEqual(isNew, true);
      assert.notStrictEqual(modeHandler2, undefined);
      assert.notStrictEqual(modeHandler1, modeHandler2);
      assert.deepStrictEqual(
        new Set(ModeHandlerMap.entries()),
        new Set([
          [document1.uri, modeHandler1],
          [document2.uri, modeHandler2],
        ])
      );
    }

    // TODO: test closing editor, opening another for same document
    // TODO: test delete
  });
});
