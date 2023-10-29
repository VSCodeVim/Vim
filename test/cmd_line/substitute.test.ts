import { Globals } from '../../src/globals';
import { cleanUpWorkspace, reloadConfiguration, setupWorkspace } from './../testUtils';
import { newTest } from '../testSimplifier';

function sub(
  pattern: string,
  replace: string,
  args?: { lineRange?: string; flags?: string; count?: number },
): string {
  const lineRange = args?.lineRange ?? '';
  const flags = args?.flags !== undefined ? `/${args.flags}` : '';
  const count = args?.count !== undefined ? ` ${args.count}` : '';
  return `:${lineRange}s/${pattern}/${replace}${flags}${count}\n`;
}

suite('Basic substitute', () => {
  setup(setupWorkspace);
  suiteTeardown(cleanUpWorkspace);

  newTest({
    title: 'Replace single word once',
    start: ['|aba'],
    keysPressed: sub('a', 'd', { lineRange: '%' }),
    end: ['|dba'],
  });

  newTest({
    title: 'Replace with `g` flag',
    start: ['|aba'],
    keysPressed: sub('a', 'd', { lineRange: '%', flags: 'g' }),
    end: ['|dbd'],
  });

  newTest({
    title: 'Replace with flags AND count',
    start: ['|blah blah', 'blah', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay', { lineRange: '.', flags: 'g', count: 2 }),
    end: ['yay yay', '|yay', 'blah blah', 'blah blah'],
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
    keysPressed: sub('a', 'd', { lineRange: '%', flags: 'g' }),
    end: ['dbd', '|db'],
    statusBar: '3 substitutions on 2 lines',
  });

  newTest({
    title: 'Replace on specific single line',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay', { lineRange: '3' }),
    end: ['blah blah', 'blah', '|yay blah', 'blah blah'],
  });

  newTest({
    title: 'Replace on current line using dot',
    start: ['blah blah', '|blah', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay', { lineRange: '.' }),
    end: ['blah blah', '|yay', 'blah blah', 'blah blah'],
  });

  newTest({
    title: 'Replace single relative line using dot and plus',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay', { lineRange: '.+2' }),
    end: ['blah blah', 'blah', 'blah blah', '|yay blah'],
  });

  newTest({
    title: 'Replace across specific line range',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay', { lineRange: '3,4' }),
    end: ['blah blah', 'blah', 'yay blah', '|yay blah'],
  });

  newTest({
    title: 'Replace across relative line range using dot, plus, and minus',
    start: ['blah blah', '|blah', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay', { lineRange: '.-1,.+1' }),
    end: ['yay blah', 'yay', '|yay blah', 'blah blah'],
    statusBar: '3 substitutions on 3 lines',
  });

  newTest({
    title: 'Replace across relative line range using numLines+colon shorthand',
    start: ['blah blah', '|blah', 'blah blah', 'blah blah'],
    keysPressed: '3' + sub('blah', 'yay'),
    end: ['blah blah', 'yay', 'yay blah', '|yay blah'],
    statusBar: '3 substitutions on 3 lines',
  });

  newTest({
    title: 'Repeat replacement across relative line range',
    start: ['|blah blah', 'blah', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay') + 'j' + '3:s\n',
    end: ['yay blah', 'yay', 'yay blah', '|yay blah'],
    statusBar: '3 substitutions on 3 lines',
  });

  newTest({
    title: 'Replace with range AND count but no flags',
    start: ['|blah blah', 'blah', 'blah blah', 'blah blah'],
    keysPressed: '3' + sub('blah', 'yay', { flags: '', count: 2 }),
    end: ['blah blah', 'blah', 'yay blah', '|yay blah'],
  });

  newTest({
    title: 'Undocumented: operator without LHS assumes dot as LHS',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay', { lineRange: '+2' }),
    end: ['blah blah', 'blah', 'blah blah', '|yay blah'],
  });

  newTest({
    title: 'Undocumented: multiple consecutive operators use 1 as RHS',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay', { lineRange: '.++1' }),
    end: ['blah blah', 'blah', 'blah blah', '|yay blah'],
  });

  newTest({
    title: 'Undocumented: trailing operators use 1 as RHS',
    start: ['blah blah', 'bla|h', 'blah blah', 'blah blah'],
    keysPressed: sub('blah', 'yay', { lineRange: '.+1+' }),
    end: ['blah blah', 'blah', 'blah blah', '|yay blah'],
  });

  newTest({
    title: 'Preserve \\b in regular expression',
    start: ['one |two three thirteen'],
    keysPressed: sub('\\bt', 'x', { flags: 'g' }),
    end: ['|one xwo xhree xhirteen'],
    statusBar: '3 substitutions on 1 line',
  });

  newTest({
    title: 'Preserve \\\\ in regular expression',
    start: ['one |\\two \\three thirteen'],
    keysPressed: sub('\\\\t', 'x', { flags: 'g' }),
    end: ['|one xwo xhree thirteen'],
  });

  newTest({
    title: 'Replace with \\n',
    start: ['one |two three'],
    keysPressed: sub('t', '\\n', { flags: 'g' }),
    end: ['one ', 'wo ', '|hree'],
  });

  newTest({
    title: 'Replace with \\t',
    start: ['one |two three'],
    keysPressed: sub('t', '\\t', { flags: 'g' }),
    end: ['|one \two \three'],
  });

  newTest({
    title: 'Replace with \\',
    start: ['one |two three'],
    keysPressed: sub('t', '\\\\', { flags: 'g' }),
    end: ['|one \\wo \\hree'],
  });

  newTest({
    title: 'Replace trailing \\ with \\',
    start: ['one |two three'],
    keysPressed: sub('t', '\\'),
    end: ['|one \\wo three'],
  });

  newTest({
    title: 'Replace specific single equal lines',
    start: ['|aba', 'ab'],
    keysPressed: sub('a', 'd', { lineRange: '1,1', flags: 'g' }),
    end: ['|dbd', 'ab'],
  });

  newTest({
    title: 'Replace current line with no active selection',
    start: ['aba', '|ab'],
    keysPressed: sub('a', 'd', { flags: 'g' }),
    end: ['aba', '|db'],
  });

  newTest({
    title: 'Replace text in selection',
    start: ['|aba', 'ab'],
    keysPressed: 'Vj' + sub('a', 'd', { flags: 'g' }),
    end: ['dbd', '|db'],
  });

  newTest({
    title: 'Replace in selection with \\n',
    start: ['1,|2', '3,4'],
    keysPressed: 'Vj' + sub(',', '\\n', { flags: 'g' }),
    end: ['1', '2', '3', '|4'],
  });

  newTest({
    title: 'Substitute support marks',
    start: ['|aba', 'aba', 'abc'],
    keysPressed: 'ma' + 'jmb' + sub('a', 'd', { lineRange: "'a,'b", flags: 'g' }),
    end: ['dbd', '|dbd', 'abc'],
  });

  newTest({
    title: 'Substitute in last visual selection with \\%V',
    start: ['aba', '|aba', 'abc', ''],
    keysPressed: 'vjj<Esc>' + sub('\\%Va', 'd', { flags: 'g' }),
    end: ['aba', 'dbd', '|dbc', ''],
  });

  suite('Effects of gdefault=true', () => {
    setup(async () => {
      Globals.mockConfiguration.gdefault = true;
      await reloadConfiguration();
    });

    newTest({
      title: 'Replace all matches in the line',
      start: ['|aba'],
      keysPressed: sub('a', 'd', { lineRange: '%' }),
      end: ['|dbd'],
    });

    newTest({
      title: 'Replace with `g` flag inverts global flag',
      start: ['|aba'],
      keysPressed: sub('a', 'd', { lineRange: '%', flags: 'g' }),
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
      keysPressed: sub('a', 'd', { lineRange: '%' }),
      end: ['dbd', '|db'],
    });

    newTest({
      title: 'Replace across specific lines',
      start: ['|aba', 'ab'],
      keysPressed: sub('a', 'd', { lineRange: '1,1' }),
      end: ['|dbd', 'ab'],
    });

    newTest({
      title: 'Replace current line with no active selection',
      start: ['aba', '|ab'],
      keysPressed: sub('a', 'd'),
      end: ['aba', '|db'],
    });

    newTest({
      title: 'Replace text in selection',
      start: ['|aba', 'ab'],
      keysPressed: 'Vj' + sub('a', 'd'),
      end: ['dbd', '|db'],
    });

    newTest({
      title: 'Substitute support marks',
      start: ['|aba', 'aba', 'abc'],
      keysPressed: 'ma' + 'jmb' + sub('a', 'd', { lineRange: "'a,'b" }),
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
      keysPressed: '*' + sub('', 'fighters', { lineRange: '%' }),
      end: ['fighters', 'bar', '|fighters', 'bar'],
    });

    newTest({
      title: 'Substitute with previous search using #',
      start: ['foo', 'bar', 'f|oo', 'bar'],
      keysPressed: '#' + sub('', 'fighters', { lineRange: '%' }),
      end: ['fighters', 'bar', '|fighters', 'bar'],
    });

    newTest({
      title: 'Substitute with previous search using /',
      start: ['foo|', 'bar', 'foo', 'bar'],
      keysPressed: '/foo\n' + sub('', 'fighters', { lineRange: '%' }),
      end: ['fighters', 'bar', '|fighters', 'bar'],
    });

    newTest({
      title: '`~` in replace string uses previous replace string',
      start: ['|one two three', 'two three four'],
      keysPressed: sub('two', 'xyz') + 'j' + sub('three', '~ ~'),
      end: ['one xyz three', '|two xyz xyz four'],
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
        sub('ganon', 'zelda') + // replace ganon with zelda (ensuring we have a prior replacement state)
        'n' + // find next ganon
        ':s/\n' + // replace ganon with nothing (using prior state)
        sub('ganon', 'zelda') + // does nothing (just ensuring we have a prior replacement state)
        'n' + // find next ganon
        ':s//\n' + // replace ganon with nothing (using prior state)
        'n' + // find next ganon
        ':s/ganon\n' + // replace ganon with nothing (using single input)
        sub('ganon', 'zelda') + // does nothing (just ensuring we have a prior replacement state)
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
        sub('ink', 'egend') + // replace link with legend (search state now = egend, and substitute state set)
        '/link\n' + // search for link (search state now = link, not ink)
        ':s\n' + // repeat replacement (using substitute state, so ink, not link - note: search state should NOT change)
        'n' + // repeat search for link, not ink
        'rp', // and replace l with p (confirming search state was unaltered)
      end: ['legend', 'zelda', 'legend', 'zelda', '|pink'],
    });

    newTest({
      title: 'Substitute repeat previous should accept flags',
      start: ['|fooo'],
      keysPressed: sub('o', 'un') + ':s g\n', // repeated replacement accepts g flag, replacing all other occurrences
      end: ['|fununun'],
    });

    newTest({
      title: 'Ampersand (&) should repeat the last substitution',
      start: ['|foo bar baz'],
      keysPressed: sub('ba', 't') + '&',
      end: ['|foo tr tz'],
    });

    suite('Change case', () => {
      newTest({
        title: '\\U',
        start: ['|she sells seashells by the seashore'],
        keysPressed: sub('s\\S*', '\\U&x', { flags: 'g' }),
        end: ['|SHEX SELLSX SEASHELLSX by the SEASHOREX'],
      });

      newTest({
        title: '\\U then \\E',
        start: ['|she sells seashells by the seashore'],
        keysPressed: sub('s\\S*', '\\U&\\Ex', { flags: 'g' }),
        end: ['|SHEx SELLSx SEASHELLSx by the SEASHOREx'],
      });

      newTest({
        title: '\\u',
        start: ['|she sells seashells by the seashore'],
        keysPressed: sub('s\\S*', '\\u&x', { flags: 'g' }),
        end: ['|Shex Sellsx Seashellsx by the Seashorex'],
      });

      newTest({
        title: '\\L',
        start: ['|SHE SELLS SEASHELLS BY THE SEASHORE'],
        keysPressed: sub('S\\S*', '\\L&X', { flags: 'g' }),
        end: ['|shex sellsx seashellsx BY THE seashorex'],
      });

      newTest({
        title: '\\L then \\E',
        start: ['|SHE SELLS SEASHELLS BY THE SEASHORE'],
        keysPressed: sub('S\\S*', '\\L&\\EX', { flags: 'g' }),
        end: ['|sheX sellsX seashellsX BY THE seashoreX'],
      });

      newTest({
        title: '\\l',
        start: ['|SHE SELLS SEASHELLS BY THE SEASHORE'],
        keysPressed: sub('S\\S*', '\\l&X', { flags: 'g' }),
        end: ['|sHEX sELLSX sEASHELLSX BY THE sEASHOREX'],
      });
    });

    suite('Capture groups', () => {
      newTest({
        title: '& capture group',
        start: ['|she sells seashells by the seashore'],
        keysPressed: sub('s\\S*', '(&)', { flags: 'g' }),
        end: ['|(she) (sells) (seashells) by the (seashore)'],
      });

      newTest({
        title: '\\0 capture group',
        start: ['|she sells seashells by the seashore'],
        keysPressed: sub('s\\S*', '(\\0)', { flags: 'g' }),
        end: ['|(she) (sells) (seashells) by the (seashore)'],
      });

      newTest({
        title: '\\1 capture group',
        start: ['|she sells seashells by the seashore'],
        keysPressed: sub('s(\\S*)', '(\\1)', { flags: 'g' }),
        end: ['|(he) (ells) (eashells) by the (eashore)'],
      });
    });

    newTest({
      title: 'Replace new line',
      start: ['|one two', 'three', 'one two', 'four', 'one two', 'three'],
      keysPressed: sub('(two)\\n(three)', '\\1 \\2', { lineRange: '%' }),
      // TODO: Cursor position is wrong
      end: ['one two three', 'one two', '|four', 'one two three'],
    });
  });
});
