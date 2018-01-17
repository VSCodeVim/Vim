import { getAndUpdateModeHandler } from '../../extension';
import { Configuration } from '../../src/configuration/configuration';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './../testUtils';

suite('sneak plugin', () => {
  let modeHandler: ModeHandler;
  let { newTest, newTestOnly } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
    Configuration.sneak = true;
  });

  teardown(async () => {
    Configuration.sneak = false;
    await cleanUpWorkspace();
  });

  newTest({
    title: 'Can handle s motion',
    start: ['|abc abc'],
    keysPressed: 'sab',
    end: ['abc |abc'],
  });

  newTest({
    title: 'Can handle S motion',
    start: ['abc |abc'],
    keysPressed: 'Sab',
    end: ['|abc abc'],
  });

  newTest({
    title: 'Can handle <operator>z motion',
    start: ['|abc abc'],
    keysPressed: 'dzab',
    end: ['|abc'],
  });

  newTest({
    title: 'Can handle <operator>Z motion',
    start: ['abc |abc'],
    keysPressed: 'dZab',
    end: ['|abc'],
  });

  newTest({
    title: 'Can handle s; motion',
    start: ['|abc abc abc'],
    keysPressed: 'sab;',
    end: ['abc abc |abc'],
  });

  newTest({
    title: 'Can handle s, motion',
    start: ['abc abc| abc'],
    keysPressed: 'sab,',
    end: ['abc |abc abc'],
  });

  newTest({
    title: 'Can handle S; motion',
    start: ['abc abc |abc'],
    keysPressed: 'Sab;',
    end: ['|abc abc abc'],
  });

  newTest({
    title: 'Can handle S, motion',
    start: ['abc abc| abc'],
    keysPressed: 'Sab,',
    end: ['abc abc |abc'],
  });
});
