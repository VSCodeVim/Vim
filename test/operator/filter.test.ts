import { newTest } from '../testSimplifier';

// TODO(#4844): this fails on Windows
suite('filter operator', () => {
  if (process.platform === 'win32') {
    return;
  }

  newTest({
    title: '!! with no count',
    start: ['|'],
    keysPressed: '!!echo hello world\n',
    end: ['|hello world'],
  });

  newTest({
    title: '!! with whitespace moves cursor to first non-whitespace character',
    start: ['|'],
    keysPressed: '!!echo " hello world"\n',
    end: [' |hello world'],
  });

  newTest({
    title: '!! with count',
    start: ['|abc', 'def'],
    keysPressed: '2!!echo hello world\n',
    end: ['|hello world'],
  });

  newTest({
    title: '!{forwards motion}{filter}',
    start: ['|abc', 'def', 'ghi'],
    keysPressed: '!jecho hello world\n',
    end: ['|hello world', 'ghi'],
  });

  newTest({
    title: '!{backwards motion}{filter}',
    start: ['abc', 'def', '|ghi'],
    keysPressed: '!{echo hello world\n',
    end: ['|hello world', 'ghi'],
  });

  newTest({
    title: 'v!{filter}',
    start: ['|abc', 'def', 'ghi'],
    keysPressed: 'vjj!echo hello world\n',
    end: ['|hello world'],
  });

  newTest({
    title: 'V!{filter}',
    start: ['|abc', 'def', 'ghi'],
    keysPressed: 'Vjj!echo hello world\n',
    end: ['|hello world'],
  });

  newTest({
    title: '<Ctrl-v>!{filter}',
    start: ['|abc', 'def', 'ghi'],
    keysPressed: '<C-v>jj!echo hello world\n',
    end: ['|hello world'],
  });
});
