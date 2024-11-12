import { getAndUpdateModeHandler } from '../../extension';
import { ExCommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, setupWorkspace } from '../testUtils';

suite('Redo command', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  test('redoes last undoed action after insert mode', async () => {
    await modeHandler.handleMultipleKeyEvents(['I', 'a', '<Esc>']);
    await modeHandler.handleMultipleKeyEvents(['I', 'b', '<Esc>']);
    await new ExCommandLine('undo', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    await new ExCommandLine('redo', modeHandler.vimState.currentMode).run(modeHandler.vimState);
    assertEqualLines(['ba']);
  });
});
