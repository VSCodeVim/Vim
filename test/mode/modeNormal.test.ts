import * as assert from 'assert';
import {setupWorkspace, cleanUpWorkspace} from './../testUtils';
import ModeNormal from '../../src/mode/modeNormal';
import {ModeName} from '../../src/mode/mode';
import {Motion} from '../../src/motion/motion';

suite("Mode Normal", () => {

    setup(setupWorkspace);

    teardown(cleanUpWorkspace);

    test("can be activated", () => {
        let activationKeys = ['esc', 'ctrl+['];
        let motion = new Motion();
        let modeHandler = new ModeNormal(motion);

        for (let i = 0; i < activationKeys.length; i++) {
            let key = activationKeys[i];
            assert.equal(modeHandler.ShouldBeActivated(key, ModeName.Insert), true, key);
        }
    });
});
