"use strict";

import { setupWorkspace, cleanUpWorkspace} from './../testUtils';
import { ModeName } from '../../src/mode/mode';
import { ModeHandler } from '../../src/mode/modeHandler';
import { getTestingFunctions } from '../testSimplifier';

suite("Mode Replace", () => {
    let modeHandler: ModeHandler = new ModeHandler();

    let {
      newTest,
      newTestOnly,
    } = getTestingFunctions(modeHandler);

    setup(async () => {
      await setupWorkspace();
    });

    teardown(cleanUpWorkspace);

    newTest({
      title: "Can handle R",
      start: ['123|456'],
      keysPressed: 'Rab',
      end: ["123ab|6"]
    });

    newTest({
      title: "Can handle R",
      start: ['123|456'],
      keysPressed: 'Rabcd',
      end: ["123abcd|"]
    });

    newTest({
      title: "Can handle R across lines",
      start: ['123|456', '789'],
      keysPressed: 'Rabcd\nefg',
      end: ["123abcd", "efg|", "789"]
    });

    newTest({
      title: "Can handle backspace",
      start: ['123|456'],
      keysPressed: 'Rabc<backspace><backspace><backspace>',
      end: ["123|456"]
    });

    newTest({
      title: "Can handle backspace",
      start: ['123|456'],
      keysPressed: 'Rabcd<backspace><backspace><backspace><backspace><backspace>',
      end: ["12|3456"]
    });

    newTest({
      title: "Can handle backspace across lines",
      start: ['123|456'],
      keysPressed: 'Rabcd\nef<backspace><backspace><backspace><backspace><backspace>',
      end: ["123ab|6"]
    });

    newTest({
      title: "Can handle arrows",
      start: ['123|456'],
      keysPressed: 'Rabc<left><backspace><backspace>',
      end: ["123|abc"]
    });

    newTest({
      title: "Can handle .",
      start: ['123|456', '123456'],
      keysPressed: 'Rabc<escape>j0.',
      end: ["123abc", "ab|c456"]
    });

    newTest({
      title: "Can handle . across lines",
      start: ['123|456', '123456'],
      keysPressed: 'Rabc\ndef<escape>j0.',
      end: ["123abc", "def", "abc", "de|f"]
    });
});