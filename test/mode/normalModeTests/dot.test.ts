"use strict";

import { setupWorkspace, cleanUpWorkspace, assertEqual } from './../../testUtils';
import { ModeHandler } from '../../../src/mode/modeHandler';
import { getTestingFunctions } from '../../testSimplifier';

suite("Dot Operator", () => {
    let modeHandler: ModeHandler = new ModeHandler();

    let {
        newTest,
        newTestOnly
    } = getTestingFunctions(modeHandler);

    setup(async () => {
        await setupWorkspace();
    });

    teardown(cleanUpWorkspace);

    newTest({
      title: "Can repeat '~'",
      start: ['|text'],
      keysPressed: '4~',
      end: ['TEX|T']
    });

    newTest({
      title: "Can handle dot with A",
      start: ['|one', 'two', 'three'],
      keysPressed: 'A!<esc>j.j.',
      end: ['one!', 'two!', 'three|!']
    });

    newTest({
      title: "Can handle dot with I",
      start: ['on|e', 'two', 'three'],
      keysPressed: 'I!<esc>j.j.',
      end: ['!one', '!two', '|!three']
    });
});