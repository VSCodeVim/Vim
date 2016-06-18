"use strict";

import { setupWorkspace, cleanUpWorkspace, assertEqualLines,assertEqual } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';

suite("Mode Normal", () => {
    let modeHandler: ModeHandler = new ModeHandler();

    let {
        newTest,
    } = getTestingFunctions(modeHandler);

    setup(async () => {
        await setupWorkspace();
    });

    teardown(cleanUpWorkspace);

    test("can be activated", async () => {
        let activationKeys = ['<esc>', '<ctrl-[>'];

        for (let key of activationKeys) {
            await modeHandler.handleKeyEvent('i');
            await modeHandler.handleKeyEvent(key);

            assertEqual(modeHandler.currentMode.name, ModeName.Normal);
        }

        await modeHandler.handleKeyEvent('v');
        await modeHandler.handleKeyEvent('v');

        assertEqual(modeHandler.currentMode.name, ModeName.Normal);
    });

    test("Can handle 'x'", async () => {
        await modeHandler.handleMultipleKeyEvents([
            'i',
            't', 'e', 'x', 't',
            '<esc>',
            '^', 'l', 'l',
            'x',
        ]);

        assertEqualLines(["tet"]);
    });

    test("Can handle 'dw'", async () => {
        await modeHandler.handleMultipleKeyEvents(
            'itext text text'.split('')
        );

        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            '^', 'w',
            'd', 'w'
        ]);

        await assertEqualLines(["text text"]);
        await modeHandler.handleMultipleKeyEvents(['d', 'w']);

        await assertEqualLines(["text "]);

        await modeHandler.handleMultipleKeyEvents(['d', 'w']);
        await assertEqualLines(["text"]);
    });

    test("Can handle dd last line", async () => {
        await modeHandler.handleMultipleKeyEvents("ione\ntwo".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'd', 'd'
        ]);

        assertEqualLines(["one"]);
    });

    test("Can handle dd single line", async () => {
        await modeHandler.handleMultipleKeyEvents("ione".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>',
            'd', 'd'
        ]);

        assertEqualLines([""]);
    });

    test("Can handle dd", async () => {
        await modeHandler.handleMultipleKeyEvents("ione\ntwo".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', 'g', 'g',
            'd', 'd'
        ]);

        assertEqualLines(["two"]);
    });


    test("Can handle dd empty line", async () => {
        await modeHandler.handleMultipleKeyEvents("ione\n\ntwo".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', 'g', 'g', 'j',
            'd', 'd'
        ]);

        assertEqualLines(["one", "two"]);
    });

    test("Can handle cc", async () => {
        await modeHandler.handleMultipleKeyEvents("ione\none two".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'c', 'c', 'a', '<esc>'
        ]);

        assertEqualLines(["one", "a"]);
    });


    test("Can handle yy", async () => {
        await modeHandler.handleMultipleKeyEvents("ione".split(""));
        await modeHandler.handleMultipleKeyEvents([
            '<esc>', '^',
            'y', 'y', 'O', '<esc>', 'p'
        ]);

        assertEqualLines(["", "one", "one"]);
    });

    newTest({
      title: "Can handle 'de'",
      start: ['text tex|t'],
      keysPressed: '^de',
      end: ['| text'],
    });

    newTest({
      title: "Can handle 'de' then 'de' again",
      start: ['text tex|t'],
      keysPressed: '^dede',
      end: ['|'],
    });

    newTest({
      title: "Can handle 'db'",
      start: ['text tex|t'],
      keysPressed: '$db',
      end: ['text |t'],
    });

    newTest({
      title: "Can handle 'db then 'db' again",
      start: ['text tex|t'],
      keysPressed: '$dbdb',
      end: ['|t'],
    });

    newTest({
      title: "Can handle 'dl' at end of line",
      start: ['bla|h'],
      keysPressed: '$dldldl',
      end: ['|b'],
    });

    newTest({
      title: "Can handle 'D'",
      start: ['tex|t'],
      keysPressed: '^llD',
      end: ['t|e'],
    });

    newTest({
      title: "Can handle 'DD'",
      start: ['tex|t'],
      keysPressed: '^llDD',
      end: ['|t'],
    });

    newTest({
      title: "Can handle 'ge'",
      start: ['text tex|t'],
      keysPressed: '$ge',
      end: ['tex|t text'],
    });

    newTest({
      title: "Can handle 'gg'",
      start: ['text', 'text', 'tex|t'],
      keysPressed: '$jkjgg',
      end: ['|text', 'text', 'text'],
    });

    newTest({
      title: "Can handle x at end of line",
      start: ['one tw|o'],
      keysPressed: '^llxxxxxxxxx',
      end: ['|'],
    });

    newTest({
      title: "Can handle 'C'",
      start: ['tex|t'],
      keysPressed: '^llC',
      end: ['te|'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'cw'",
      start: ['text text tex|t'],
      keysPressed: '^lllllllcw',
      end: ['text te| text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 's'",
      start: ['tex|t'],
      keysPressed: '^sk',
      end: ['k|ext'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Retain same column when moving up/down",
      start: ['text text', 'text', 'text tex|t'],
      keysPressed: 'kk',
      end: ['text tex|t', 'text', 'text text'],
});

    newTest({
      title: "$ always keeps cursor on EOL",
      start: ['text text', 'text', 'text tex|t'],
      keysPressed: 'gg$jj',
      end: ['text text', 'text', 'text tex|t'],
});

    newTest({
      title: "Can handle 'ciw'",
      start: ['text text tex|t'],
      keysPressed: '^lllllllciw',
      end: ['text | text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'ciw' on blanks",
      start: ['text   text tex|t'],
      keysPressed: '^lllllciw',
      end: ['text|text text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw'",
      start: ['text text tex|t'],
      keysPressed: '^llllllcaw',
      end: ['text |text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw' on first letter",
      start: ['text text tex|t'],
      keysPressed: '^lllllcaw',
      end: ['text |text'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'caw' on blanks",
      start: ['text   tex|t'],
      keysPressed: '^lllllcaw',
      end: ['text|'],
      endMode: ModeName.Insert
    });

    newTest({
      title: "Can handle 'f'",
      start: ['text tex|t'],
      keysPressed: '^ft',
      end: ['tex|t text']
    });

    newTest({
      title: "Can handle 'df'",
      start: ['aext tex|t'],
      keysPressed: '^dft',
      end: ['| text']
    });

    newTest({
      title: "Can handle 'dt'",
      start: ['aext tex|t'],
      keysPressed: '^dtt',
      end: ['|t text']
    });

    newTest({
      title: "Can handle 'f' twice",
      start: ['text tex|t'],
      keysPressed: '^ftft',
      end: ['text |text']
    });

    newTest({
      title: "Can handle 'F'",
      start: ['text tex|t'],
      keysPressed: '$Ft',
      end: ['text |text']
    });

    newTest({
      title: "Can handle 'F' twice",
      start: ['text tex|t'],
      keysPressed: '$FtFt',
      end: ['tex|t text']
    });

    newTest({
      title: "Can handle 't'",
      start: ['text tex|t'],
      keysPressed: '^tt',
      end: ['te|xt text']
    });

    newTest({
      title: "Can handle 't' twice",
      start: ['text tex|t'],
      keysPressed: '^tttt',
      end: ['te|xt text']
    });

    newTest({
      title: "Can handle 'T'",
      start: ['text tex|t'],
      keysPressed: '$Tt',
      end: ['text t|ext']
    });

    newTest({
      title: "Can handle 'T' twice",
      start: ['text tex|t'],
      keysPressed: '$TtTt',
      end: ['text t|ext']
    });

    newTest({
      title: "Can handle 'r'",
      start: ['tex|t'],
      keysPressed: 'hrs',
      end: ['te|st']
    });

    newTest({
      title: "Can handle 'r' after 'dd'",
      start: ['one', 'two', 'thre|e'],
      keysPressed: 'kddrT',
      end: ['one', '|Three']
    });

    newTest({
      title: "Can handle 'J' once",
      start: ['one', 'tw|o'],
      keysPressed: 'kJ',
      end: ['one| two']
    });

    newTest({
      title: "Can handle 'J' twice",
      start: ['one', 'two', 'thre|e'],
      keysPressed: 'kkJJ',
      end: ['one two| three']
    });

    newTest({
      title: "Can handle 'J' with empty last line",
      start: ['one', 'two', '|'],
      keysPressed: 'kJ',
      end: ['one', 'two| ']
    });

    newTest({
      title: "Can handle 'J's with multiple empty last lines",
      start: ['one', 'two', '', '', '', '|'],
      keysPressed: 'kkkkkJJJJJ',
      end: ['one two| ']
    });

    newTest({
      title: "Can handle 'J' with leading white space on next line",
      start: ['one', ' tw|o'],
      keysPressed: 'kJ',
      end: ['one| two']
    });

    newTest({
      title: "Can handle 'J' with ')' first character on next line",
      start: ['one(', ')tw|o'],
      keysPressed: 'kJ',
      end: ['one(|)two']
    });

    newTest({
      title: "Can handle 'P' after 'yy'",
      start: ['one', 'tw|o'],
      keysPressed: 'yyP',
      end: ['one', '|two', 'two']
    });

    newTest({
      title: "Can handle 'p' after 'yy'",
      start: ['one', 'tw|o'],
      keysPressed: 'yyp',
      end: ['one', 'two', '|two']
    });

});
