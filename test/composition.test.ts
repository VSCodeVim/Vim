import { strict as assert } from 'assert';
import * as vscode from 'vscode';

import { Mode } from '../src/mode/mode';
import { ModeHandler } from '../src/mode/modeHandler';
import { ModeHandlerMap } from '../src/mode/modeHandlerMap';
import { taskQueue } from '../src/taskQueue';
import { cleanUpWorkspace, setupWorkspace } from './testUtils';

suite('IME composition commands', () => {
  let mh: ModeHandler;

  const drainQueue = () =>
    new Promise<void>((resolve) => {
      taskQueue.enqueueTask(async () => resolve());
    });

  // Queue updates without draining between commands, as during actual input.
  const command = vscode.commands.executeCommand;
  const compositionType = async (
    text: string,
    args: { replacePrevCharCnt?: number; replaceNextCharCnt?: number; positionDelta?: number } = {},
  ) => {
    await command('compositionType', {
      text,
      replacePrevCharCnt: 0,
      replaceNextCharCnt: 0,
      positionDelta: 0,
      ...args,
    });
  };

  const begin = async () => {
    await mh.handleKeyEvent('i');
    await command('compositionStart');
  };

  const end = async () => {
    await command('compositionEnd');
    await drainQueue();
  };

  // Simulate an IME with a prompt after the caret; no particular IME is required.
  // In the examples below, | denotes the caret, not a character in the document.
  const enterPrompt = async (preedit: string, prompt: string) => {
    const first = preedit.slice(0, 1);
    const partial = preedit.slice(0, 2);
    await command('type', { text: first });
    await compositionType(partial + prompt, {
      replacePrevCharCnt: first.length,
      positionDelta: -prompt.length,
    });
    await compositionType(preedit + prompt, {
      replacePrevCharCnt: partial.length,
      replaceNextCharCnt: prompt.length,
      positionDelta: -prompt.length,
    });
  };

  setup(async () => {
    await vscode.extensions.getExtension('vscodevim.vim')!.activate();
    await setupWorkspace({ fileContent: ['suffix'], forceNewFile: true });
    await drainQueue();
    ModeHandlerMap.clear();
    [mh] = await ModeHandlerMap.getOrCreate(vscode.window.activeTextEditor!);
  });

  teardown(async () => {
    await end();
    await cleanUpWorkspace();
  });

  test('commits a spelling correction without its prompt and records it for repeat and undo', async () => {
    const preedit = 'teh';
    const prompt = '[suggestion: the]';
    // t| -> te|[suggestion: the] -> teh|[suggestion: the] -> the|
    await begin();
    await enterPrompt(preedit, prompt);
    await compositionType('the', {
      replacePrevCharCnt: preedit.length,
      replaceNextCharCnt: prompt.length,
    });
    await end();
    assert.equal(mh.vimState.document.getText(), 'thesuffix');
    assert.equal(mh.vimState.editor.selection.active.character, 'the'.length);
    await mh.handleMultipleKeyEvents(['<Esc>', '.']);
    assert.equal(mh.vimState.document.getText(), 'thethesuffix');
    await mh.handleKeyEvent('u');
    assert.equal(mh.vimState.document.getText(), 'thesuffix');
  });

  test('converts an emoji shortcode using UTF-16 offsets for both the prompt and commit', async () => {
    const preedit = ':smile';
    const emoji = '\u{1F604}'; // A single character occupying two UTF-16 code units.
    const prompt = `[smile: ${emoji}]`;
    // :smile|[smile: <emoji>] -> <emoji>|
    await begin();
    await enterPrompt(preedit, prompt);
    await compositionType(emoji, {
      replacePrevCharCnt: preedit.length,
      replaceNextCharCnt: prompt.length,
    });
    await end();
    assert.equal(mh.vimState.document.getText(), emoji + 'suffix');
    assert.equal(mh.vimState.editor.selection.active.character, emoji.length);
  });

  test('accepts compositionType as the first update, then starts a fresh legacy composition', async () => {
    const preedit = 'teh';
    const prompt = '[suggestion: the]';
    await begin();
    await compositionType(preedit + prompt, { positionDelta: -prompt.length });
    await compositionType('the ', {
      replacePrevCharCnt: preedit.length,
      replaceNextCharCnt: prompt.length,
    });
    await end();
    assert.equal(mh.vimState.document.getText(), 'the suffix');

    // Correct the next word through the older replacePreviousChar command.
    await command('compositionStart');
    await command('type', { text: 'wrold' });
    await command('replacePreviousChar', { text: 'world', replaceCharCnt: 'wrold'.length });
    await end();
    assert.equal(mh.vimState.document.getText(), 'the worldsuffix');
    assert.equal(mh.vimState.editor.selection.active.character, 'the world'.length);
  });

  test('corrects text at an interior caret and preserves that caret on commit', async () => {
    // wrold| -> wro|ld -> wo|ld -> wor|ld
    await begin();
    await command('type', { text: 'wrold' });
    await compositionType('', { positionDelta: -'ld'.length });
    await command('replacePreviousChar', { text: 'o', replaceCharCnt: 'ro'.length });
    await command('type', { text: 'r' });
    await end();
    assert.equal(mh.vimState.document.getText(), 'worldsuffix');
    assert.equal(mh.vimState.editor.selection.active.character, 'wor'.length);
  });

  test('cancels a suggested correction without deleting text on either side', async () => {
    const preedit = 'teh';
    const prompt = '[suggestion: the]';
    // su<preedit>|<prompt>ffix -> su|ffix
    await mh.handleMultipleKeyEvents(['l', 'l']);
    await begin();
    await enterPrompt(preedit, prompt);
    await compositionType('', {
      replacePrevCharCnt: preedit.length,
      replaceNextCharCnt: prompt.length,
    });
    await end();
    assert.equal(mh.vimState.document.getText(), 'suffix');
    assert.equal(mh.vimState.editor.selection.active.character, 'su'.length);
  });

  test('uses a composed character as the target of normal-mode f without inserting it', async () => {
    const preedit = ':x';
    const prompt = '[letter: x]';
    // Simulate choosing x in a character picker while Vim is waiting for f's target.
    await mh.handleKeyEvent('f');
    await command('compositionStart');
    await enterPrompt(preedit, prompt);
    await compositionType('x', {
      replacePrevCharCnt: preedit.length,
      replaceNextCharCnt: prompt.length,
    });
    await end();
    assert.equal(mh.vimState.document.getText(), 'suffix');
    assert.equal(mh.vimState.cursorStopPosition.character, 'suffix'.indexOf('x'));
    assert.equal(mh.vimState.currentMode, Mode.Normal);
  });
});
