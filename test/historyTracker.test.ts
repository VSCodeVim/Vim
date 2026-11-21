import * as assert from 'assert';
import * as sinon from 'sinon';
import vscode, { Position } from 'vscode';

import { HistoryTracker, ILocalMark, IMark } from '../src/history/historyTracker';
import { Jump } from '../src/jumps/jump';
import { Mode } from '../src/mode/mode';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { globalState } from '../src/state/globalState';
import { VimState } from '../src/state/vimState';
import { StatusBar } from '../src/statusBar';

suite('historyTracker unit tests', () => {
  let sandbox: sinon.SinonSandbox;
  let historyTracker: HistoryTracker;
  const document = { fileName: 'file name' } as vscode.TextDocument;

  const retrieveLocalMark = (markName: string): ILocalMark | undefined =>
    historyTracker.getLocalMarks().find((mark) => mark.name === markName);

  const retrieveFileMark = (markName: string): IMark | undefined =>
    historyTracker.getGlobalMarks().find((mark) => mark.name === markName);

  const setupVimState = () => sandbox.createStubInstance(VimState) as unknown as VimState;

  const setupHistoryTracker = (vimState = setupVimState()) => new HistoryTracker(vimState);

  const buildMockPosition = (): Position => sandbox.createStubInstance(Position);

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('addMark', () => {
    setup(() => {
      historyTracker = setupHistoryTracker();
    });

    test('can set previous context mark from single quote', () => {
      const spy = sandbox.spy(globalState.jumpTracker, 'recordJump');
      const position = buildMockPosition();
      const mockJump = new Jump({
        document,
        position,
      });
      sandbox.stub(Jump, 'fromStateNow').returns(mockJump);

      historyTracker.addMark(document, position, "'");

      sinon.assert.calledWith(spy, mockJump);
    });
    test('can set previous context mark from backtick', () => {
      const spy = sandbox.spy(globalState.jumpTracker, 'recordJump');
      const position = buildMockPosition();
      const mockJump = new Jump({
        document,
        position,
      });
      sandbox.stub(Jump, 'fromStateNow').returns(mockJump);

      historyTracker.addMark(document, position, '`');

      sinon.assert.calledWith(spy, mockJump);
    });

    test('can create lowercase mark', () => {
      const position = buildMockPosition();
      historyTracker.addMark(document, position, 'a');
      const mark = retrieveLocalMark('a');
      assert.notStrictEqual(mark, undefined, 'failed to store lowercase mark');
      if (mark !== undefined) {
        assert.strictEqual(mark.position, position);
        assert.strictEqual(mark.isUppercaseMark, false);
      }
    });

    test('can create uppercase mark', () => {
      const position = buildMockPosition();
      historyTracker.addMark(document, position, 'A');
      const mark = retrieveFileMark('A');
      assert.notStrictEqual(mark, undefined, 'failed to store file mark');
      if (mark !== undefined) {
        assert.strictEqual(mark.position, position);
        assert.strictEqual(mark.isUppercaseMark, true);
        assert.strictEqual(mark.document, document);
      }
    });

    test('shares uppercase marks between editor instances', () => {
      const position = buildMockPosition();
      const firstHistoryTrackerInstance = historyTracker;
      const otherHistoryTrackerInstance = setupHistoryTracker(setupVimState());
      assert.notStrictEqual(firstHistoryTrackerInstance, otherHistoryTrackerInstance);
      otherHistoryTrackerInstance.addMark(document, position, 'A');
      const mark = retrieveFileMark('A');
      assert.notStrictEqual(mark, undefined);
      if (mark !== undefined) {
        assert.strictEqual(position, mark.position);
      }
    });

    test('does not share lower marks between editor instances', () => {
      const position = buildMockPosition();
      const firstHistoryTrackerInstance = historyTracker;
      const otherHistoryTrackerInstance = setupHistoryTracker(setupVimState());
      assert.notStrictEqual(firstHistoryTrackerInstance, otherHistoryTrackerInstance);
      otherHistoryTrackerInstance.addMark(document, position, 'a');
      const mark = retrieveLocalMark('a');
      assert.strictEqual(mark, undefined);
    });
  });

  suite('removeLocalMarks', () => {
    setup(() => {
      historyTracker = setupHistoryTracker();
    });

    test('removes only local marks', () => {
      const position = buildMockPosition();
      historyTracker.addMark(document, position, 'a');
      historyTracker.addMark(document, position, 'A');
      const mark = historyTracker.getMark('A');

      historyTracker.removeLocalMarks();

      assert.strictEqual(historyTracker.getMark('a'), undefined);
      assert.strictEqual(historyTracker.getMark('A'), mark);
    });
  });

  suite('removeMarks', () => {
    setup(() => {
      historyTracker = setupHistoryTracker();
    });

    test('removes multiple local and global', () => {
      const position = buildMockPosition();
      const markTargets = 'AHZced'.split('');

      markTargets.forEach((m) => historyTracker.addMark(document, position, m));

      historyTracker.removeMarks(markTargets);

      markTargets.forEach((m) => assert.strictEqual(historyTracker.getMark(m), undefined));
    });

    test("does not remove ''", () => {
      const position = buildMockPosition();
      historyTracker.addMark(document, position, '');
      const mark = historyTracker.getMark('');

      historyTracker.removeMarks(['']);

      assert.strictEqual(mark, historyTracker.getMark(''));
    });

    test('does nothing on empty', () => {
      const position = buildMockPosition();
      historyTracker.addMark(document, position, 'a');
      const mark = historyTracker.getMark('a');

      historyTracker.removeMarks([]);

      assert.strictEqual(mark, historyTracker.getMark('a'));
    });
  });
});

