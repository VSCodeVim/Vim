import * as assert from 'assert';
import * as sinon from 'sinon';

import * as vscode from 'vscode';
import { HistoryTracker, IMark } from '../src/history/historyTracker';
import { VimState } from '../src/state/vimState';
import { Position } from '../src/common/motion/position';
import { TextEditor } from '../src/textEditor';

suite('historyTracker unit tests', () => {
  let sandbox: sinon.SinonSandbox;
  let historyTracker: HistoryTracker;
  let activeTextEditor: TextEditor;

  const retrieveLocalMark = (markName: string): IMark | undefined =>
    historyTracker.getLocalMarks().find(mark => mark.name === markName);

  const retrieveFileMark = (markName: string): IMark | undefined =>
    historyTracker.getFileMarks().find(mark => mark.name === markName);

  const setupVimState = () => <VimState>(<any>sandbox.createStubInstance(VimState));

  const setupHistoryTracker = (vimState = setupVimState()) => new HistoryTracker(vimState);

  const setupVsCode = () => {
    activeTextEditor = sandbox.createStubInstance<TextEditor>(TextEditor);
    sandbox.stub(vscode, 'window').value({ activeTextEditor });
  };

  const buildMockPosition = (): Position => <any>sandbox.createStubInstance(Position);

  setup(() => {
    sandbox = sinon.createSandbox();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('addMark', () => {
    setup(() => {
      setupVsCode();
      historyTracker = setupHistoryTracker();
    });

    test('can create lowercase mark', () => {
      const position = buildMockPosition();
      historyTracker.addMark(position, 'a');
      const mark = retrieveLocalMark('a');
      assert.notStrictEqual(mark, undefined, 'failed to store lowercase mark');
      if (mark !== undefined) {
        assert.strictEqual(mark.position, position);
        assert.strictEqual(mark.isUppercaseMark, false);
        assert.strictEqual(mark.editor, undefined);
      }
    });

    test('can create uppercase mark', () => {
      const position = buildMockPosition();
      historyTracker.addMark(position, 'A');
      const mark = retrieveFileMark('A');
      assert.notStrictEqual(mark, undefined, 'failed to store file mark');
      if (mark !== undefined) {
        assert.strictEqual(mark.position, position);
        assert.strictEqual(mark.isUppercaseMark, true);
        assert.strictEqual(mark.editor, activeTextEditor);
      }
    });

    test('shares uppercase marks between editor instances', () => {
      const position = buildMockPosition();
      const firstHistoryTrackerInstance = historyTracker;
      const otherHistoryTrackerInstance = setupHistoryTracker(setupVimState());
      assert.notStrictEqual(firstHistoryTrackerInstance, otherHistoryTrackerInstance);
      otherHistoryTrackerInstance.addMark(position, 'A');
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
      otherHistoryTrackerInstance.addMark(position, 'a');
      const mark = retrieveLocalMark('a');
      assert.strictEqual(mark, undefined);
    });
  });
});
