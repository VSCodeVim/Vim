import { newTest } from '../testSimplifier';
import { setupWorkspace } from '../testUtils';

suite('shift operator', () => {
  suiteSetup(setupWorkspace);

  newTest({
    title: 'basic shift left test',
    start: ['  |zxcv', '  zxcv', '  zxcv'],
    keysPressed: '<<',
    end: ['|zxcv', '  zxcv', '  zxcv'],
  });

  newTest({
    title: 'shift left goto end test',
    start: ['  |zxcv', '  zxcv', '  zxcv'],
    keysPressed: '<G',
    end: ['|zxcv', 'zxcv', 'zxcv'],
  });

  newTest({
    title: 'shift left goto line test',
    start: ['  |zxcv', '  zxcv', '  zxcv'],
    keysPressed: '<2G',
    end: ['|zxcv', 'zxcv', '  zxcv'],
  });

  newTest({
    title: 'shift right goto end test',
    start: ['|zxcv', 'zxcv', 'zxcv'],
    keysPressed: '>G',
    end: ['  |zxcv', '  zxcv', '  zxcv'],
  });

  newTest({
    title: 'shift right goto line test',
    start: ['|zxcv', 'zxcv', 'zxcv'],
    keysPressed: '>2G',
    end: ['  |zxcv', '  zxcv', 'zxcv'],
  });
});
