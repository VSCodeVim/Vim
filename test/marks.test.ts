import * as assert from 'assert';
import { getAndUpdateModeHandler } from './../extension';
import { TextEditor } from './../src/textEditor';
import { ModeHandler } from './../src/mode/modeHandler';
import { getTestingFunctions } from './testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';
import { HistoryTracker } from '../src/history/historyTracker';

suite('Marks', () => {
  let modeHandler: ModeHandler;
  let historyTracker: HistoryTracker;
  const { newTest } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
    historyTracker = modeHandler.vimState.historyTracker;
  });

  teardown(cleanUpWorkspace);

  const jumpToNewFile = async () => {
    await setupWorkspace();
    return getAndUpdateModeHandler();
  };

  newTest({
    title: 'Can jump to local mark',
    start: ['|hello world and mars'],
    keysPressed: 'wma2w`a',
    end: ['hello |world and mars'],
  });

  test('Can jump to global mark in another file', async () => {
    await modeHandler.handleMultipleKeyEvents(
      'iLorem Ipsum is\nthe dummy text\nof the industry'.split('')
    );
    await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/dummy\n'.split('')]);
    await modeHandler.handleMultipleKeyEvents(['m', 'A', '<Esc>', 'k', '0']);
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
      title: 'Insert a new line before ' + (isLowercaseMark ? 'local' : 'global') + ' mark',
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
        'Insert linebreak in the sameline before ' +
        (isLowercaseMark ? 'local' : 'global') +
        ' mark',
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
      title: 'Join a line containing a ' + (isLowercaseMark ? 'local' : 'global') + ' mark',
      start: ['Lorem Ipsum is', '    the dummy text', '    of |the industry'],
      keysPressed: 'm' + mark + 'kJ`' + mark,
      end: ['Lorem Ipsum is', '    the dummy text of |the industry'],
    });
  };

  testJoiningLine(true);
  testJoiningLine(false);

  const testDeleteMark = (isLowercaseMark: boolean) => {
    const markName = isLowercaseMark ? 'a' : 'A';
    return test(
      'Can delete a ' +
        (isLowercaseMark ? 'local' : 'global') +
        ' mark if the line containing it is deleted',
      async () => {
        await modeHandler.handleMultipleKeyEvents(
          'iLorem Ipsum is\nthe dummy text\nof the industry'.split('')
        );
        await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/dummy\n'.split('')]);
        await modeHandler.handleMultipleKeyEvents(['m', markName]);
        let mark = historyTracker.getMark(markName);
        assert.notStrictEqual(mark, undefined, 'failed to store mark');
        await modeHandler.handleMultipleKeyEvents('dd'.split(''));
        mark = historyTracker.getMark(markName);
        assert.strictEqual(mark, undefined, 'failed to delete mark');
      }
    );
  };

  testDeleteMark(true);
  testDeleteMark(false);
});
