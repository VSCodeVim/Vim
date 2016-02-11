import * as assert from 'assert';
import {setupWorkspace, cleanUpWorkspace, assertEqualLines} from './../testUtils';
import ModeNormal from '../../src/mode/modeNormal';
import {ModeName} from '../../src/mode/mode';
import {Motion, MotionMode} from '../../src/motion/motion';
import TextEditor from '../../src/textEditor';

suite("Mode Normal", () => {

    let motion : Motion;
    let modeNormal : ModeNormal;

    setup(() => {
        return setupWorkspace().then(() => {
            motion = new Motion(MotionMode.Cursor);
            modeNormal = new ModeNormal(motion);
        });
    });

    teardown(cleanUpWorkspace);

    test("can be activated", () => {
        let activationKeys = ['esc', 'ctrl+[', 'ctrl+c'];

        for (let i = 0; i < activationKeys.length; i++) {
            let key = activationKeys[i];
            assert.equal(modeNormal.ShouldBeActivated(key, ModeName.Insert), true, key);
        }
    });

    test("Can handle 'x'", () => {
        return TextEditor.insert("text")
            .then(() => {
                motion = motion.move(0, 2);
            })
            .then(() => {
                return modeNormal.HandleKeyEvent("x");
            })
            .then(() => {
                return assertEqualLines(["tet"]);
            })
            .then(() => {
                return modeNormal.HandleKeyEvent("x");
            })
            .then(() => {
                return assertEqualLines(["te"]);
            });
    });
});