suite('historyTracker undo/redo integrity (#2007)', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(StatusBar, 'setText');
  });

  teardown(async () => {
    sandbox.restore();
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  const openUntitled = async (
    content: string,
  ): Promise<{ document: vscode.TextDocument; editor: vscode.TextEditor }> => {
    const document = await vscode.workspace.openTextDocument({ content });
    const editor = await vscode.window.showTextDocument(document);
    return { document, editor };
  };

  const setupTracker = (
    editor: vscode.TextEditor,
  ): { vimState: VimState; historyTracker: HistoryTracker } => {
    const vimState = sandbox.createStubInstance(VimState) as unknown as VimState;
    vimState.editor = editor;
    vimState.modeData = { mode: Mode.Normal };
    return { vimState, historyTracker: new HistoryTracker(vimState) };
  };

  const applyEdit = async (
    editor: vscode.TextEditor,
    range: vscode.Range,
    text: string,
  ): Promise<void> => {
    assert.ok(await editor.edit((builder) => builder.replace(range, text)), 'Edit failed');
  };

  const R = (startLine: number, startChar: number, endLine: number, endChar: number) =>
    new vscode.Range(new Position(startLine, startChar), new Position(endLine, endChar));

  /** Records one finished step from a list of sequential edits (macro-like accumulation). */
  const recordStep = async (
    historyTracker: HistoryTracker,
    editor: vscode.TextEditor,
    edits: Array<[vscode.Range, string]>,
  ): Promise<void> => {
    for (const [range, text] of edits) {
      await applyEdit(editor, range, text);
      historyTracker.addChange();
    }
    historyTracker.finishCurrentStep();
  };

  const assertRoundTrip = async (
    historyTracker: HistoryTracker,
    editor: vscode.TextEditor,
    initial: string,
    current: string,
  ): Promise<void> => {
    assert.strictEqual(editor.document.getText(), current);
    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), initial, 'undo did not restore the initial text');
    await historyTracker.goForwardHistoryStep();
    assert.strictEqual(editor.document.getText(), current, 'redo did not restore the edited text');
  };

  test('records a single edit and round-trips it', async () => {
    const { editor } = await openUntitled('hello');
    const { historyTracker } = setupTracker(editor);

    await applyEdit(editor, R(0, 1, 0, 4), 'i');
    assert.strictEqual(historyTracker.addChange(), true);
    historyTracker.finishCurrentStep();

    await assertRoundTrip(historyTracker, editor, 'hello', 'hio');
  });

  test('merges a cw-like delete plus adjacent insert into one undoable step', async () => {
    const { editor } = await openUntitled('foo bar');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, [
      [R(0, 0, 0, 3), ''],
      [R(0, 0, 0, 0), 'XYZ'],
    ]);

    await assertRoundTrip(historyTracker, editor, 'foo bar', 'XYZ bar');
  });

  test('round-trips a deletion strictly inside a previous insertion', async () => {
    const { editor } = await openUntitled('12');
    const { historyTracker } = setupTracker(editor);

    // The old merge recorded 'abc' here, corrupting the redo into '1abc2'.
    await recordStep(historyTracker, editor, [
      [R(0, 1, 0, 1), 'abcdef'],
      [R(0, 3, 0, 6), ''],
    ]);

    await assertRoundTrip(historyTracker, editor, '12', '1abf2');
  });

  test('round-trips an insertion inside a previous insertion', async () => {
    const { editor } = await openUntitled('12');
    const { historyTracker } = setupTracker(editor);

    // The old merge recorded 'ABCXY' here, corrupting the redo into '1ABCXY2'.
    await recordStep(historyTracker, editor, [
      [R(0, 1, 0, 1), 'ABC'],
      [R(0, 2, 0, 2), 'XY'],
    ]);

    await assertRoundTrip(historyTracker, editor, '12', '1AXYBC2');
  });

  test('round-trips an insertion followed by a superset deletion', async () => {
    const { editor } = await openUntitled('12');
    const { historyTracker } = setupTracker(editor);

    // The old merge recorded an invalid range here, corrupting both undo and redo.
    await recordStep(historyTracker, editor, [
      [R(0, 1, 0, 1), 'ABC'],
      [R(0, 0, 0, 5), ''],
    ]);

    await assertRoundTrip(historyTracker, editor, '12', '');
  });

  test('round-trips sequential inserts at the same position in order', async () => {
    const { editor } = await openUntitled('ab');
    const { historyTracker } = setupTracker(editor);

    // The old merge recorded 'XY' here, corrupting the redo into 'aXYb'.
    await recordStep(historyTracker, editor, [
      [R(0, 1, 0, 1), 'X'],
      [R(0, 1, 0, 1), 'Y'],
    ]);

    await assertRoundTrip(historyTracker, editor, 'ab', 'aYXb');
  });

  test('round-trips a longer chain of overlapping changes', async () => {
    const { editor } = await openUntitled('abcdef');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, [
      [R(0, 2, 0, 2), 'XX'],
      [R(0, 3, 0, 5), ''],
      [R(0, 1, 0, 2), 'ZZ'],
    ]);

    await assertRoundTrip(historyTracker, editor, 'abcdef', 'aZZXdef');
  });

  test('U undoes only the most recently changed line', async () => {
    const { editor } = await openUntitled('aaa\nbbb');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, [[R(0, 0, 0, 3), 'XXX']]);
    await recordStep(historyTracker, editor, [[R(1, 0, 1, 3), 'YYY']]);
    assert.strictEqual(editor.document.getText(), 'XXX\nYYY');

    await historyTracker.goBackHistoryStepsOnLine();
    assert.strictEqual(editor.document.getText(), 'XXX\nbbb');

    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), 'XXX\nYYY');
  });

  test('U followed by u round-trips a merged multi-change step', async () => {
    const { editor } = await openUntitled('12');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, [
      [R(0, 1, 0, 1), 'ABC'],
      [R(0, 2, 0, 2), 'XY'],
    ]);
    assert.strictEqual(editor.document.getText(), '1AXYBC2');

    await historyTracker.goBackHistoryStepsOnLine();
    assert.strictEqual(editor.document.getText(), '12');

    // The old merge corrupted this redo into '1ABCXY2'.
    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), '1AXYBC2');
  });
});

