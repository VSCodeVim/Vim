import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('put operator', () => {
  const { newTest, newTestOnly, newTestSkip } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'basic put test',
    start: ['blah bla|h'],
    keysPressed: '^Dpp',
    end: ['blah blahblah bla|h'],
  });

  newTest({
    title: 'test yy end of line',
    start: ['blah blah', 'bla|h'],
    keysPressed: '^yyp',
    end: ['blah blah', 'blah', '|blah'],
  });

  newTest({
    title: 'test yy first line',
    start: ['blah blah', 'bla|h'],
    keysPressed: 'ggyyp',
    end: ['blah blah', '|blah blah', 'blah'],
  });

  newTest({
    title: 'test yy middle line',
    start: ['1', '2', '|3'],
    keysPressed: 'kyyp',
    end: ['1', '2', '|2', '3'],
  });

  newTest({
    title: 'test yy with correct positon movement',
    start: ['o|ne', 'two', 'three', 'four'],
    keysPressed: '2yyjjpk',
    end: ['one', 'two', '|three', 'one', 'two', 'four'],
  });

  newTest({
    title: 'test visual block single line yank p',
    start: ['12|345'],
    keysPressed: '<C-v>llyhp',
    end: ['12|345345'],
  });

  newTest({
    title: 'test visual block single line yank P',
    start: ['12|345'],
    keysPressed: '<C-v>llyhP',
    end: ['1|3452345'],
  });

  newTest({
    title: 'test visual block single line delete p',
    start: ['12|345'],
    keysPressed: '<C-v>lldhp',
    end: ['1|3452'],
  });

  newTest({
    title: 'test visual block single line delete P',
    start: ['12|345'],
    keysPressed: '<C-v>lldhP',
    end: ['|34512'],
  });
});
