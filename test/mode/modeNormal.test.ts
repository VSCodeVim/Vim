"use strict";

import * as assert from 'assert';
import {setupWorkspace, cleanUpWorkspace} from './../testUtils';
import {NormalMode} from '../../src/mode/modeNormal';
import {ModeName} from '../../src/mode/mode';
import {Motion} from '../../src/motion/motion';

suite("Mode Normal", () => {

    setup(setupWorkspace);

    teardown(cleanUpWorkspace);

    test("can be activated", () => {
        let activationKeys = ['esc', 'ctrl+[', 'ctrl+c'];
        let motion = new Motion(null);
        let modeHandler = new NormalMode(motion);

        for (let i = 0; i < activationKeys.length; i++) {
            let key = activationKeys[i];
            assert.equal(modeHandler.shouldBeActivated(key, ModeName.Insert), true, key);
        }
    });
});
