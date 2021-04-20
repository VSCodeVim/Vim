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

  newTest({
    title: 'Replace single word once',
    start: ['|aba'],
    keysPressed: ':%s/a/d\n',

    end: ['|dba'],
  });

  newTest({
    title: 'Replace with `g` flag',
    start: ['|aba'],
    keysPressed: ':%s/a/d/g\n',

    end: ['|dbd'],
  });

  newTest({
    title: 'Replace with flags AND count',
    start: ['|blah blah', 'blah', 'blah blah', 'blah blah'],
    keysPressed: ':.s/blah/yay/g 2\n',
    end: ['|yay yay', 'yay', 'blah blah', 'blah blah'],
  });

  /*
  newTest({ title: 'Replace with `c` flag',
    const confirmStub = sinon
      .stub(SubstituteCommand.prototype, 'confirmReplacement')
      .resolves(true);
    start: [ 'aba'],
    keysPressed: ':%s/a/d/c\n',

    end: ['dba']
    confirmStub.restore();
  });
  */

  /*
  newTest({ title: 'Replace with `gc` flag',
    const confirmStub = sinon
      .stub(SubstituteCommand.prototype, 'confirmReplacement')
      .resolves(true);
    start: [ 'f', 'f', 'b', 'a', 'r', 'f'],
    keysPressed: ':%s/f/foo/gc\n',

    end: ['foofoobarfoo']
    confirmStub.restore();
  });
  */

  newTest({
    title: 'Replace across all lines',
    start: ['|aba', 'ab'],
    keysPressed: ':%s/a/d/g\n',

    end: ['|dbd', 'db'],
  });

  newTest({
    title: 'Replace on specific single line',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':3s/blah/yay\n',
    end: ['blah blah', '|blah', 'yay blah', 'blah blah'],
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
    end: ['blah blah', '|blah', 'blah blah', 'yay blah'],
  });

  newTest({
    title: 'Replace across specific line range',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':3,4s/blah/yay\n',
    end: ['blah blah', '|blah', 'yay blah', 'yay blah'],
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
    end: ['blah blah', '|blah', 'blah blah', 'yay blah'],
  });

  newTest({
    title: 'Undocumented: multiple consecutive operators use 1 as RHS',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':.++1s/blah/yay\n',
    end: ['blah blah', '|blah', 'blah blah', 'yay blah'],
  });

  newTest({
    title: 'Undocumented: trailing operators use 1 as RHS',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: ':.+1+s/blah/yay\n',
    end: ['blah blah', '|blah', 'blah blah', 'yay blah'],
  });

  newTest({
    title: 'Replace with \\n',
    start: ['one |two three'],
    keysPressed: ':s/t/\\n/g\n',
    end: ['|one ', 'wo ', 'hree'],
  });

  newTest({
    title: 'Replace with \\t',
    start: ['one |two three'],
    keysPressed: ':s/t/\\t/g\n',
    end: ['|one \two \three'],
  });

  newTest({
    title: 'Replace specific single equal lines',
    start: ['|aba', 'ab'],
    keysPressed: ':1,1s/a/d/g\n',

    end: ['|dbd', 'ab'],
  });

  newTest({
    title: 'Replace current line with no active selection',
    start: ['aba', '|ab'],
    keysPressed: ':s/a/d/g\n',

    end: ['aba', '|db'],
  });

  newTest({
    title: 'Replace text in selection',
    start: ['|aba', 'ab'],
    keysPressed: 'Vj' + ':s/a/d/g\n', // select 2 lines, then subst

    end: ['dbd', '|db'],
  });

  newTest({
    title: 'Replace in selection with \\n',
    start: ['1,|2', '3,4'],
    keysPressed: 'Vj' + ':s/,/\\n/g\n',
    end: ['1', '2', '3', '|4'],
  });

  newTest({
    title: 'Substitute support marks',
    start: ['|aba', 'aba', 'abc'],
    keysPressed: 'majmb' + ":'a,'bs/a/d/g\n", // create marks, then subst

    end: ['dbd', '|dbd', 'abc'],
  });

  suite('Effects of gdefault=true', () => {
    setup(async () => {
      Globals.mockConfiguration.gdefault = true;
      await reloadConfiguration();
    });

    newTest({
      title: 'Replace all matches in the line',
      start: ['|aba'],
      keysPressed: ':%s/a/d\n',

      end: ['|dbd'],
    });

    newTest({
      title: 'Replace with `g` flag inverts global flag',
      start: ['|aba'],
      keysPressed: ':%s/a/d/g\n',

      end: ['|dba'],
    });

    /*
    newTest({ title: 'Replace with `c` flag inverts global flag',
      const confirmStub = sinon
        .stub(SubstituteCommand.prototype, 'confirmReplacement')
        .resolves(true);
      start: [ 'f', 'f', 'b', 'a', 'r', 'f'],
      keysPressed: ':%s/f/foo/c\n',

      end: ['foofoobarfoo']
      confirmStub.restore();
    });
    */

    newTest({
      title: 'Replace multiple lines',
      start: ['|aba', 'ab'],
      keysPressed: ':%s/a/d/\n',

      end: ['|dbd', 'db'],
    });

    newTest({
      title: 'Replace across specific lines',
      start: ['|aba', 'ab'],
      keysPressed: ':1,1s/a/d/\n',

      end: ['|dbd', 'ab'],
    });

    newTest({
      title: 'Replace current line with no active selection',
      start: ['aba', '|ab'],
      keysPressed: ':s/a/d/\n',

      end: ['aba', '|db'],
    });

    newTest({
      title: 'Replace text in selection',
      start: ['|aba', 'ab'],
      keysPressed: 'Vj' + ':s/a/d/\n',

      end: ['dbd', '|db'],
    });

    newTest({
      title: 'Substitute support marks',
      start: ['|aba', 'aba', 'abc'],
      keysPressed: 'majmb' + ":'a,'bs/a/d\n", // create marks, then subst

      end: ['dbd', '|dbd', 'abc'],
    });

    newTest({
      title: 'Substitute with escaped delimiter',
      start: ['|b//f'],
      keysPressed: ':s/\\/\\/f/z/g\n',

      end: ['|bz'],
    });
  });

  suite('Substitute should use various previous search/substitute states', () => {
    newTest({
      title: 'Substitute with previous search using *',
      start: ['|foo', 'bar', 'foo', 'bar'],
      keysPressed: '*' + ':%s//fighters\n',

      end: ['fighters', 'bar', '|fighters', 'bar'],
    });

    newTest({
      title: 'Substitute with previous search using #',
      start: ['foo', 'bar', 'foo', '|bar'],
      keysPressed: '#' + ':%s//fighters\n',

      end: ['foo', '|fighters', 'foo', 'fighters'],
    });

    newTest({
      title: 'Substitute with previous search using /',
      start: ['foo|', 'bar', 'foo', 'bar'],

      keysPressed: '/foo\n' + ':%s//fighters\n',

      end: ['fighters', 'bar', '|fighters', 'bar'],
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

    newTest({
      title: 'Ampersand (&) should repeat the last substitution',
      start: ['|foo bar baz'],
      keysPressed: ':s/ba/t\n' + '&',
      end: ['|foo tr tz'],
    });
  });
});
