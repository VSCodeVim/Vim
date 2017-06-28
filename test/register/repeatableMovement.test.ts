
import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines } from '../testUtils';
import { getTestingFunctions } from '../testSimplifier';

suite('register', () => {
  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
  });

  suiteTeardown(cleanUpWorkspace);

  newTest({
    title: 'Can repeat f<character>',
    start: ['|abc abc abc'],
    keysPressed: 'fa;',
    end: ['abc abc |abc'],
  });

  newTest({
    title: 'Can repeat reversed F<character>',
    start: ['|abc abc abc'],
    keysPressed: 'fa$,',
    end: ['abc abc |abc'],
  });

  newTest({
    title: 'Can repeat t<character>',
    start: ['|abc abc abc'],
    keysPressed: 'tc;',
    end: ['abc a|bc abc'],
  });

  newTest({
    title: 'Can repeat N times reversed t<character>',
    start: ['|abc abc abc abc'],
    keysPressed: 'tc$3,',
    end: ['abc| abc abc abc'],
  });
});