suite('historyTracker native undo/redo mirroring (#2007)', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(StatusBar, 'setText');
  });

  teardown(async () => {
    sandbox.restore();
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  const openUntitled = async (content: string): Promise<vscode.TextEditor> => {
    const document = await vscode.workspace.openTextDocument({ content });
    return vscode.window.showTextDocument(document);
  };

  const setupTracker = (
    editor: vscode.TextEditor,
  ): { vimState: VimState; historyTracker: HistoryTracker } => {
    const vimState = sandbox.createStubInstance(VimState) as unknown as VimState;
    vimState.editor = editor;
    vimState.modeData = { mode: Mode.Normal };
    return { vimState, historyTracker: new HistoryTracker(vimState) };
  };

  const applyEdit = async (
    editor: vscode.TextEditor,
    range: vscode.Range,
    text: string,
  ): Promise<void> => {
    assert.ok(await editor.edit((builder) => builder.replace(range, text)), 'Edit failed');
  };

  const R = (startLine: number, startChar: number, endLine: number, endChar: number) =>
    new vscode.Range(new Position(startLine, startChar), new Position(endLine, endChar));

  const recordStep = async (
    historyTracker: HistoryTracker,
    editor: vscode.TextEditor,
    range: vscode.Range,
    text: string,
  ): Promise<void> => {
    await applyEdit(editor, range, text);
    assert.strictEqual(historyTracker.addChange(), true);
    historyTracker.finishCurrentStep();
  };

  test('mirrors a native undo of the tip step instead of recording it', async () => {
    const editor = await openUntitled('ab');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, R(0, 1, 0, 1), 'X');
    await recordStep(historyTracker, editor, R(0, 2, 0, 2), 'Y');
    assert.strictEqual(editor.document.getText(), 'aXYb');

    await vscode.commands.executeCommand('undo');
    assert.strictEqual(editor.document.getText(), 'aXb');
    historyTracker.noteNativeUndoRedo(vscode.TextDocumentChangeReason.Undo);

    // Mirrored: no new step is recorded ...
    assert.strictEqual(historyTracker.addChange(), false);

    // ... so the next `u` undoes the older step instead of re-doing the undone one.
    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), 'ab');
  });

  test('mirrors consecutive native undos', async () => {
    const editor = await openUntitled('ab');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, R(0, 1, 0, 1), 'X');
    await recordStep(historyTracker, editor, R(0, 2, 0, 2), 'Y');
    await recordStep(historyTracker, editor, R(0, 3, 0, 3), 'Z');
    assert.strictEqual(editor.document.getText(), 'aXYZb');

    await vscode.commands.executeCommand('undo');
    historyTracker.noteNativeUndoRedo(vscode.TextDocumentChangeReason.Undo);
    await vscode.commands.executeCommand('undo');
    historyTracker.noteNativeUndoRedo(vscode.TextDocumentChangeReason.Undo);
    assert.strictEqual(editor.document.getText(), 'aXb');

    assert.strictEqual(historyTracker.addChange(), false);

    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), 'ab');
  });

  test('mirrors a native redo after a mirrored native undo', async () => {
    const editor = await openUntitled('ab');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, R(0, 1, 0, 1), 'X');
    await recordStep(historyTracker, editor, R(0, 2, 0, 2), 'Y');

    await vscode.commands.executeCommand('undo');
    historyTracker.noteNativeUndoRedo(vscode.TextDocumentChangeReason.Undo);
    assert.strictEqual(historyTracker.addChange(), false);

    await vscode.commands.executeCommand('redo');
    historyTracker.noteNativeUndoRedo(vscode.TextDocumentChangeReason.Redo);
    assert.strictEqual(editor.document.getText(), 'aXYb');
    assert.strictEqual(historyTracker.addChange(), false);

    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), 'aXb');
  });

  test('falls back to recording when native undo is mixed with new edits', async () => {
    const editor = await openUntitled('ab');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, R(0, 1, 0, 1), 'X');
    assert.strictEqual(editor.document.getText(), 'aXb');

    await vscode.commands.executeCommand('undo');
    historyTracker.noteNativeUndoRedo(vscode.TextDocumentChangeReason.Undo);
    await applyEdit(editor, R(0, 0, 0, 0), 'Q');
    assert.strictEqual(editor.document.getText(), 'Qab');

    // Not exactly our tip step being undone: record the net diff as before.
    assert.strictEqual(historyTracker.addChange(), true);
    historyTracker.finishCurrentStep();

    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), 'aXb');
  });

  test('falls back to recording when the stack cannot explain the native undo', async () => {
    const editor = await openUntitled('ab');
    const { historyTracker } = setupTracker(editor);

    // Edits the tracker never recorded (empty stack).
    await applyEdit(editor, R(0, 1, 0, 1), 'X');
    await applyEdit(editor, R(0, 2, 0, 2), 'Y');
    await vscode.commands.executeCommand('undo');
    historyTracker.noteNativeUndoRedo(vscode.TextDocumentChangeReason.Undo);
    assert.strictEqual(editor.document.getText(), 'aXb');

    assert.strictEqual(historyTracker.addChange(), true);
    historyTracker.finishCurrentStep();

    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), 'ab');
  });

  test('ignores changes without a native undo/redo reason', async () => {
    const editor = await openUntitled('ab');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, R(0, 1, 0, 1), 'X');

    historyTracker.noteNativeUndoRedo(undefined);
    await applyEdit(editor, R(0, 2, 0, 2), 'Y');
    assert.strictEqual(historyTracker.addChange(), true);
    historyTracker.finishCurrentStep();

    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), 'aXb');
  });

  test('falls back to recording when the latch overflows', async () => {
    const editor = await openUntitled('ab');
    const { historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, R(0, 1, 0, 1), 'X');

    for (let i = 0; i < 105; i++) {
      historyTracker.noteNativeUndoRedo(vscode.TextDocumentChangeReason.Undo);
    }
    await vscode.commands.executeCommand('undo');
    assert.strictEqual(editor.document.getText(), 'ab');

    // The sequence is no longer trusted: record instead of mirroring.
    assert.strictEqual(historyTracker.addChange(), true);
    historyTracker.finishCurrentStep();

    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), 'aXb');
  });

  test('defers the latch through insert mode and mirrors on flush', async () => {
    const editor = await openUntitled('ab');
    const { vimState, historyTracker } = setupTracker(editor);

    await recordStep(historyTracker, editor, R(0, 1, 0, 1), 'X');

    vimState.modeData = { mode: Mode.Insert, highSurrogate: undefined };
    await vscode.commands.executeCommand('undo');
    historyTracker.noteNativeUndoRedo(vscode.TextDocumentChangeReason.Undo);
    assert.strictEqual(editor.document.getText(), 'ab');
    assert.strictEqual(historyTracker.addChange(), false);

    vimState.modeData = { mode: Mode.Normal };
    assert.strictEqual(historyTracker.addChange(), false);

    // Mirrored onto the stack: nothing left to undo.
    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editor.document.getText(), 'ab');
  });

  test('syncs the version when the text is unchanged', async () => {
    const editor = await openUntitled('ab');
    const { historyTracker } = setupTracker(editor);

    // Bump the version twice with no net text change.
    await applyEdit(editor, R(0, 1, 0, 1), 'X');
    await vscode.commands.executeCommand('undo');
    assert.strictEqual(editor.document.getText(), 'ab');

    assert.strictEqual(historyTracker.addChange(), false);
    const synced = historyTracker as unknown as {
      previousDocumentState: { versionNumber: number };
    };
    assert.strictEqual(synced.previousDocumentState.versionNumber, editor.document.version);
  });

  test('wires native undo through the real onDidChangeTextDocument listener', async () => {
    const document = await vscode.workspace.openTextDocument({ content: 'ab' });
    const editor = await vscode.window.showTextDocument(document);
    const [modeHandler] = await ModeHandlerMap.getOrCreate(editor);
    try {
      const historyTracker = modeHandler.vimState.historyTracker;

      await applyEdit(editor, R(0, 1, 0, 1), 'X');
      assert.strictEqual(historyTracker.addChange(), true);
      historyTracker.finishCurrentStep();
      await applyEdit(editor, R(0, 2, 0, 2), 'Y');
      assert.strictEqual(historyTracker.addChange(), true);
      historyTracker.finishCurrentStep();
      assert.strictEqual(editor.document.getText(), 'aXYb');

      // No direct latch call: the extension's listener must observe `reason === Undo`.
      await vscode.commands.executeCommand('undo');
      assert.strictEqual(editor.document.getText(), 'aXb');
      assert.strictEqual(historyTracker.addChange(), false);

      await historyTracker.goBackHistoryStep();
      assert.strictEqual(editor.document.getText(), 'ab');
    } finally {
      ModeHandlerMap.delete(document.uri);
    }
  });
});

