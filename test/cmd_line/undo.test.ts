import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, setupWorkspace } from '../testUtils';

suite('Undo command', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  test('undoes last action after insert mode', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(['i', 'b', '<Esc>']);
    await new ExCommandLine('undo', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    assertEqualLines(['a']);
  });
});
