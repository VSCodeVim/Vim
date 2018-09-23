import { getAndUpdateModeHandler } from '../../extension';
import { commandLine } from '../../src/cmd_line/commandLine';
import { Globals } from '../../src/globals';
import { ModeHandler } from '../../src/mode/modeHandler';
import {
  assertEqualLines,
  cleanUpWorkspace,
  reloadConfiguration,
  setupWorkspace,
} from './../testUtils';
import { getTestingFunctions } from '../testSimplifier';

suite('Basic substitute', () => {
  let { newTest, newTestOnly } = getTestingFunctions();
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('Replace single word once', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
    await commandLine.Run('%s/a/d', modeHandler.vimState);

    assertEqualLines(['dba']);
  });

  test('Replace with `g` flag', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
    await commandLine.Run('%s/a/d/g', modeHandler.vimState);

    assertEqualLines(['dbd']);
  });

  test('Replace across all lines', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
    await commandLine.Run('%s/a/d/g', modeHandler.vimState);

    assertEqualLines(['dbd', 'db']);
  });

  newTest({
    title: 'Replace on specific single line',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':3s/blah/yay\n',
    end: ['blah blah', 'bla|h', 'yay blah', 'blah blah'],
  });

  newTest({
    title: 'Replace on current line using dot',
    start: ['blah blah', '|blah', 'blah blah', 'blah blah'],
    keysPressed: ':.s/blah/yay\n',
    end: ['blah blah', '|yay', 'blah blah', 'blah blah'],
  });

  newTest({
    title: 'Replace single relative line using dot and plus',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':.+2s/blah/yay\n',
    end: ['blah blah', 'bla|h', 'blah blah', 'yay blah'],
  });

  newTest({
    title: 'Replace across specific line range',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':3,4s/blah/yay\n',
    end: ['blah blah', 'bla|h', 'yay blah', 'yay blah'],
  });

  newTest({
    title: 'Replace across relative line range using dot, plus, and minus',
    start: ['blah blah', '|blah', 'blah blah', 'blah blah'],
    keysPressed: ':.-1,.+1s/blah/yay\n',
    end: ['yay blah', '|yay', 'yay blah', 'blah blah'],
  });

  newTest({
    title: 'Undocumented: operator without LHS assumes dot as LHS',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':+2s/blah/yay\n',
    end: ['blah blah', 'bla|h', 'blah blah', 'yay blah'],
  });

  newTest({
    title: 'Undocumented: multiple consecutive operators use 1 as RHS',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':.++1s/blah/yay\n',
    end: ['blah blah', 'bla|h', 'blah blah', 'yay blah'],
  });

  newTest({
    title: 'Undocumented: trailing operators use 1 as RHS',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':.+1+s/blah/yay\n',
    end: ['blah blah', 'bla|h', 'blah blah', 'yay blah'],
  });

  test('Replace specific single equal lines', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
    await commandLine.Run('1,1s/a/d/g', modeHandler.vimState);

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
    await commandLine.Run('s/a/d/g', modeHandler.vimState);

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
    await commandLine.Run("'<,'>s/a/d/g", modeHandler.vimState);

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
    await commandLine.Run("'a,'bs/a/d/g", modeHandler.vimState);

    assertEqualLines(['dbc', 'dbc', 'abc']);
  });

  suite('Effects of substituteGlobalFlag=true', () => {
    setup(() => {
      Globals.mockConfiguration.substituteGlobalFlag = true;
      reloadConfiguration();
    });

    test('Replace all matches in the line', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
      await commandLine.Run('%s/a/d', modeHandler.vimState);

      assertEqualLines(['dbd']);
    });

    test('Replace with `g` flag inverts global flag', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
      await commandLine.Run('%s/a/d/g', modeHandler.vimState);

      assertEqualLines(['dba']);
    });

    test('Replace multiple lines', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
      await commandLine.Run('%s/a/d/', modeHandler.vimState);

      assertEqualLines(['dbd', 'db']);
    });

    test('Replace across specific lines', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>', 'o', 'a', 'b']);
      await commandLine.Run('1,1s/a/d/', modeHandler.vimState);

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
      await commandLine.Run('s/a/d/', modeHandler.vimState);

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
      await commandLine.Run("'<,'>s/a/d/", modeHandler.vimState);

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
      await commandLine.Run("'a,'bs/a/d/", modeHandler.vimState);

      assertEqualLines(['dbc', 'dbc', 'abc']);
    });

    test('Substitute with escaped delimiter', async () => {
      await modeHandler.handleMultipleKeyEvents(['i', 'b', '/', '/', 'f', '<Esc>']);
      await commandLine.Run('s/\\/\\/f/z/g', modeHandler.vimState);

      assertEqualLines(['bz']);
    });
  });
  suite('Substitute with empty search string should use previous search', () => {
    test('Substitute with previous search using *', async () => {
      await modeHandler.handleMultipleKeyEvents([
        'i',
        'f',
        'o',
        'o',
        '<Esc>',
        'o',
        'b',
        'a',
        'r',
        '<Esc>',
        'o',
        'f',
        'o',
        'o',
        '<Esc>',
        'o',
        'b',
        'a',
        'r',
        '<Esc>',
        'g',
        'g', // back to the first line
        '*', // search for foo
      ]);
      await commandLine.Run('%s//fighters', modeHandler.vimState);

      assertEqualLines(['fighters', 'bar', 'fighters', 'bar']);
    });
    test('Substitute with previous search using #', async () => {
      await modeHandler.handleMultipleKeyEvents([
        'i',
        'f',
        'o',
        'o',
        '<Esc>',
        'o',
        'b',
        'a',
        'r',
        '<Esc>',
        'o',
        'f',
        'o',
        'o',
        '<Esc>',
        'o',
        'b',
        'a',
        'r',
        '<Esc>',
        '#', // search for bar
      ]);
      await commandLine.Run('%s//fighters', modeHandler.vimState);

      assertEqualLines(['foo', 'fighters', 'foo', 'fighters']);
    });
    test('Substitute with previous search using /', async () => {
      await modeHandler.handleMultipleKeyEvents([
        'i',
        'f',
        'o',
        'o',
        '<Esc>',
        'o',
        'b',
        'a',
        'r',
        '<Esc>',
        'o',
        'f',
        'o',
        'o',
        '<Esc>',
        'o',
        'b',
        'a',
        'r',
        '<Esc>',
        '/',
        'f',
        'o',
        'o', // search for foo
        '\n',
      ]);
      await commandLine.Run('%s//fighters', modeHandler.vimState);

      assertEqualLines(['fighters', 'bar', 'fighters', 'bar']);
    });
    test('Substitute with empty search string should use last searched pattern', async () => {
      await modeHandler.handleMultipleKeyEvents([
        'i',
        'f',
        'o',
        'o',
        '<Esc>',
        'o',
        'b',
        'a',
        'r',
        '<Esc>',
        'o',
        'f',
        'o',
        'o',
        '<Esc>',
        'o',
        'b',
        'a',
        'r',
        '<Esc>',
        '/',
        'f',
        'o',
        'o', // search for foo
        '\n',
        '2', // go to the second line
        'g',
        'g',
        '*', // now search for bar
      ]);
      await commandLine.Run('%s//fighters', modeHandler.vimState);

      assertEqualLines(['foo', 'fighters', 'foo', 'fighters']);
    });
  });
});
