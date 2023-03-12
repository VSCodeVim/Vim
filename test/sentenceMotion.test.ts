import { newTest } from './testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

suite('sentence motion', () => {
  suiteSetup(async () => {
    await setupWorkspace(undefined, '.js');
  });
  suiteTeardown(cleanUpWorkspace);

  suite('[count] sentences backward', () => {
    newTest({
      title: 'move one sentence backward',
      start: ['lorem ipsum. lorem ipsum|'],
      keysPressed: '(',
      end: ['lorem ipsum. |lorem ipsum'],
    });

    newTest({
      title: 'move one sentence backward',
      start: ['lorem ipsum. lorem ipsum|'],
      keysPressed: '1(',
      end: ['lorem ipsum. |lorem ipsum'],
    });

    newTest({
      title: 'move [count] sentences backward',
      start: ['lorem ipsum. lorem ipsum. lorem ipsum|'],
      keysPressed: '2(',
      end: ['lorem ipsum. |lorem ipsum. lorem ipsum'],
    });

    newTest({
      title: 'move one sentence backward single line - middle',
      start: ['lorem ipsum. |lorem ipsum'],
      keysPressed: '(',
      end: ['|lorem ipsum. lorem ipsum'],
    });

    newTest({
      title: 'move one sentence backward no space',
      start: ['lorem ipsum.lorem ipsum|'],
      keysPressed: '(',
      end: ['|lorem ipsum.lorem ipsum'],
    });

    newTest({
      title: 'move one sentence backward no space - middle',
      start: ['lorem ipsum.|lorem ipsum'],
      keysPressed: '(',
      end: ['|lorem ipsum.lorem ipsum'],
    });

    newTest({
      title: 'move one sentence backward - multiline',
      start: ['lorem ipsum', 'lorem ipsum|'],
      keysPressed: '(',
      end: ['|lorem ipsum', 'lorem ipsum'],
    });

    newTest({
      title: 'move one sentence backward - multiline - period',
      start: ['lorem ipsum.', 'lorem ipsum|'],
      keysPressed: '(',
      end: ['lorem ipsum.', '|lorem ipsum'],
    });

    newTest({
      title: 'move one sentence backward - multiline - previous line',
      start: ['lorem ipsum', '|lorem ipsum'],
      keysPressed: '(',
      end: ['|lorem ipsum', 'lorem ipsum'],
    });

    newTest({
      title: 'move one sentence backward - multiline - previous line - period',
      start: ['lorem ipsum.', '|lorem ipsum'],
      keysPressed: '(',
      end: ['|lorem ipsum.', 'lorem ipsum'],
    });
  });
});
