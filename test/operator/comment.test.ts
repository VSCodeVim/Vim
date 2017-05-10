"use strict";

import { setupWorkspace, cleanUpWorkspace } from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';

suite("comment operator", () => {
    let modeHandler: ModeHandler;
    let {
        newTest,
        newTestOnly,
    } = getTestingFunctions();

    setup(async () => {
        await setupWorkspace(".js");
        modeHandler = new ModeHandler();
    });

    teardown(cleanUpWorkspace);

    newTest({
      title: "gbb comments out current line",
      start: [
        "first| line",
        "second line"
      ],
      keysPressed: 'gbb',
      end: [
        "|// first line",
        "second line",
      ],
    });

    newTest({
      title: "gbj comments in current and next line",
      start: [
        "// first| line",
        "// second line",
        "third line"
      ],
      keysPressed: 'gbj',
      end: [
        "|first line",
        "second line",
        "third line"
      ],
    });

    newTest({
      title: "block comment with motion",
      start: [
        "function test(arg|1, arg2, arg3) {"
      ],
      keysPressed: 'gBi)',
      end: [
        "function test(|/*arg1, arg2, arg3*/) {"
      ]
    });

    newTest({
      title: "block comment in Visual Mode",
      start: [
        "blah |blah blah"
      ],
      keysPressed: 'vllllgB',
      end: [
        "blah |/*blah*/ blah"
      ],
      endMode: ModeName.Normal
    });

});