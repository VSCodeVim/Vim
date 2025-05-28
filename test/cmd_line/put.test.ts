import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, setupWorkspace } from './../testUtils';
import * as assert from 'assert';
import { Register, RegisterMode } from '../../src/register/register';

suite('put cmd_line', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  test('put in empty file', async () => {
    Register.put(modeHandler.vimState, 'abc');
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc']);
  });

  test('put in middle of file', async () => {
    Register.put(modeHandler.vimState, '123');
    await modeHandler.handleMultipleKeyEvents(['i', 'abc\ndef\nghi', '<Esc>', 'k']);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['abc', 'def', '123', 'ghi']);
  });

  test('put at end of file', async () => {
    Register.put(modeHandler.vimState, '123');
    await modeHandler.handleMultipleKeyEvents(['i', 'abc\ndef\nghi', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['abc', 'def', 'ghi', '123']);
  });

  test('put ignores current indentation', async () => {
    Register.put(modeHandler.vimState, 'abc');
    await modeHandler.handleMultipleKeyEvents(['i', '\t\t123', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['\t\t123', 'abc']);
  });

  test('put text with newlines', async () => {
    Register.put(modeHandler.vimState, '\nabc\ndef\n\n');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>', 'k']);

    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['123', '456', '', 'abc', 'def', '', '', '789']);
  });

  test('put from specified register', async () => {
    modeHandler.vimState.recordedState.registerName = '1';
    Register.put(modeHandler.vimState, 'abc');
    await modeHandler.handleMultipleKeyEvents(':put 1\n'.split(''));
    assertEqualLines(['', 'abc']);
  });

  test('put in visual mode executes at cursor end position', async () => {
    Register.put(modeHandler.vimState, 'abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>', 'v', 'k', 'k']);
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['123', '456', '789', 'abc']);
  });

  test('put forces linewise put regardless of register mode', async () => {
    modeHandler.vimState.currentRegisterMode = RegisterMode.CharacterWise;
    Register.put(modeHandler.vimState, 'abc\n');
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc', '']);
    await modeHandler.handleMultipleKeyEvents(':1,$d\n'.split(''));

    modeHandler.vimState.currentRegisterMode = RegisterMode.BlockWise;
    Register.put(modeHandler.vimState, 'abc\n');
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc', '']);
    await modeHandler.handleMultipleKeyEvents(':1,$d\n'.split(''));

    modeHandler.vimState.currentRegisterMode = RegisterMode.LineWise;
    Register.put(modeHandler.vimState, 'abc\n');
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc', '']);
  });

  test('put! puts before current line', async () => {
    Register.put(modeHandler.vimState, 'abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':put!\n'.split(''));
    assertEqualLines(['123', 'abc', '456']);
  });

  test('put leaves cursor on last line, first non-whitespace character of pasted content', async () => {
    Register.put(modeHandler.vimState, 'abc\n    def');
    await modeHandler.handleMultipleKeyEvents(':put\n'.split(''));
    assertEqualLines(['', 'abc', '    def']);
    assert.strictEqual(modeHandler.vimState.cursorStopPosition.line, 2);
    assert.strictEqual(modeHandler.vimState.cursorStopPosition.character, 4);
  });

  test('put! leaves cursor on last line, first non-whitespace character of pasted content', async () => {
    Register.put(modeHandler.vimState, 'abc\n    def');
    await modeHandler.handleMultipleKeyEvents(':put!\n'.split(''));
    assertEqualLines(['abc', '    def', '']);
    assert.strictEqual(modeHandler.vimState.cursorStopPosition.line, 1);
    assert.strictEqual(modeHandler.vimState.cursorStopPosition.character, 4);
  });

  test('put with specified line', async () => {
    Register.put(modeHandler.vimState, 'abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':2put\n'.split(''));
    assertEqualLines(['123', '456', 'abc', '789']);
  });

  test('put! with specified line', async () => {
    Register.put(modeHandler.vimState, 'abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':2put!\n'.split(''));
    assertEqualLines(['123', 'abc', '456', '789']);
  });

  test('put with line range should insert at ending line', async () => {
    Register.put(modeHandler.vimState, 'abc');
    await modeHandler.handleMultipleKeyEvents(['i', '123\n456\n789', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(':1,2put\n'.split(''));
    assertEqualLines(['123', '456', 'abc', '789']);
  });

  test('put range expression', async () => {
    Register.put(modeHandler.vimState, '');
    await modeHandler.handleMultipleKeyEvents(':put=range(1,3)\n'.split(''));
    assertEqualLines(['', '1', '2', '3']);
  });

  test('put range expression with step', async () => {
    Register.put(modeHandler.vimState, '');
    await modeHandler.handleMultipleKeyEvents(':put=range(4,1,-2)\n'.split(''));
    assertEqualLines(['', '4', '2']);
  });

  test('`:put=` repeats last expression', async () => {
    Register.put(modeHandler.vimState, '');
    await modeHandler.handleMultipleKeyEvents(':put=[1,2,3]\n'.split(''));
    assertEqualLines(['', '1', '2', '3']);
    await modeHandler.handleMultipleKeyEvents(':put=\n'.split(''));
    assertEqualLines(['', '1', '2', '3', '1', '2', '3']);
  });
});
