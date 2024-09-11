import { newTest } from '../testSimplifier';
import { cleanUpWorkspace, setupWorkspace } from '../testUtils';

suite('incsearch motion', () => {
  suiteSetup(async () => {
    await setupWorkspace({
      config: {
        wrapscan: true,
        incsearch: true,
      },
    });
  });
  suiteTeardown(cleanUpWorkspace);

  suite('<C-g>', () => {
    newTest({
      title: '<C-g> advances current match forward during forward search.',
      start: ['|one two two two'],
      keysPressed: '/two<C-g>\n',
      end: ['one two |two two'],
    });

    newTest({
      title: '<C-g> advances current match forward during backward search.',
      start: ['one two |two two'],
      keysPressed: '?two<C-g>\n',
      end: ['one two |two two'],
    });

    newTest({
      title: '<C-g> advances current match forward by search count',
      start: ['|one two two two two two two'],
      keysPressed: '3/tw<C-g>\n',
      end: ['one two two two two two |two'],
    });

    newTest({
      title: '<C-g> wraps to top of buffer when wrapscan is true',
      start: ['|one two two two'],
      keysPressed: '/tw<C-g><C-g><C-g>\n',
      end: ['one |two two two'],
    });

    newTest({
      title: '<C-g> stops at last match in buffer when wrapscan is false',
      config: { wrapscan: false },
      start: ['|one two two two'],
      keysPressed: '/tw<C-g><C-g><C-g>\n',
      end: ['one two two |two'],
    });

    newTest({
      title:
        '<C-g> during search with count stops at last reachable match in buffer when wrapscan is false',
      config: { wrapscan: false },
      start: ['|one two two two'],
      keysPressed: '2/tw<C-g><C-g>\n',
      end: ['one two |two two'],
    });
  });

  suite('<C-t>', () => {
    newTest({
      title: '<C-t>  moves backward during forward search.',
      start: ['one |two two two'],
      keysPressed: '/two<C-t>\n',
      end: ['one |two two two'],
    });

    newTest({
      title: '<C-t> moves backward during backward search.',
      start: ['one two two |two'],
      keysPressed: '?two<C-t>\n',
      end: ['one |two two two'],
    });

    newTest({
      title: '<C-t> wraps to last match in buffer with wrapscan',
      start: ['one two |two two'],
      keysPressed: '/tw<C-t><C-t><C-t>\n',
      end: ['one two two |two'],
    });

    newTest({
      title: '<C-t> stays at first match in buffer with nowrapscan',
      config: { wrapscan: false },
      start: ['one two |two two'],
      keysPressed: '/tw<C-t><C-t><C-t>\n',
      end: ['one |two two two'],
    });

    newTest({
      title:
        '<C-t> during search with count stays at first reachable match in buffer with nowrapscan',
      config: { wrapscan: false },
      start: ['one two |two two'],
      keysPressed: '2/tw<C-t><C-t>\n',
      end: ['one two |two two'],
    });
  });
});
