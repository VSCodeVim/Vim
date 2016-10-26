"use strict";

import * as assert from 'assert';
import { ModeHandler } from '../../src/mode/modeHandler';
import { setupWorkspace, cleanUpWorkspace, assertEqualLines, assertEqual } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { TextEditor } from '../../src/textEditor';
import { getTestingFunctions } from '../testSimplifier';

suite("Mode Visual", () => {
  let modeHandler: ModeHandler = new ModeHandler();

  let {
    newTest,
    newTestOnly,
  } = getTestingFunctions(modeHandler);

  setup(async () => {
    await setupWorkspace();
    modeHandler = new ModeHandler();
  });

  teardown(cleanUpWorkspace);

  test("can be activated", async () => {
    await modeHandler.handleKeyEvent('v');
    assertEqual(modeHandler.currentMode.name, ModeName.Visual);

    await modeHandler.handleKeyEvent('v');
    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  test("Can handle w", async () => {
    await modeHandler.handleMultipleKeyEvents("itest test test\ntest\n".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', 'g', 'g',
      'v', 'w'
    ]);

    const sel = TextEditor.getSelection();

    assert.equal(sel.start.character, 0);
    assert.equal(sel.start.line, 0);

    // The input cursor comes BEFORE the block cursor. Try it out, this
    // is how Vim works.
    assert.equal(sel.end.character, 5);
    assert.equal(sel.end.line, 0);
  });

  test("Can handle wd", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'v', 'w', 'd'
    ]);

    assertEqualLines(["wo three"]);
  });

  test("Can handle x", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'v', 'x'
    ]);

    assertEqualLines(["ne two three"]);

    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  test("Can handle U", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
    await modeHandler.handleMultipleKeyEvents([
       '<Esc>', '^',
      'v', 'U'
    ]);

    assertEqualLines(["One two three"]);

    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  test("Can handle x across a selection", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'v', 'w', 'x'
    ]);

    assertEqualLines(["wo three"]);

    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  test("Can do vwd in middle of sentence", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three foar".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'l', 'l', 'l', 'l',
      'v', 'w', 'd'
    ]);

    assertEqualLines(["one hree foar"]);
  });

  test("Can do vwd in middle of sentence", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'l', 'l', 'l', 'l',
      'v', 'w', 'd'
    ]);

    assertEqualLines(["one hree"]);
  });

  test("Can do vwd multiple times", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three four".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'v', 'w', 'd',
      'v', 'w', 'd',
      'v', 'w', 'd'
    ]);

    assertEqualLines(["our"]);
  });

  test("Can handle U across a selection", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'v', 'l', 'l', 'l', 'l', 'U'
    ]);

    assertEqualLines(["ONE Two three"]);

    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  test("Can handle U across a selection in reverse order", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'w', 'v', 'h', 'h', 'U'
    ]);

    assertEqualLines(["onE Two three"]);

    assertEqual(modeHandler.currentMode.name, ModeName.Normal);
  });

  test("handles case where we go from selecting on right side to selecting on left side", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'l', 'l', 'l', 'l',
      'v', 'w', 'b', 'b', 'd'
    ]);

    assertEqualLines(["wo three"]);
  });

  test("handles case where we delete over a newline", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two\n\nthree four".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '0', 'k', 'k',
      'v', '}', 'd'
    ]);

    assertEqualLines(["three four"]);
  });

  test("handles change operator", async () => {
    await modeHandler.handleMultipleKeyEvents("ione two three".split(""));
    await modeHandler.handleMultipleKeyEvents([
      '<Esc>', '^',
      'v', 'w', 'c'
    ]);

    assertEqualLines(["wo three"]);
    assertEqual(modeHandler.currentMode.name, ModeName.Insert);
  });

  suite("Vim's EOL handling is weird", () => {

    test("delete through eol", async () => {
      await modeHandler.handleMultipleKeyEvents(
        'ione\ntwo'.split('')
      );

      await modeHandler.handleMultipleKeyEvents([
        '<Esc>',
        '^', 'g', 'g',
        'v', 'l', 'l', 'l',
        'd'
      ]);

      assertEqualLines(["two"]);
    });

    test("join 2 lines by deleting through eol", async () => {
      await modeHandler.handleMultipleKeyEvents(
        'ione\ntwo'.split('')
      );

      await modeHandler.handleMultipleKeyEvents([
        '<Esc>',
        'g', 'g',
        'l', 'v', 'l', 'l',
        'd'
      ]);

      assertEqualLines(["otwo"]);
    });

    test("d$ doesn't delete whole line", async () => {
      await modeHandler.handleMultipleKeyEvents(
        'ione\ntwo'.split('')
      );

      await modeHandler.handleMultipleKeyEvents([
        '<Esc>',
        'g', 'g',
        'd', '$'
      ]);

      assertEqualLines(["", "two"]);
    });

    test("vd$ does delete whole line", async () => {
      await modeHandler.handleMultipleKeyEvents(
        'ione\ntwo'.split('')
      );

      await modeHandler.handleMultipleKeyEvents([
        '<Esc>',
        'g', 'g',
        'v', '$', 'd'
      ]);

      assertEqualLines(["two"]);
    });

  });

  suite("Arrow keys work perfectly in Visual Line Mode", () => {
    newTest({
      title: "Can handle <up> key",
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'V<up>x',
      end: ['blah', '|hur']
    });

    newTest({
      title: "Can handle <down> key",
      start: ['blah', 'duh', '|dur', 'hur'],
      keysPressed: 'V<down>x',
      end: ['blah', '|duh']
    });
  });

  suite("Can handle d correctly in Visual Line Mode", () => {
    newTest({
      title: "Can handle d key",
      start: ['|{', '  a = 1;', '}'],
      keysPressed: 'VGdp',
      end: ['', '|{', '  a = 1;', '}']
    });

    newTest({
      title: "Can handle d key",
      start: ['|{', '  a = 1;', '}'],
      keysPressed: 'VGdP',
      end: ['|{', '  a = 1;', '}', '']
    });

    newTest({
      title: "Can handle d key",
      start: ['1', '2', '|{', '  a = 1;', '}'],
      keysPressed: 'VGdp',
      end: ['1', '2', '|{', '  a = 1;', '}']
    });

    newTest({
      title: "Can handle d key",
      start: ['1', '2', '|{', '  a = 1;', '}'],
      keysPressed: 'VGdP',
      end: ['1', '|{', '  a = 1;', '}', '2']
    });
  });

  suite("handles replace in visual line mode", () => {
    newTest({
      title: "Can do a single line replace",
      start: ["one |two three four five", "one two three four five"],
      keysPressed: "Vr1",
      end: ["|11111111111111111111111", "one two three four five"],
      endMode: ModeName.Normal
    });

    newTest({
      title: "Can do a multi visual line replace",
      start: ["one |two three four five", "one two three four five"],
      keysPressed: "Vjr1",
      end: ["|11111111111111111111111", "11111111111111111111111"],
      endMode: ModeName.Normal
    });
  });

});
