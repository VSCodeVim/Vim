import * as sinon from 'sinon';
import { SubstituteCommand } from '../../src/cmd_line/commands/substitute';
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
import { newTest } from '../testSimplifier';
suite('Basic substitute', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
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

  newTest({
    title: 'Replace with flags AND count',
    start: ['|blah blah', 'blah', 'blah blah', 'blah blah'],
    keysPressed: ':.s/blah/yay/g 2\n',
    end: ['|yay yay', 'yay', 'blah blah', 'blah blah'],
  });

  test('Replace with `c` flag', async () => {
    const confirmStub = sinon
      .stub(SubstituteCommand.prototype, 'confirmReplacement')
      .resolves(true);
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);
    await commandLine.Run('%s/a/d/c', modeHandler.vimState);

    assertEqualLines(['dba']);
    confirmStub.restore();
  });

  test('Replace with `gc` flag', async () => {
    const confirmStub = sinon
      .stub(SubstituteCommand.prototype, 'confirmReplacement')
      .resolves(true);
    await modeHandler.handleMultipleKeyEvents(['i', 'f', 'f', 'b', 'a', 'r', 'f', '<Esc>']);
    await commandLine.Run('%s/f/foo/gc', modeHandler.vimState);

    assertEqualLines(['foofoobarfoo']);
    confirmStub.restore();
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
    title: 'Replace across relative line range using numLines+colon shorthand',
    start: ['blah blah', '|blah', 'blah blah', 'blah blah'],
    keysPressed: '3:s/blah/yay\n',
    end: ['blah blah', '|yay', 'yay blah', 'yay blah'],
  });

  newTest({
    title: 'Repeat replacement across relative line range',
    start: ['|blah blah', 'blah', 'blah blah', 'blah blah'],
    keysPressed: ':s/blah/yay\nj3:s\n',
    end: ['yay blah', '|yay', 'yay blah', 'yay blah'],
  });

  newTest({
    title: 'Replace with range AND count but no flags',
    start: ['|blah blah', 'blah', 'blah blah', 'blah blah'],
    keysPressed: '3:s/blah/yay/ 2\n',
    end: ['|blah blah', 'blah', 'yay blah', 'yay blah'],
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

  newTest({
    title: 'Replace with \\n',
    start: ['one |two three'],
    keysPressed: ':s/t/\\n/g\n',
    end: ['one| ', 'wo ', 'hree'],
  });

  newTest({
    title: 'Replace with \\t',
    start: ['one |two three'],
    keysPressed: ':s/t/\\t/g\n',
    end: ['one |\two \three'],
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

  suite('Effects of gdefault=true', () => {
    setup(async () => {
      Globals.mockConfiguration.gdefault = true;
      await reloadConfiguration();
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

    test('Replace with `c` flag inverts global flag', async () => {
      const confirmStub = sinon
        .stub(SubstituteCommand.prototype, 'confirmReplacement')
        .resolves(true);
      await modeHandler.handleMultipleKeyEvents(['i', 'f', 'f', 'b', 'a', 'r', 'f', '<Esc>']);
      await commandLine.Run('%s/f/foo/c', modeHandler.vimState);

      assertEqualLines(['foofoobarfoo']);
      confirmStub.restore();
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

  suite('Substitute should use various previous search/substitute states', () => {
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

    newTest({
      title: 'Substitute with parameters should update search state',
      start: ['foo', 'bar', 'foo', 'bar|'],
      keysPressed:
        '/bar\n' + // search for bar (search state now = bar)
        ':s/ar/ite\n' + // change first bar to bite (search state now = ar, not bar)
        'n' + // repeat search (ar, not bar)
        'rr', // and replace a with r
      end: ['foo', 'bite', 'foo', 'b|rr'],
    });

    newTest({
      title:
        'Substitute with empty replacement should delete previous substitution (all variants) and accepts flags',
      start: [
        'link',
        '|ganon is here',
        'link',
        'ganon is here',
        'link',
        'ganon is here',
        'link',
        'ganon is here',
        'link',
        'ganon ganon is here',
      ],
      keysPressed:
        ':s/ganon/zelda\n' + // replace ganon with zelda (ensuring we have a prior replacement state)
        'n' + // find next ganon
        ':s/\n' + // replace ganon with nothing (using prior state)
        ':s/ganon/zelda\n' + // does nothing (just ensuring we have a prior replacement state)
        'n' + // find next ganon
        ':s//\n' + // replace ganon with nothing (using prior state)
        'n' + // find next ganon
        ':s/ganon\n' + // replace ganon with nothing (using single input)
        ':s/ganon/zelda\n' + // does nothing (just ensuring we have a prior replacement state)
        'n' + // find next ganon
        ':s///g\n', // replace ganon with nothing
      end: [
        'link',
        'zelda is here',
        'link',
        ' is here',
        'link',
        ' is here',
        'link',
        ' is here',
        'link',
        '|  is here',
      ],
    });

    newTest({
      title:
        'Substitute with no pattern should repeat previous substitution and not alter search state',
      start: ['|link', 'zelda', 'link', 'zelda', 'link'],
      keysPressed:
        ':s/ink/egend\n' + // replace link with legend (search state now = egend, and substitute state set)
        '/link\n' + // search for link (search state now = link, not ink)
        ':s\n' + // repeat replacement (using substitute state, so ink, not link - note: search state should NOT change)
        'n' + // repeat search for link, not ink
        'rp', // and replace l with p (confirming search state was unaltered)
      end: ['legend', 'zelda', 'legend', 'zelda', '|pink'],
    });

    newTest({
      title: 'Substitute repeat previous should accept flags',
      start: ['|fooo'],
      keysPressed: ':s/o/un\n:s g\n', // repeated replacement accepts g flag, replacing all other occurrences
      end: ['|fununun'],
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

    newTest({
      title: 'Ampersand (&) should repeat the last substitution',
      start: ['|foo bar baz'],
      keysPressed: ':s/ba/t\n' + '&',
      end: ['|foo tr tz'],
    });
  });
});
