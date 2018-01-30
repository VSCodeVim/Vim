import { getAndUpdateModeHandler } from '../../extension';
import { CommandLine } from '../../src/cmd_line/commandLine';
import { Globals } from '../../src/globals';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqualLines, cleanUpWorkspace, reloadConfiguration, setupWorkspace } from './../testUtils';

suite('Basic substitute', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('Replace single word once', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
    await CommandLine.Run('%s/a/d', modeHandler.vimState);

    assertEqualLines(['dba']);
  });

  test('Replace with `g` flag', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
    await CommandLine.Run('%s/a/d/g', modeHandler.vimState);

    assertEqualLines(['dbd']);
  });

  test('Replace multiple lines', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
    await CommandLine.Run('%s/a/d/g', modeHandler.vimState);

    assertEqualLines(['dbd', 'db']);
  });

  test('Replace across specific lines', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
    await CommandLine.Run('1,1s/a/d/g', modeHandler.vimState);

    assertEqualLines(['dbd', 'ab']);
  });

  test('Replace current line with no active selection', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'a',
      'b',
      'a',
      '<Esc>',
      'o',
      'a',
      'b',
      '<Esc>',
    ]);
    await CommandLine.Run('s/a/d/g', modeHandler.vimState);

    assertEqualLines(['aba', 'db']);
  });

  test('Replace text in selection', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'a',
      'b',
      'a',
      '<Esc>',
      'o',
      'a',
      'b',
      '<Esc>',
      '$',
      'v',
      'k',
      '0',
    ]);
    await CommandLine.Run("'<,'>s/a/d/g", modeHandler.vimState);

    assertEqualLines(['dbd', 'db']);
  });

  test('Substitute support marks', async () => {
    await modeHandler.handleMultipleKeyEvents([
      'i',
      'a',
      'b',
      'c',
      '<Esc>',
      'y',
      'y',
      '2',
      'p',
      'g',
      'g',
      'm',
      'a',
      'j',
      'm',
      'b',
    ]);
    await CommandLine.Run("'a,'bs/a/d/g", modeHandler.vimState);

    assertEqualLines(['dbc', 'dbc', 'abc']);
  });

  suite('Effects of substituteGlobalFlag=true', () => {
    setup(() => {
      Globals.mockConfiguration.substituteGlobalFlag = true;
      reloadConfiguration();
    });

    test('Replace all matches in the line', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
      await CommandLine.Run('%s/a/d', modeHandler.vimState);

      assertEqualLines(['dbd']);
    });

    test('Replace with `g` flag inverts global flag', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
      await CommandLine.Run('%s/a/d/g', modeHandler.vimState);

      assertEqualLines(['dba']);
    });

    test('Replace multiple lines', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
      await CommandLine.Run('%s/a/d/', modeHandler.vimState);

      assertEqualLines(['dbd', 'db']);
    });

    test('Replace across specific lines', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
      await CommandLine.Run('1,1s/a/d/', modeHandler.vimState);

      assertEqualLines(['dbd', 'ab']);
    });

    test('Replace current line with no active selection', async () => {
      await modeHandler.handleMultipleKeyEvents([
        'i',
        'a',
        'b',
        'a',
        '<Esc>',
        'o',
        'a',
        'b',
        '<Esc>',
      ]);
      await CommandLine.Run('s/a/d/', modeHandler.vimState);

      assertEqualLines(['aba', 'db']);
    });

    test('Replace text in selection', async () => {
      await modeHandler.handleMultipleKeyEvents([
        'i',
        'a',
        'b',
        'a',
        '<Esc>',
        'o',
        'a',
        'b',
        '<Esc>',
        '$',
        'v',
        'k',
        '0',
      ]);
      await CommandLine.Run("'<,'>s/a/d/", modeHandler.vimState);

      assertEqualLines(['dbd', 'db']);
    });

    test('Substitute support marks', async () => {
      await modeHandler.handleMultipleKeyEvents([
        'i',
        'a',
        'b',
        'c',
        '<Esc>',
        'y',
        'y',
        '2',
        'p',
        'g',
        'g',
        'm',
        'a',
        'j',
        'm',
        'b',
      ]);
      await CommandLine.Run("'a,'bs/a/d/", modeHandler.vimState);

      assertEqualLines(['dbc', 'dbc', 'abc']);
    });

    test('Substitute with escaped delimiter', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'b', '/', '/', 'f', '<Esc>']);
      await CommandLine.Run('s/\\/\\/f/z/g', modeHandler.vimState);

      assertEqualLines(['bz']);
    });
  });
});