suite('historyTracker document identity (#2007)', () => {
  let sandbox: sinon.SinonSandbox;

  setup(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(StatusBar, 'setText');
  });

  teardown(async () => {
    sandbox.restore();
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  const openUntitled = async (content: string): Promise<vscode.TextEditor> => {
    const document = await vscode.workspace.openTextDocument({ content });
    return vscode.window.showTextDocument(document);
  };

  const applyEdit = async (
    editor: vscode.TextEditor,
    range: vscode.Range,
    text: string,
  ): Promise<void> => {
    assert.ok(await editor.edit((builder) => builder.replace(range, text)), 'Edit failed');
  };

  const R = (startLine: number, startChar: number, endLine: number, endChar: number) =>
    new vscode.Range(new Position(startLine, startChar), new Position(endLine, endChar));

  test('keeps history when rebound to a document with identical text', async () => {
    const editorA = await openUntitled('ab');
    const vimState = sandbox.createStubInstance(VimState) as unknown as VimState;
    vimState.editor = editorA;
    vimState.modeData = { mode: Mode.Normal };
    const historyTracker = new HistoryTracker(vimState);

    await applyEdit(editorA, R(0, 1, 0, 1), 'X');
    assert.strictEqual(historyTracker.addChange(), true);
    historyTracker.finishCurrentStep();
    assert.strictEqual(editorA.document.getText(), 'aXb');

    const editorB = await openUntitled('aXb');
    vimState.editor = editorB;
    assert.strictEqual(historyTracker.addChange(), false);

    // Identical geometry: the recorded step still applies.
    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editorB.document.getText(), 'ab');
  });

  test('resets history instead of diffing across documents', async () => {
    const editorA = await openUntitled('aaa');
    const vimState = sandbox.createStubInstance(VimState) as unknown as VimState;
    vimState.editor = editorA;
    vimState.modeData = { mode: Mode.Normal };
    const historyTracker = new HistoryTracker(vimState);

    await applyEdit(editorA, R(0, 0, 0, 3), 'XXX');
    assert.strictEqual(historyTracker.addChange(), true);
    historyTracker.finishCurrentStep();

    const editorB = await openUntitled('hello world');
    vimState.editor = editorB;

    // Must not record a delete-everything/insert-everything step ...
    assert.strictEqual(historyTracker.addChange(), false);

    // ... so there is nothing to undo and the other file is untouched.
    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editorB.document.getText(), 'hello world');

    // And fresh history works from the new baseline.
    await applyEdit(editorB, R(0, 5, 0, 11), '!');
    assert.strictEqual(historyTracker.addChange(), true);
    historyTracker.finishCurrentStep();
    await historyTracker.goBackHistoryStep();
    assert.strictEqual(editorB.document.getText(), 'hello world');
  });
});

class TextEditorStub implements vscode.TextEditor {
  readonly document!: vscode.TextDocument;
  selection!: vscode.Selection;
  selections!: vscode.Selection[];
  readonly visibleRanges!: vscode.Range[];
  options!: vscode.TextEditorOptions;
  readonly viewColumn!: vscode.ViewColumn;

  constructor() {
    // NoOp
  }
  async edit(
    callback: (editBuilder: vscode.TextEditorEdit) => void,
    options?: { undoStopBefore: boolean; undoStopAfter: boolean },
  ) {
    return true;
  }
  async insertSnippet(
    snippet: vscode.SnippetString,
    location?: vscode.Position | vscode.Range | readonly Position[] | readonly vscode.Range[],
    options?: { undoStopBefore: boolean; undoStopAfter: boolean },
  ) {
    return true;
  }
  setDecorations(
    decorationType: vscode.TextEditorDecorationType,
    rangesOrOptions: vscode.Range[] | vscode.DecorationOptions[],
  ) {
    // NoOp
  }
  revealRange(range: vscode.Range, revealType?: vscode.TextEditorRevealType) {
    // NoOp
  }
  show(column?: vscode.ViewColumn) {
    // NoOp
  }
  hide() {
    // NoOp
  }
}
