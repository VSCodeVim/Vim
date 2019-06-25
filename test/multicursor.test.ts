import { getAndUpdateModeHandler } from '../extension';
import { ModeHandler } from '../src/mode/modeHandler';
import { assertEqual, assertEqualLines, cleanUpWorkspace, setupWorkspace } from './testUtils';

suite('Multicursor', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  test('can add multiple cursors below', async () => {
    await modeHandler.handleMultipleKeyEvents('i11\n22'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', 'g', 'g']);
    assertEqualLines(['11', '22']);

    if (process.platform === 'darwin') {
      await modeHandler.handleMultipleKeyEvents(['<D-alt+down>']);
    } else {
      await modeHandler.handleMultipleKeyEvents(['<C-alt+down>']);
    }

    assertEqual(modeHandler.vimState.cursors.length, 2, 'Cursor succesfully created.');
    await modeHandler.handleMultipleKeyEvents(['c', 'w', '3', '3', '<Esc>']);
    assertEqualLines(['33', '33']);
  });

  test('can add multiple cursors above', async () => {
    await modeHandler.handleMultipleKeyEvents('i11\n22\n33'.split(''));
    await modeHandler.handleMultipleKeyEvents(['<Esc>', '0']);
    assertEqualLines(['11', '22', '33']);

    if (process.platform === 'darwin') {
      await modeHandler.handleMultipleKeyEvents(['<D-alt+up>', '<D-alt+up>']);
    } else {
      await modeHandler.handleMultipleKeyEvents(['<C-alt+up>', '<C-alt+up>']);
    }

    assertEqual(modeHandler.vimState.cursors.length, 3, 'Cursor succesfully created.');
    await modeHandler.handleMultipleKeyEvents(['c', 'w', '4', '4', '<Esc>']);
    assertEqualLines(['44', '44', '44']);
  });
});
