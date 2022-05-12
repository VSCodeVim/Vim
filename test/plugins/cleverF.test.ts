import { Globals } from '../../src/globals';
import { newTest } from '../testSimplifier';
import { setupWorkspace, reloadConfiguration, cleanUpWorkspace } from './../testUtils';

suite('cleverF plugin', () => {
  setup(async () => {
    await setupWorkspace();
    Globals.mockConfiguration.cleverF = true;
    await reloadConfiguration();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'Can handle f motion',
    start: ['|abc abc'],
    keysPressed: 'fb',
    end: ['a|bc abc'],
  });

  newTest({
    title: 'Can handle f repeat motion',
    start: ['|abc abc'],
    keysPressed: 'fbf',
    end: ['abc a|bc'],
  });

  newTest({
    title: 'Can handle f after F, motion',
    start: ['abc abc |abc'],
    keysPressed: 'Fbf',
    end: ['abc abc a|bc'],
  });

  newTest({
    title: 'Can handle f in Visual Mode',
    start: ['|abc abc abc'],
    keysPressed: 'vfafx',
    end: ['|bc'],
  });

  newTest({
    title: 'Can handle F motion',
    start: ['abc |abc'],
    keysPressed: 'Fb',
    end: ['a|bc abc'],
  });

  newTest({
    title: 'Can handle F repeat motion',
    start: ['abc abc |abc'],
    keysPressed: 'FbF',
    end: ['a|bc abc abc'],
  });

  newTest({
    title: 'Can handle F after f motion',
    start: ['|abc abc'],
    keysPressed: 'fbF',
    end: ['a|bc abc'],
  });

  newTest({
    title: 'Can handle F in Visual Mode',
    start: ['ab'],
    keysPressed: 'vFaFcx',
    end: ['ab|'],
  });
});
