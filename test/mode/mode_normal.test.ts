import * as assert from 'assert';

import ModeNormal from '../../src/mode/mode_normal';
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
