import { getAndUpdateModeHandler } from '../../extension';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('comment operator', () => {
  let modeHandler: ModeHandler;
  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace('.js');
    modeHandler = await getAndUpdateModeHandler();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'gcc comments out current line',
    start: ['first line', '|second line'],
    keysPressed: 'gcc',
    end: ['first line', '|// second line'],
  });

  newTest({
    title: 'gcj comments in current and next line',
    start: ['// first| line', '// second line', 'third line'],
    keysPressed: 'gcj',
    end: ['|first line', 'second line', 'third line'],
  });

  newTest({
    title: 'block comment with motion',
    start: ['function test(arg|1, arg2, arg3) {'],
    keysPressed: 'gCi)',
    end: ['function test(|/* arg1, arg2, arg3 */) {'],
  });

  newTest({
    title: 'block comment in Visual Mode',
    start: ['blah |blah blah'],
    keysPressed: 'vllllgC',
    end: ['blah |/* blah */ blah'],
    endMode: ModeName.Normal,
  });
});
