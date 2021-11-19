import { Globals } from '../../src/globals';
import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace, reloadConfiguration } from './../testUtils';

suite('sneak plugin', () => {
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
    end: ['|c'],
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
    end: ['|bc'],
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

  newTest({
    title: 'Can go back using <C-o> once when going forward',
    start: ['|abc abc'],
    keysPressed: 'sab<C-o>',
    end: ['|abc abc'],
  });

  newTest({
    title: 'Can go back using <C-o> once when going backward',
    start: ['abc |abc'],
    keysPressed: 'Sab<C-o>',
    end: ['abc |abc'],
  });

  newTest({
    title: 'Can go back using <C-o> when repeating forward movement',
    start: ['|abc abc abc'],
    keysPressed: 'sab;<C-o>',
    end: ['|abc abc abc'],
  });

  newTest({
    title: 'Can go back using <C-o> when repeating backward movement',
    start: ['abc abc |abc'],
    keysPressed: 'sab;<C-o>',
    end: ['abc abc |abc'],
  });
});

suite('sneakReplacesF', () => {
  setup(async () => {
    await setupWorkspace();
    Globals.mockConfiguration.sneak = true;
    Globals.mockConfiguration.sneakReplacesF = true;
    await reloadConfiguration();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'sneakReplacesF forward',
    start: ['|apple', 'banana', 'carrot'],
    keysPressed: 'fa;',
    end: ['apple', 'ban|ana', 'carrot'],
  });

  newTest({
    title: 'sneakReplacesF backward',
    start: ['apple', 'banana', '|carrot'],
    keysPressed: 'Fa;',
    end: ['apple', 'ban|ana', 'carrot'],
  });
});

suite('sneakLabelMode', () => {
  setup(async () => {
    await setupWorkspace();
    Globals.mockConfiguration.sneak = true;
    Globals.mockConfiguration.sneakLabelMode = true;
    Globals.mockConfiguration.sneakLabelTargets = ';sftunq/SFGHLTUNRMQZ?0';
    await reloadConfiguration();
  });

  teardown(cleanUpWorkspace);

  newTest({
    title: 'Can handle forward label mode',
    start: ['|abc', 'abc', 'abc', 'abc'],
    keysPressed: 'sabs',
    end: ['abc', 'abc', 'abc', '|abc'],
  });

  newTest({
    title: 'Can handle backward label mode',
    start: ['abc', 'abc', 'abc', '|abc'],
    keysPressed: 'Sabs',
    end: ['|abc', 'abc', 'abc', 'abc'],
  });

  newTest({
    title: 'Can handle <operator>z in label mode',
    start: ['|abc', 'abc', 'abc', 'abc'],
    keysPressed: 'dzabs',
    end: ['|c', 'abc'],
  });

  newTest({
    title: 'Can handle <operator>Z label mode',
    start: ['abc', 'abc', 'abc', '|abc'],
    keysPressed: 'dZabs',
    end: ['abc', '|abc'],
  });
});
