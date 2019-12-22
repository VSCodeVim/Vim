import { Globals } from '../../src/globals';
import { getTestingFunctions } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace, reloadConfiguration } from './../testUtils';

suite('sneak plugin', () => {
  const { newTest, newTestOnly, newTestSkip } = getTestingFunctions();

  setup(async () => {
    await setupWorkspace();
    Globals.mockConfiguration.sneak = true;
    await reloadConfiguration();
  });

  teardown(cleanUpWorkspace);

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

  newTest({
    title: 'Can handle single letter s motion',
    start: ['|abc abc'],
    keysPressed: 'sa\n',
    end: ['abc |abc'],
  });

  newTest({
    title: 'Can handle single letter S motion',
    start: ['abc |abc'],
    keysPressed: 'Sa\n',
    end: ['|abc abc'],
  });

  newTest({
    title: 'Can handle single letter <operator>z motion',
    start: ['|abc abc'],
    keysPressed: 'dza\n',
    end: ['|abc'],
  });

  newTest({
    title: 'Can handle single letter <operator>Z motion',
    start: ['abc |abc'],
    keysPressed: 'dZa\n',
    end: ['|abc'],
  });

  newTest({
    title: 'Can handle single letter s; motion',
    start: ['|abc abc abc'],
    keysPressed: 'sa\n;',
    end: ['abc abc |abc'],
  });

  newTest({
    title: 'Can handle single letter s, motion',
    start: ['abc abc| abc'],
    keysPressed: 'sa\n,',
    end: ['abc |abc abc'],
  });

  newTest({
    title: 'Can handle single letter S; motion',
    start: ['abc abc |abc'],
    keysPressed: 'Sa\n;',
    end: ['|abc abc abc'],
  });

  newTest({
    title: 'Can handle single letter S, motion',
    start: ['abc abc| abc'],
    keysPressed: 'Sa\n,',
    end: ['abc abc |abc'],
  });

  newTest({
    title: 'Can handle multiline single char <number>s motion',
    start: ['|abc', 'aac', 'abc'],
    keysPressed: '3sa\n',
    end: ['abc', 'aac', '|abc'],
  });
});
