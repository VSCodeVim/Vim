"use strict";

import { setupWorkspace, setTextEditorOptions, cleanUpWorkspace } from './../testUtils';
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
        setTextEditorOptions(4, false);
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
});