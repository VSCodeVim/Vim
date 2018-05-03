import { getAndUpdateModeHandler } from '../../extension';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('put operator', () => {
  let modeHandler: ModeHandler;

  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
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
});
