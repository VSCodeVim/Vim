import { getAndUpdateModeHandler } from '../../extension';
import { commandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, cleanUpWorkspace, setupWorkspace } from '../testUtils';
import { VimState } from '../../src/state/vimState';

suite('Undo command', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('undoes last action after insert mode', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(['i', 'b', '<Esc>']);
    await commandLine.Run('undo', modeHandler.vimState);
    assertEqualLines(['a']);
  });
});
