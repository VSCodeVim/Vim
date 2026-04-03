import * as assert from 'assert';
import { getAndUpdateModeHandler } from '../extension';
import { ModeHandler } from '../src/mode/modeHandler';
import { newTest, newTestSkip } from './testSimplifier';
import { assertEqualLines, setupWorkspace } from './testUtils';

suite('Multicursor', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

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

  test('can add multiple cursors below', async () => {
    await setupWorkspace({ fileContent: ['11', '22'] });
    await modeHandler.handleMultipleKeyEvents(['g', 'g']);

    if (process.platform === 'darwin') {
      await modeHandler.handleMultipleKeyEvents(['<D-alt+down>']);
    } else {
      await modeHandler.handleMultipleKeyEvents(['<C-alt+down>']);
    }

    assert.strictEqual(modeHandler.vimState.cursors.length, 2, 'Cursor successfully created.');
    await modeHandler.handleMultipleKeyEvents(['c', 'w', '3', '3', '<Esc>']);
    assertEqualLines(['33', '33']);
  });

  test('can add multiple cursors above', async () => {
    await setupWorkspace({ fileContent: ['11', '22', '33'] });
    await modeHandler.handleMultipleKeyEvents(['G']);

    if (process.platform === 'darwin') {
      await modeHandler.handleMultipleKeyEvents(['<D-alt+up>', '<D-alt+up>']);
    } else {
      await modeHandler.handleMultipleKeyEvents(['<C-alt+up>', '<C-alt+up>']);
    }

    assert.strictEqual(modeHandler.vimState.cursors.length, 3, 'Cursor successfully created.');
    await modeHandler.handleMultipleKeyEvents(['c', 'w', '4', '4', '<Esc>']);
    assertEqualLines(['44', '44', '44']);
  });

  test('viwd with multicursors deletes the words and keeps the cursors', async () => {
    await setupWorkspace({ fileContent: ['foo dont delete', 'bar', 'dont foo'] });
    await modeHandler.handleMultipleKeyEvents(['g', 'g']);

    await modeHandler.handleMultipleKeyEvents(['g', 'b', 'g', 'b', '<Esc>', 'b']);

    assert.strictEqual(modeHandler.vimState.cursors.length, 2, 'Cursor successfully created.');
    await modeHandler.handleMultipleKeyEvents(['v', 'i', 'w', 'd']);
    assertEqualLines([' dont delete', 'bar', 'dont ']);
    assert.strictEqual(modeHandler.vimState.cursors.length, 2);
  });

  test('vibd with multicursors deletes the content between brackets and keeps the cursors', async () => {
    await setupWorkspace({ fileContent: ['[(foo) asd ]', '[(bar) asd ]', '[(foo) asd ]'] });
    await modeHandler.handleMultipleKeyEvents(['g', 'g', 'l', 'l']);

    await modeHandler.handleMultipleKeyEvents(['g', 'b', 'g', 'b', '<Esc>', 'b']);

    assert.strictEqual(modeHandler.vimState.cursors.length, 2, 'Cursor successfully created.');
    await modeHandler.handleMultipleKeyEvents(['v', 'i', 'b', 'd']);
    assertEqualLines(['[() asd ]', '[(bar) asd ]', '[() asd ]']);
    assert.strictEqual(modeHandler.vimState.cursors.length, 2);
  });

  test('vi[d with multicursors deletes the content between brackets and keeps the cursors', async () => {
    await setupWorkspace({ fileContent: ['[(foo) asd ]', '[(bar) asd ]', '[(foo) asd ]'] });
    await modeHandler.handleMultipleKeyEvents(['g', 'g', 'l', 'l']);

    await modeHandler.handleMultipleKeyEvents(['g', 'b', 'g', 'b', '<Esc>', 'b']);

    assert.strictEqual(modeHandler.vimState.cursors.length, 2, 'Cursor successfully created.');
    await modeHandler.handleMultipleKeyEvents(['v', 'i', '[', 'd']);
    assertEqualLines(['[]', '[(bar) asd ]', '[]']);
    assert.strictEqual(modeHandler.vimState.cursors.length, 2);
  });

  test('vitd with multicursors deletes the content between tags and keeps the cursors', async () => {
    await setupWorkspace({ fileContent: ['<div> foo bar</div> asd', '<div>foo asd</div>'] });
    await modeHandler.handleMultipleKeyEvents(['g', 'g', 'W']);

    await modeHandler.handleMultipleKeyEvents(['g', 'b', 'g', 'b', '<Esc>', 'b']);

    assert.strictEqual(modeHandler.vimState.cursors.length, 2, 'Cursor successfully created.');
    await modeHandler.handleMultipleKeyEvents(['v', 'i', 't', 'd']);
    assertEqualLines(['<div></div> asd', '<div></div>']);
    assert.strictEqual(modeHandler.vimState.cursors.length, 2);
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
