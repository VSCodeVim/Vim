import * as assert from 'assert';

import ModeNormal from '../../src/mode/modeNormal';
import {ModeName} from '../../src/mode/mode';

suite("Mode Normal", () => {
    test("can be activated", () => {
        let activationKeys = ['esc', 'ctrl+['];

        let modeHandler = new ModeNormal();

        for (let i = 0; i < activationKeys.length; i++) {
            let key = activationKeys[i];
            assert.equal(modeHandler.ShouldBeActivated(key, ModeName.Insert), true, key);
        }
    });
});
