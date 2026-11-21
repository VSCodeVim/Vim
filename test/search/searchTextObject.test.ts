import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';

suite('Search text objects (gn and gN)', () => {
  suite('can handle gn', () => {
    newTest({
      title: 'gn selects the next match text',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\n' + 'gg' + 'gn',
      end: ['foo', '[hell|o] world', 'hello', 'hello'],
      endMode: Mode.Visual,
    });

    for (const [cursor, jump] of [
      ['|hello', '2gg'],
      ['h|ello', '2ggl'],
      ['hel|lo', '2ggeh'],
      ['hell|o', '2gge'],
    ]) {
      newTest({
        title: `gn selects the current word at ${cursor}`,
        start: ['|foo', 'hello world', 'hello', 'hello'],
        keysPressed: '/hello\n' + jump + 'gn',
        end: ['foo', '[hell|o] world', 'hello', 'hello'],
        endMode: Mode.Visual,
      });
    }

    newTest({
      title: 'gn selects the next word at hello|',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\n' + '2ggel' + 'gn',
      end: ['foo', 'hello world', '[hell|o]', 'hello'],
      endMode: Mode.Visual,
    });
  });

  suite('can handle dgn', () => {
    newTest({
      title: 'dgn deletes the next match text (from first line)',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nggdgn',
      end: ['foo', '| world', 'hello', 'hello'],
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at |hello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\ndgn',
      end: ['foo', '| world', 'hello', 'hello'],
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at h|ello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nldgn',
      end: ['foo', '| world', 'hello', 'hello'],
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at hel|lo',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\n3ldgn',
      end: ['foo', '| world', 'hello', 'hello'],
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at hell|o',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nedgn',
      end: ['foo', '| world', 'hello', 'hello'],
    });

    newTest({
      title: 'dgn deletes the next word when cursor is at hello|',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\neldgn',
      end: ['foo', 'hello world', '|', 'hello'],
    });

    newTest({
      title: 'dgn with single-character match',
      start: ['O|ne Two Three Four Five Six'],
      keysPressed: '/T\n' + 'e' + 'dgn',
      end: ['One Two |hree Four Five Six'],
    });
  });

  suite('can handle cgn', () => {
    newTest({
      title: 'cgn deletes the next match text (from first line)',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nggcgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at |hello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\ncgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at h|ello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nlcgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at hel|lo',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\n3lcgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at hell|o',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\necgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn with single-character match',
      start: ['O|ne Two Three Four Five Six'],
      keysPressed: '/T\n' + 'e' + 'cgn',
      end: ['One Two |hree Four Five Six'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`cgn` can be repeated by dot',
      start: ['|', 'one', 'two', 'one', 'three'],
      keysPressed: '/one\n' + 'cgn' + 'XYZ' + '<Esc>' + '..',
      end: ['', 'XYZ', 'two', 'XY|Z', 'three'],
    });
  });

  suite('can handle gN', () => {
    newTest({
      title: 'gN selects the previous match text',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n' + 'G' + 'gN',
      end: ['hello world', 'hello', 'hi [hell|o]', 'foo'],
      endMode: Mode.Visual,
    });

    for (const [cursor, jump] of [
      ['hell|o', '3gg7l'],
      ['hel|lo', '3gg6l'],
      ['h|ello', '3gg4l'],
      ['|hello', '3gg3l'],
    ]) {
      newTest({
        title: `gN selects the current word at ${cursor}`,
        start: ['hello world', 'hello', 'hi hello', '|foo'],
        keysPressed: '/hello\n' + jump + 'gN',
        end: ['hello world', 'hello', 'hi [hell|o]', 'foo'],
        endMode: Mode.Visual,
      });
    }

    newTest({
      title: 'gN selects the previous word at | hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n' + '3gg2l' + 'gN',
      end: ['hello world', '[hell|o]', 'hi hello', 'foo'],
      endMode: Mode.Visual,
    });
  });

  suite('can handle dgN', () => {
    newTest({
      title: 'dgN deletes the previous match text (from first line)',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\nGdgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at hell|o',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$dgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at hel|lo',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$hdgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at h|ello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwldgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at |hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwdgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
    });

    newTest({
      title: 'dgN deletes the previous word when cursor is at | hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwhdgN',
      end: ['hello world', '|', 'hi hello', 'foo'],
    });
  });

  suite('can handle cgN', () => {
    newTest({
      title: 'cgN deletes the previous match text (from first line)',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\nGcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at hell|o',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$cgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at hel|lo',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$hcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at h|ello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwlcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at |hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the previous word when cursor is at | hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwhcgN',
      end: ['hello world', '|', 'hi hello', 'foo'],
      endMode: Mode.Insert,
    });
  });
});
