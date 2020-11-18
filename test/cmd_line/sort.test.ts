import { getAndUpdateModeHandler } from '../../extension';
import { commandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { VimState } from '../../src/state/vimState';
import { assertEqualLines, cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('Basic sort', () => {
  let modeHandler: ModeHandler;
  let vimState: VimState;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
    vimState = modeHandler.vimState;
  });

  teardown(cleanUpWorkspace);

  test('Sort whole file, asc', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'B',
      '<Esc>',
      'o',
      'a',
      '<Esc>',
      'o',
      'c',
      '<Esc>',
    ]);
    await commandLine.Run('sort', vimState);

    assertEqualLines(['B', 'a', 'c']);
  });

  test('Sort whole file, asc, ignoreCase', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'B',
      '<Esc>',
      'o',
      'a',
      '<Esc>',
      'o',
      'c',
      '<Esc>',
    ]);
    await commandLine.Run('sort i', vimState);

    assertEqualLines(['a', 'B', 'c']);
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
    await commandLine.Run('sort!', modeHandler.vimState);

    assertEqualLines(['c', 'b', 'a']);
  });

  test('Sort whole file, dsc, ignoreCase', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'B',
      '<Esc>',
      'o',
      'a',
      '<Esc>',
      'o',
      'c',
      '<Esc>',
    ]);
    await commandLine.Run('sort! i', modeHandler.vimState);

    assertEqualLines(['c', 'B', 'a']);
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
    await commandLine.Run('1,3sort', vimState);

    assertEqualLines(['a', 'b', 'd', 'c']);
  });

  test('Sort range, asc, ignoreCase', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'B',
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
    await commandLine.Run('1,3sort i', vimState);

    assertEqualLines(['a', 'B', 'd', 'c']);
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
    await commandLine.Run('2,4sort!', vimState);

    assertEqualLines(['b', 'd', 'c', 'a']);
  });

  test('Sort range, dsc, ignoreCase', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'b',
      '<Esc>',
      'o',
      'd',
      '<Esc>',
      'o',
      'A',
      '<Esc>',
      'o',
      'c',
      '<Esc>',
    ]);
    await commandLine.Run('2,4sort! i', vimState);

    assertEqualLines(['b', 'd', 'c', 'A']);
  });

  test('Sort whole file, asc, unique', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'B',
      '<Esc>',
      'o',
      'a',
      '<Esc>',
      'o',
      'a',
      '<Esc>',
      'o',
      'c',
      '<Esc>',
    ]);
    await commandLine.Run('sort u', vimState);

    assertEqualLines(['B', 'a', 'c']);
  });
});
