import { getAndUpdateModeHandler } from '../../extension.ts';
import { ExCommandLine } from '../../src/cmd_line/commandLine.ts';
import { ModeHandler } from '../../src/mode/modeHandler.ts';
import { assertEqualLines, setupWorkspace } from '../testUtils.ts';

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
