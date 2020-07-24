import * as assert from 'assert';
import * as vscode from 'vscode';
import { getAndUpdateModeHandler } from './../extension';
import { TextEditor } from './../src/textEditor';
import { ModeHandler } from './../src/mode/modeHandler';
import { getTestingFunctions } from './testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

suite('Marks', () => {
  let modeHandler: ModeHandler;
  const { newTest } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  const jumpToNewFile = async () => {
    await setupWorkspace();
    return getAndUpdateModeHandler();
  };

  const initTextAndCursor = async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iLorem Ipsum is\nthe dummy text\nof the industry'.split('')
    );
    await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/dummy\n'.split('')]);
  };

  const getMarkTypeText = (isLowercaseMark: boolean): string => {
    return isLowercaseMark ? 'local' : 'global';
  };

  const testCreateDeleteMark = (isLowercaseMark: boolean) => {
    const markName = isLowercaseMark ? 'a' : 'A';
    return test(
      'Can create and delete a ' +
        getMarkTypeText(isLowercaseMark) +
        ' mark if the line containing it is deleted',
      async () => {
        await initTextAndCursor();
        await modeHandler.handleMultipleKeyEvents(['m', markName]);
        let mark = modeHandler.vimState.historyTracker.getMark(markName);
        assert.notStrictEqual(
          mark,
          undefined,
          'failed to store ' + getMarkTypeText(isLowercaseMark) + ' mark'
        );
        assert.strictEqual(mark.position.line, 1);
        assert.strictEqual(mark.position.character, 4);
        assert.strictEqual(mark.isUppercaseMark, !isLowercaseMark);
        assert.strictEqual(
          mark.editor,
          isLowercaseMark ? undefined : vscode.window.activeTextEditor
        );
        await modeHandler.handleMultipleKeyEvents('dd'.split(''));
        mark = modeHandler.vimState.historyTracker.getMark(markName);
        assert.strictEqual(mark, undefined, 'failed to delete mark');
      }
    );
  };

  testCreateDeleteMark(true);
  testCreateDeleteMark(false);

  newTest({
    title: 'Can jump to local mark',
    start: ['|hello world and mars'],
    keysPressed: 'wma2w`a',
    end: ['hello |world and mars'],
  });

  test('Does not share local marks with another file', async () => {
    await initTextAndCursor();
    await modeHandler.handleMultipleKeyEvents(['m', 'a']);
    const firstDocumentName = TextEditor.getDocumentName();

    const otherModeHandler = await jumpToNewFile();
    const otherDocumentName = TextEditor.getDocumentName();
    assert.notStrictEqual(firstDocumentName, otherDocumentName);
    const mark = otherModeHandler.vimState.historyTracker.getMark('a');
    assert.strictEqual(mark, undefined, 'local marks are shared between files');
  });

  test('Can jump to global mark in another file', async () => {
    await initTextAndCursor();
    await modeHandler.handleMultipleKeyEvents(['m', 'A', 'k', '0']);
    const firstDocumentName = TextEditor.getDocumentName();

    const otherModeHandler = await jumpToNewFile();
    const otherDocumentName = TextEditor.getDocumentName();
    assert.notStrictEqual(firstDocumentName, otherDocumentName);

    await otherModeHandler.handleMultipleKeyEvents('`A'.split(''));
    assert.strictEqual(TextEditor.getDocumentName(), firstDocumentName);

    const cursorPosition = TextEditor.getSelection().start;
    assert.strictEqual(cursorPosition.line, 1);
    assert.strictEqual(cursorPosition.character, 4);
  });

  const testInsertNewLine = (isLowercaseMark: boolean) => {
    const mark = isLowercaseMark ? 'a' : 'A';
    return newTest({
      title: 'Insert a new line before ' + getMarkTypeText(isLowercaseMark) + ' mark',
      start: ['Lorem Ipsum is', '    the dummy text', '    of |the industry'],
      keysPressed: 'm' + mark + 'O<Esc>`' + mark,
      end: ['Lorem Ipsum is', '    the dummy text', '    ', '    of |the industry'],
    });
  };

  testInsertNewLine(true);
  testInsertNewLine(false);

  const testInsertLinebreakBefore = (isLowercaseMark: boolean) => {
    const mark = isLowercaseMark ? 'a' : 'A';
    return newTest({
      title:
        'Insert linebreak in the sameline before ' + getMarkTypeText(isLowercaseMark) + ' mark',
      start: ['Lorem Ipsum is', '    the dummy text', '    of |the industry'],
      keysPressed: 'm' + mark + 'hhi\n<C-u><Esc>`' + mark,
      end: ['Lorem Ipsum is', '    the dummy text', '    o', 'f |the industry'],
    });
  };

  testInsertLinebreakBefore(true);
  testInsertLinebreakBefore(false);

  const testJoiningLine = (isLowercaseMark: boolean) => {
    const mark = isLowercaseMark ? 'a' : 'A';
    return newTest({
      title: 'Join a line containing a ' + getMarkTypeText(isLowercaseMark) + ' mark',
      start: ['Lorem Ipsum is', '    the dummy text', '    of |the industry'],
      keysPressed: 'm' + mark + 'kJ`' + mark,
      end: ['Lorem Ipsum is', '    the dummy text of |the industry'],
    });
  };

  testJoiningLine(true);
  testJoiningLine(false);
});
