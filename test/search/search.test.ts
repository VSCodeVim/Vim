import { Mode } from '../../src/mode/mode';
import { newTest } from '../testSimplifier';

suite('Search (/ and ?)', () => {
  newTest({
    title: '/ does not affect mark',
    start: ['|one', 'twooo', 'thurr'],
    keysPressed: "ma/two\n'a",
    end: ['|one', 'twooo', 'thurr'],
  });

  newTest({
    title: '/ can search with regex',
    start: ['|', 'one two2o'],
    keysPressed: '/o\\do\n',
    end: ['', 'one tw|o2o'],
  });

  newTest({
    title: '/ can search with newline',
    start: ['|asdf', '__asdf', 'asdf'],
    keysPressed: '/\\nasdf\n',
    end: ['asdf', '__asd|f', 'asdf'],
  });

  newTest({
    title: '/ can search through multiple newlines',
    start: ['|asdf', '__asdf', 'asdf', 'abc', '   abc'],
    keysPressed: '/asdf\\nasdf\\nabc\n',
    end: ['asdf', '__|asdf', 'asdf', 'abc', '   abc'],
  });

  newTest({
    title: '/ with noignorecase, nosmartcase',
    config: { ignorecase: false, smartcase: false },
    start: ['bl|ah', 'blAh', 'BLAH', 'blah'],
    keysPressed: '/blah\n',
    end: ['blah', 'blAh', 'BLAH', '|blah'],
  });

  newTest({
    title: '/ with \\%V will search in last selection',
    start: ['', 'asdf', '|asdf', 'asdf', 'asdf'],
    keysPressed: 'vjj<Esc>gg/\\%Vasdf\n',
    end: ['', 'asdf', '|asdf', 'asdf', 'asdf'],
  });

  newTest({
    title: '/ with \\%V will search in last selection, starting from the cursor postion',
    start: ['', 'asdf', '|asdf', '', 'asdf', 'asdf'],
    keysPressed: 'vjjj<Esc>kk/\\%Vasdf\nn',
    end: ['', 'asdf', '|asdf', '', 'asdf', 'asdf'],
  });

  newTest({
    title: '/ matches ^ per line',
    start: ['|  asdf', 'asasdf', 'asdf', 'asdf'],
    keysPressed: '/^asdf\n',
    end: ['  asdf', 'asasdf', '|asdf', 'asdf'],
  });

  newTest({
    title: '/ matches $ per line',
    start: ['|asdfjkl', 'asdf  ', 'asdf', 'asdf'],
    keysPressed: '/asdf$\n',
    end: ['asdfjkl', 'asdf  ', '|asdf', 'asdf'],
  });

  newTest({
    title: '/ search $, walk over matches',
    start: ['|start', '', '', 'end'],
    keysPressed: '/$\nnnn',
    end: ['start', '', '', 'en|d'],
  });

  newTest({
    title: '?, match at EOL, walk over matches',
    start: ['x end', 'x', 'x', '|start'],
    keysPressed: '?x\nnn',
    end: ['|x end', 'x', 'x', 'start'],
  });

  newTest({
    title: 'Search for `(`',
    start: ['|one (two) three'],
    keysPressed: '/(\n',
    end: ['one |(two) three'],
  });

  /**
   * The escaped `/` and `?` the next tests are necessary because otherwise they denote a search offset.
   */
  newTest({
    title: 'Can search for forward slash',
    start: ['|One/two/three/four'],
    keysPressed: '/\\/\nn',
    end: ['One/two|/three/four'],
  });

  newTest({
    title: 'Can search backward for question mark',
    start: ['|One?two?three?four'],
    keysPressed: '?\\?\nn',
    end: ['One?two|?three?four'],
  });

  newTest({
    title: '/\\c forces case insensitive search',
    start: ['|__ASDF', 'asdf'],
    keysPressed: '/\\casdf\n',
    end: ['__|ASDF', 'asdf'],
  });

  newTest({
    title: '/\\C forces case sensitive search',
    start: ['|__ASDF', 'asdf'],
    keysPressed: '/\\Casdf\n',
    end: ['__ASDF', '|asdf'],
  });

  newTest({
    title: '/\\\\c does not trigger case (in)sensitivity',
    start: ['|__\\c__'],
    keysPressed: '/\\\\c\n',
    end: ['__|\\c__'],
  });

  newTest({
    title: '/\\\\\\c triggers case insensitivity',
    start: ['|__\\ASDF', 'asdf'],
    keysPressed: '/\\\\\\c\n',
    end: ['__|\\ASDF', 'asdf'],
  });

  newTest({
    title: '<C-l> adds the next character in the first match to search term',
    start: ['|foo', 'bar', 'abcd'],
    keysPressed: '/ab<C-l>d\n',
    end: ['foo', 'bar', '|abcd'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can delete with search forward',
    start: ['foo |junk junk bar'],
    keysPressed: 'd/bar\n',
    end: ['foo |bar'],
    endMode: Mode.Normal,
  });

  newTest({
    title: 'Can delete with search backward',
    start: ['foo junk garbage trash |bar'],
    keysPressed: 'd?junk\n',
    end: ['foo |bar'],
    endMode: Mode.Normal,
  });
});
