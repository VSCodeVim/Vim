import { getAndUpdateModeHandler } from '../../../extension';
import { CommandLine } from '../../../src/cmd_line/commandLine';
import { ModeHandler } from '../../../src/mode/modeHandler';
import { VimState } from '../../../src/state/vimState';
import { assertEqualLines, cleanUpWorkspace, setupWorkspace } from '../../testUtils';

suite('command line - sort', () => {
  let modeHandler: ModeHandler;
  let vimState: VimState;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
    vimState = modeHandler.vimState;
  });

  teardown(cleanUpWorkspace);

  test('Sort whole file, asc', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'b',
      '<Esc>',
      'o',
      'a',
      '<Esc>',
      'o',
      'c',
      '<Esc>',
    ]);
    await CommandLine.Run('sort', vimState);

    assertEqualLines(['a', 'b', 'c']);
  });

  test('Sort whole file, dsc', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'b',
      '<Esc>',
      'o',
      'a',
      '<Esc>',
      'o',
      'c',
      '<Esc>',
    ]);
    await CommandLine.Run('sort!', modeHandler.vimState);

    assertEqualLines(['c', 'b', 'a']);
  });

  test('Sort range, asc', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'b',
      '<Esc>',
      'o',
      'd',
      '<Esc>',
      'o',
      'a',
      '<Esc>',
      'o',
      'c',
      '<Esc>',
    ]);
    await CommandLine.Run('1,3sort', vimState);

    assertEqualLines(['a', 'b', 'd', 'c']);
  });

  test('Sort range, dsc', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'b',
      '<Esc>',
      'o',
      'd',
      '<Esc>',
      'o',
      'a',
      '<Esc>',
      'o',
      'c',
      '<Esc>',
    ]);
    await CommandLine.Run('2,4sort!', vimState);

    assertEqualLines(['b', 'd', 'c', 'a']);
  });
});
