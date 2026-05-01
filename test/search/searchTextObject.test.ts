import { strict as assert } from 'assert';
import { getAndUpdateModeHandler } from '../../extensionBase';
import { Mode } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { newTest } from '../testSimplifier';
import { setupWorkspace } from '../testUtils';

suite('Search text objects (gn and gN)', () => {
  let modeHandler: ModeHandler;

  setup(async () => {
    await setupWorkspace();
    modeHandler = (await getAndUpdateModeHandler())!;
  });

  suite('can handle gn', () => {
    test(`gn selects the next match text`, async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('gg'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 'hello'.length);
      assert.strictEqual(selection.end.line, 1);
    });

    const gnSelectsCurrentWord = async (jumpCmd: string) => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents(jumpCmd.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 'hello'.length);
      assert.strictEqual(selection.end.line, 1);
    };

    test(`gn selects the current word at |hello`, async () => {
      await gnSelectsCurrentWord('2gg');
    });

    test(`gn selects the current word at h|ello`, async () => {
      await gnSelectsCurrentWord('2ggl');
    });

    test(`gn selects the current word at hel|lo`, async () => {
      await gnSelectsCurrentWord('2ggeh');
    });

    test(`gn selects the current word at hell|o`, async () => {
      await gnSelectsCurrentWord('2gge');
    });

    test(`gn selects the next word at hello|`, async () => {
      await modeHandler.handleMultipleKeyEvents('ifoo\nhello world\nhello\nhello'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('2ggel'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'n']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;

      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 2);
      assert.strictEqual(selection.end.character, 'hello'.length);
      assert.strictEqual(selection.end.line, 2);
    });
  });

  suite('can handle dgn', () => {
    newTest({
      title: 'dgn deletes the next match text (from first line)',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nggdgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at |hello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\ndgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at h|ello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nldgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at hel|lo',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\n3ldgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the current word when cursor is at hell|o',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nedgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn deletes the next word when cursor is at hello|',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\neldgn',
      end: ['foo', 'hello world', '|', 'hello'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgn with single-character match',
      start: ['O|ne Two Three Four Five Six'],
      keysPressed: '/T\n' + 'e' + 'dgn',
      end: ['One Two |hree Four Five Six'],
      endMode: Mode.Normal,
    });
  });

  suite('can handle cgn', () => {
    newTest({
      title: 'cgn deletes the next match text (from first line)',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nggcgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at |hello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\ncgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at h|ello',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\nlcgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at hel|lo',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\n3lcgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn deletes the current word when cursor is at hell|o',
      start: ['|foo', 'hello world', 'hello', 'hello'],
      keysPressed: '/hello\necgn',
      end: ['foo', '| world', 'hello', 'hello'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgn with single-character match',
      start: ['O|ne Two Three Four Five Six'],
      keysPressed: '/T\n' + 'e' + 'cgn',
      end: ['One Two |hree Four Five Six'],
      endMode: Mode.Insert,
    });

    newTest({
      title: '`cgn` can be repeated by dot',
      start: ['|', 'one', 'two', 'one', 'three'],
      keysPressed: '/one\n' + 'cgn' + 'XYZ' + '<Esc>' + '..',
      end: ['', 'XYZ', 'two', 'XY|Z', 'three'],
      endMode: Mode.Normal,
    });
  });

  suite('can handle gN', () => {
    test(`gN selects the previous match text`, async () => {
      await modeHandler.handleMultipleKeyEvents('ihello world\nhello\nhi hello\nfoo'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents(['G']);
      await modeHandler.handleMultipleKeyEvents(['g', 'N']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 'hi '.length);
      assert.strictEqual(selection.start.line, 2);
      assert.strictEqual(selection.end.character, 'hi hello'.length);
      assert.strictEqual(selection.end.line, 2);
    });

    const gnSelectsCurrentWord = async (jumpCmd: string) => {
      await modeHandler.handleMultipleKeyEvents('ihello world\nhello\nhi hello\nfoo'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents(jumpCmd.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'N']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 'hi '.length);
      assert.strictEqual(selection.start.line, 2);
      assert.strictEqual(selection.end.character, 'hi hello'.length);
      assert.strictEqual(selection.end.line, 2);
    };

    test(`gN selects the current word at hell|o`, async () => {
      await gnSelectsCurrentWord('3gg7l');
    });

    test(`gN selects the current word at hel|lo`, async () => {
      await gnSelectsCurrentWord('3gg6l');
    });

    test(`gN selects the current word at h|ello`, async () => {
      await gnSelectsCurrentWord('3gg4l');
    });

    test(`gN selects the current word at |hello`, async () => {
      await gnSelectsCurrentWord('3gg3l');
    });

    test(`gN selects the previous word at | hello`, async () => {
      await modeHandler.handleMultipleKeyEvents('ihello world\nhello\nhi hello\nfoo'.split(''));
      await modeHandler.handleMultipleKeyEvents(['<Esc>', ...'/hello\n'.split('')]);
      await modeHandler.handleMultipleKeyEvents('3gg2l'.split(''));
      await modeHandler.handleMultipleKeyEvents(['g', 'N']);

      assert.strictEqual(modeHandler.vimState.currentMode, Mode.Visual);

      const selection = modeHandler.vimState.editor.selection;
      assert.strictEqual(selection.start.character, 0);
      assert.strictEqual(selection.start.line, 1);
      assert.strictEqual(selection.end.character, 'hello'.length);
      assert.strictEqual(selection.end.line, 1);
    });
  });

  suite('can handle dgN', () => {
    newTest({
      title: 'dgN deletes the previous match text (from first line)',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\nGdgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at hell|o',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$dgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at hel|lo',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$hdgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at h|ello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwldgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the current word when cursor is at |hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwdgN',
      end: ['hello world', 'hello', 'hi| ', 'foo'],
      endMode: Mode.Normal,
    });

    newTest({
      title: 'dgN deletes the previous word when cursor is at | hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwhdgN',
      end: ['hello world', '|', 'hi hello', 'foo'],
      endMode: Mode.Normal,
    });
  });

  suite('can handle cgN', () => {
    newTest({
      title: 'cgN deletes the previous match text (from first line)',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\nGcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at hell|o',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$cgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at hel|lo',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3gg$hcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at h|ello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwlcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the current word when cursor is at |hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwcgN',
      end: ['hello world', 'hello', 'hi |', 'foo'],
      endMode: Mode.Insert,
    });

    newTest({
      title: 'cgN deletes the previous word when cursor is at | hello',
      start: ['hello world', 'hello', 'hi hello', '|foo'],
      keysPressed: '/hello\n3ggwhcgN',
      end: ['hello world', '|', 'hi hello', 'foo'],
      endMode: Mode.Insert,
    });
  });
});
