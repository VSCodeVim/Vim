import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, cleanUpWorkspace, setupWorkspace } from './../testUtils';
import * as assert from 'assert';
import { Register, RegisterMode } from '../../src/register/register';

suite('put cmd_line', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  teardown(cleanUpWorkspace);

  test('put in empty file', async () => {
    Register.putByKey('abc');
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc']);
  });

  test('put in middle of file', async () => {
    Register.putByKey('123');
    await modeHandler.handleMultipleKeyEvents(['i', 'abc\ndef\nghi', '<Esc>', 'k']);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['abc', 'def', '123', 'ghi']);
  });

  test('put at end of file', async () => {
    Register.putByKey('123');
    await modeHandler.handleMultipleKeyEvents(['i', 'abc\ndef\nghi', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['abc', 'def', 'ghi', '123']);
  });

  test('put ignores current indentation', async () => {
    Register.putByKey('abc');
    await modeHandler.handleMultipleKeyEvents(['i', '\t\t123', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['\t\t123', 'abc']);
  });

  test('put text with newlines', async () => {
    Register.putByKey('\nabc\ndef\n\n');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>', 'k']);

    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['123', '456', '', 'abc', 'def', '', '', '789']);
  });

  test('put from specified register', async () => {
    Register.putByKey('abc', '1');
    await modeHandler.handleMultipleKeyEvents(':put 1\n'.split(''));
    assertEqualLines(['', 'abc']);
  });

  test('put in visual mode executes at cursor end position', async () => {
    Register.putByKey('abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>', 'v', 'k', 'k']);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['123', '456', '789', 'abc']);
  });

  test('put forces linewise put regardless of register mode', async () => {
    Register.putByKey('abc\n', '"', RegisterMode.CharacterWise, true);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc', '']);
    await modeHandler.handleMultipleKeyEvents(':1,$d\n'.split(''));

    Register.putByKey('abc\n', '"', RegisterMode.BlockWise, true);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc', '']);
    await modeHandler.handleMultipleKeyEvents(':1,$d\n'.split(''));

    Register.putByKey('abc\n', '"', RegisterMode.LineWise, true);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc', '']);
  });

  test('put! puts before current line', async () => {
    Register.putByKey('abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':put!\n'.split(''));
    assertEqualLines(['123', 'abc', '456']);
  });

  test('put leaves cursor on last line, first non-whitespace character of pasted content', async () => {
    Register.putByKey('abc\n    def');
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc', '    def']);
    assert.equal(modeHandler.vimState.cursorStopPosition.line, 2);
    assert.equal(modeHandler.vimState.cursorStopPosition.character, 4);
  });

  test('put! leaves cursor on last line, first non-whitespace character of pasted content', async () => {
    Register.putByKey('abc\n    def');
    await modeHandler.handleMultipleKeyEvents(':put!\n'.split(''));
    assertEqualLines(['abc', '    def', '']);
    assert.equal(modeHandler.vimState.cursorStopPosition.line, 1);
    assert.equal(modeHandler.vimState.cursorStopPosition.character, 4);
  });

  test('put with specified line', async () => {
    Register.putByKey('abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':2put\n'.split(''));
    assertEqualLines(['123', '456', 'abc', '789']);
  });

  test('put! with specified line', async () => {
    Register.putByKey('abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':2put!\n'.split(''));
    assertEqualLines(['123', 'abc', '456', '789']);
  });

  test('put with line range should insert at ending line', async () => {
    Register.putByKey('abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':1,2put\n'.split(''));
    assertEqualLines(['123', '456', 'abc', '789']);
  });
});
