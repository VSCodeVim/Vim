import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('filter operator', () => {
  const { newTest, newTestOnly, newTestSkip } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

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
