import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('Repeatable movements with f and t', () => {
  suiteSetup(setupWorkspace);
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
