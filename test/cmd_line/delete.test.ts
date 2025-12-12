import { newTest } from '../testSimplifier';

suite(':d[elete]', () => {
  newTest({
    title: ':d',
    start: ['line 1', 'li|ne 2', 'line 3'],
    keysPressed: ':d' + '\n',
    end: ['line 1', '|line 3'],
  });

  newTest({
    title: ':2,3d',
    start: ['line 1', 'li|ne 2', 'line 3'],
    keysPressed: ':2,3d' + '\n',
    end: ['|line 1'],
  });

  newTest({
    title: ':d 2',
    start: ['line 1', 'li|ne 2', 'line 3'],
    keysPressed: ':d 2' + '\n',
    end: ['|line 1'],
  });
});
