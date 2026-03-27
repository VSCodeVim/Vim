import { newTest } from './testSimplifier';
import { setupWorkspace } from './testUtils';

suite('Motion with count optimization', () => {
  suiteSetup(setupWorkspace);

  suite('j motion with count', () => {
    newTest({
      title: 'Can handle j with count 1',
      start: ['|line 1', 'line 2', 'line 3', 'line 4', 'line 5'],
      keysPressed: '1j',
      end: ['line 1', '|line 2', 'line 3', 'line 4', 'line 5'],
    });

    newTest({
      title: 'Can handle j with count 3',
      start: ['|line 1', 'line 2', 'line 3', 'line 4', 'line 5'],
      keysPressed: '3j',
      end: ['line 1', 'line 2', 'line 3', '|line 4', 'line 5'],
    });

    newTest({
      title: 'Can handle j with large count (20)',
      start: [
        '|line 1',
        'line 2',
        'line 3',
        'line 4',
        'line 5',
        'line 6',
        'line 7',
        'line 8',
        'line 9',
        'line 10',
        'line 11',
        'line 12',
        'line 13',
        'line 14',
        'line 15',
        'line 16',
        'line 17',
        'line 18',
        'line 19',
        'line 20',
        'line 21',
      ],
      keysPressed: '20j',
      end: [
        'line 1',
        'line 2',
        'line 3',
        'line 4',
        'line 5',
        'line 6',
        'line 7',
        'line 8',
        'line 9',
        'line 10',
        'line 11',
        'line 12',
        'line 13',
        'line 14',
        'line 15',
        'line 16',
        'line 17',
        'line 18',
        'line 19',
        'line 20',
        '|line 21',
      ],
    });

    newTest({
      title: 'Can handle j with count exceeding line count',
      start: ['|line 1', 'line 2', 'line 3'],
      keysPressed: '10j',
      end: ['line 1', 'line 2', '|line 3'],
    });

    newTest({
      title: 'Can handle j with count and maintains column',
      start: ['|abc', '123', 'xyz'],
      keysPressed: '2j',
      end: ['abc', '123', '|xyz'],
    });
  });

  suite('k motion with count', () => {
    newTest({
      title: 'Can handle k with count 1',
      start: ['line 1', 'line 2', 'line 3', 'line 4', '|line 5'],
      keysPressed: '1k',
      end: ['line 1', 'line 2', 'line 3', '|line 4', 'line 5'],
    });

    newTest({
      title: 'Can handle k with count 3',
      start: ['line 1', 'line 2', 'line 3', 'line 4', '|line 5'],
      keysPressed: '3k',
      end: ['line 1', '|line 2', 'line 3', 'line 4', 'line 5'],
    });

    newTest({
      title: 'Can handle k with large count (20)',
      start: [
        'line 1',
        'line 2',
        'line 3',
        'line 4',
        'line 5',
        'line 6',
        'line 7',
        'line 8',
        'line 9',
        'line 10',
        'line 11',
        'line 12',
        'line 13',
        'line 14',
        'line 15',
        'line 16',
        'line 17',
        'line 18',
        'line 19',
        'line 20',
        '|line 21',
      ],
      keysPressed: '20k',
      end: [
        '|line 1',
        'line 2',
        'line 3',
        'line 4',
        'line 5',
        'line 6',
        'line 7',
        'line 8',
        'line 9',
        'line 10',
        'line 11',
        'line 12',
        'line 13',
        'line 14',
        'line 15',
        'line 16',
        'line 17',
        'line 18',
        'line 19',
        'line 20',
        'line 21',
      ],
    });

    newTest({
      title: 'Can handle k with count exceeding line count',
      start: ['line 1', 'line 2', '|line 3'],
      keysPressed: '10k',
      end: ['|line 1', 'line 2', 'line 3'],
    });
  });

  suite('h motion with count', () => {
    newTest({
      title: 'Can handle h with count 3',
      start: ['abc|def'],
      keysPressed: '3h',
      end: ['|abcdef'],
    });

    newTest({
      title: 'Can handle h with count exceeding line begin',
      start: ['ab|cdef'],
      keysPressed: '5h',
      end: ['|abcdef'],
    });
  });

  suite('l motion with count', () => {
    newTest({
      title: 'Can handle l with count 3',
      start: ['|abcdef'],
      keysPressed: '3l',
      end: ['abc|def'],
    });

    newTest({
      title: 'Can handle l with count exceeding line end',
      start: ['|abcdef'],
      keysPressed: '10l',
      end: ['abcde|f'],
    });
  });

  suite('j/k with operators', () => {
    newTest({
      title: 'Can handle dj with count',
      start: ['|line 1', 'line 2', 'line 3', 'line 4', 'line 5'],
      keysPressed: 'd3j',
      end: ['|line 5'],
    });

    newTest({
      title: 'Can handle dk with count',
      start: ['line 1', 'line 2', 'line 3', '|line 4', 'line 5'],
      keysPressed: 'd2k',
      end: ['line 1', '|line 5'],
    });

    newTest({
      title: 'Can handle yj with count',
      start: ['|line 1', 'line 2', 'line 3', 'line 4', 'line 5'],
      keysPressed: 'y2jp',
      end: ['line 1', 'line 2', 'line 3', 'line 1', 'line 2', '|line 3', 'line 4', 'line 5'],
    });
  });
});
