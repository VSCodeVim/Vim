import { newTest, newTestSkip } from './testSimplifier';
import { setupWorkspace } from './testUtils';

suite('Multicursor', () => {
  setup(setupWorkspace);

  suite('Motions', () => {
    for (const foldfix of [true, false]) {
      suite(`j and k ${foldfix ? '(foldfix)' : ''}`, () => {
        newTest({
          title: 'j',
          config: { foldfix },
          start: ['l|ine 1', 'lin|e 2', 'line 3'],
          keysPressed: 'j',
          end: ['line 1', 'l|ine 2', 'lin|e 3'],
        });

        newTest({
          title: 'j (at bottom)',
          config: { foldfix },
          start: ['line 1', 'l|ine 2', 'lin|e 3'],
          keysPressed: 'j',
          end: ['line 1', 'line 2', 'l|in|e 3'],
        });

        newTest({
          title: 'k',
          config: { foldfix },
          start: ['line 1', 'l|ine 2', 'lin|e 3'],
          keysPressed: 'k',
          end: ['l|ine 1', 'lin|e 2', 'line 3'],
        });

        // TODO: Fix for foldfix
        (foldfix ? newTestSkip : newTest)({
          title: 'k (at top)',
          config: { foldfix },
          start: ['l|ine 1', 'lin|e 2', 'line 3'],
          keysPressed: 'k',
          end: ['l|in|e 1', 'line 2', 'line 3'],
        });
      });
    }
  });

  suite('Macros', () => {
    newTest({
      title: 'Can record and play macros with multiple cursors',
      start: ['|one', '|two', '|three'],
      keysPressed: 'qx' + 'A!' + '<Esc>' + 'q' + '2@x',
      end: ['one!!|!', 'two!!|!', 'three!!|!'],
    });
  });

  suite('Undo/redo', () => {
    newTest({
      title: 'Can undo with multiple cursors',
      start: ['|one', '|two', '|three'],
      keysPressed: 'l' + 'iXXX<Esc>' + '$' + 'u',
      end: ['o|ne', 't|wo', 't|hree'],
    });
  });

  suite('Delete', () => {
    newTest({
      title: 'x (Normal mode)',
      start: ['|cat', 'c|at', 'ca|t'],
      keysPressed: 'x',
      end: ['|at', 'c|t', 'c|a'],
    });

    // TODO: `D`

    newTest({
      title: 'd (Visual mode)',
      start: ['|cat', 'c|at', 'ca|t'],
      keysPressed: 'vl' + 'd',
      end: ['|t', '|c', 'c|a'],
    });

    // TODO: VisualBlock mode

    newTest({
      title: 'dit on empty tag blocks moves each cursor inside its own tag',
      start: ['<bli|nk></blink>', '<a|></a>'],
      keysPressed: 'dit',
      end: ['<blink>|</blink>', '<a>|</a>'],
    });
  });

  suite('Replace', () => {
    newTest({
      title: 'r (Normal mode)',
      start: ['|cat', 'c|at', 'ca|t'],
      keysPressed: 'rX',
      end: ['|Xat', 'c|Xt', 'ca|X'],
    });

    newTest({
      title: 'r (Visual mode)',
      start: ['|cat', 'c|at', 'ca|t'],
      keysPressed: 've' + 'rX',
      end: ['|XXX', 'c|XX', 'ca|X'],
    });

    newTest({
      title: 'r (VisualBlock mode)',
      start: ['|ca|t', 'cat', 'cat'],
      keysPressed: '<C-v>jj' + 'rX',
      end: ['|Xa|X', 'XaX', 'XaX'],
    });
  });

  newTest({
    title: 'can add multiple cursors below',
    start: ['|11', '22'],
    steps: [
      {
        keysPressed: process.platform === 'darwin' ? '<D-alt+down>' : '<C-alt+down>',
        end: ['|11', '|22'],
      },
      { keysPressed: 'cw33<Esc>', end: ['3|3', '3|3'] },
    ],
  });

  newTest({
    title: 'can add multiple cursors above',
    start: ['11', '22', '|33'],
    steps: [
      {
        keysPressed: (process.platform === 'darwin' ? '<D-alt+up>' : '<C-alt+up>').repeat(2),
        end: ['|11', '|22', '|33'],
      },
      { keysPressed: 'cw44<Esc>', end: ['4|4', '4|4', '4|4'] },
    ],
  });

  newTest({
    title: 'viwd with multicursors deletes the words and keeps the cursors',
    start: ['|foo dont delete', 'bar', 'dont foo'],
    steps: [
      { keysPressed: 'gbgb<Esc>b', end: ['|foo dont delete', 'bar', 'dont |foo'] },
      { keysPressed: 'viwd', end: ['| dont delete', 'bar', 'dont| '] },
    ],
  });

  newTest({
    title: 'vibd with multicursors deletes the content between brackets and keeps the cursors',
    start: ['[(|foo) asd ]', '[(bar) asd ]', '[(foo) asd ]'],
    steps: [
      { keysPressed: 'gbgb<Esc>b', end: ['[(|foo) asd ]', '[(bar) asd ]', '[(|foo) asd ]'] },
      { keysPressed: 'vibd', end: ['[(|) asd ]', '[(bar) asd ]', '[(|) asd ]'] },
    ],
  });

  newTest({
    title: 'vi[d with multicursors deletes the content between brackets and keeps the cursors',
    start: ['[(|foo) asd ]', '[(bar) asd ]', '[(foo) asd ]'],
    steps: [
      { keysPressed: 'gbgb<Esc>b', end: ['[(|foo) asd ]', '[(bar) asd ]', '[(|foo) asd ]'] },
      { keysPressed: 'vi[d', end: ['[|]', '[(bar) asd ]', '[|]'] },
    ],
  });

  newTest({
    title: 'vitd with multicursors deletes the content between tags and keeps the cursors',
    start: ['<div> |foo bar</div> asd', '<div>foo asd</div>'],
    steps: [
      { keysPressed: 'gbgb<Esc>b', end: ['<div> |foo bar</div> asd', '<div>|foo asd</div>'] },
      { keysPressed: 'vitd', end: ['<div>|</div> asd', '<div>|</div>'] },
    ],
  });

  newTest({
    title: 'Can use "/" search with multicursors',
    start: ['|line 1', 'line 2', 'line 3', 'line 4', 'line 5'],
    keysPressed: '3<C-alt+down>v/ne \nd<Esc>',
    end: ['|e 1', 'e 2', 'e 3', 'e 4', 'line 5'],
  });

  newTest({
    title: 'Can use "?" search with multicursors',
    start: ['line 1', 'line 2', 'line 3', 'line 4', 'line |5'],
    keysPressed: '3<C-alt+up>v?ine\nd<Esc>',
    end: ['line 1', '|l', 'l', 'l', 'l'],
  });
});

suite('Multicursor with remaps', () => {
  setup(async () => {
    await setupWorkspace({
      config: {
        insertModeKeyBindings: [
          {
            before: ['j', 'j', 'k'],
            after: ['<esc>'],
          },
        ],
      },
    });
  });

  newTest({
    title: "Using 'jjk' mapped to '<Esc>' doesn't leave trailing characters",
    start: ['o|ne', 'two'],
    keysPressed: '<C-v>jAfoojjk<Esc>',
    end: ['onfo|oe', 'twfooo'],
  });
});

suite('Multicursor selections', () => {
  setup(async () => {
    await setupWorkspace({
      config: {
        normalModeKeyBindings: [
          {
            before: ['<leader>', 'a', 'f'],
            commands: ['editor.action.smartSelect.grow'],
          },
        ],
        leader: ' ',
      },
    });
  });

  newTest({
    title:
      'Can handle combined multicursor selections without leaving ghost selection changes behind',
    start: ['|this is a test', '1', '2', 'this is another test', '1', '2', '3', '4', '5'],
    keysPressed: 'gbgb<Esc>Vjjj<Esc><Esc>gg afd',
    end: ['| is a test', '1', '2', 'this is another test', '1', '2', '3', '4', '5'],
  });
});
