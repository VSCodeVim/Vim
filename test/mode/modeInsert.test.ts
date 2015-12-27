import * as assert from 'assert';

import ModeInsert from '../../src/mode/modeInsert';
import {ModeName} from '../../src/mode/mode';
import {Motion, MotionMode} from '../../src/motion/motion';
import TextEditor from '../../src/textEditor';
import TestHelpers from '../testHelpers';

let modeInsert: ModeInsert = null;
let motion : Motion = null;

suite("Mode Insert", () => {
	setup((done) => {
        motion = new Motion(MotionMode.Cursor);
        modeInsert = new ModeInsert(motion);
		TextEditor.delete().then(() => done());
	});

	teardown((done) => {
        modeInsert = null;
		TextEditor.delete().then(() => done());
	});

    test("can be activated", () => {
        let activationKeys = ['i', 'I', 'o', 'O', 'a', 'A'];

        for (let i = 0; i < activationKeys.length; i++) {
            let key = activationKeys[i];
            assert.equal(modeInsert.ShouldBeActivated(key, ModeName.Insert), true, key);
        }
    });

    test("can handle key events", () => {
        return modeInsert.HandleKeyEvent("!")
            .then(() => {
                return TestHelpers.assertEqualLines(["!"]);
            });
    });

    test("Can handle 'o'", () => {
        return TextEditor.insert("text")
            .then(() => {
                return modeInsert.HandleActivation("o");
            })
            .then(() => {
                return TestHelpers.assertEqualLines(["text", ""]);
            });
    });

    test("Can handle 'O'", () => {
        return TextEditor.insert("text")
            .then(() => {
                return modeInsert.HandleActivation("O");
            })
            .then(() => {
                return TestHelpers.assertEqualLines(["", "text"]);
            });
    });

    test("Can handle 'i'", () => {
        return TextEditor.insert("texttext")
            .then(() => {
                motion = motion.move(0, 4);
            })
            .then(() => {
                return modeInsert.HandleActivation("i");
            })
            .then(() => {
                return modeInsert.HandleKeyEvent("!");
            })
            .then(() => {
               return TestHelpers.assertEqualLines(["text!text"]);
            });
    });

    test("Can handle 'I'", () => {
        return TextEditor.insert("text")
            .then(() => {
                motion = motion.move(0, 3);
            })
            .then(() => {
                return modeInsert.HandleActivation("I");
            })
            .then(() => {
                return modeInsert.HandleKeyEvent("!");
            })
            .then(() => {
               return TestHelpers.assertEqualLines(["!text"]);
            });
    });

    test("Can handle 'a'", () => {
        return TextEditor.insert("texttext")
            .then(() => {
                motion = motion.move(0, 4);
            }).then(() => {
                return modeInsert.HandleActivation("a");
            }).then(() => {
                return modeInsert.HandleKeyEvent("!");
            }).then(() => {
               return TestHelpers.assertEqualLines(["textt!ext"]);
            });
    });

    test("Can handle 'A'", () => {
        return TextEditor.insert("text")
            .then(() => {
                motion = motion.move(0, 0);
            }).then(() => {
                return modeInsert.HandleActivation("A");
            }).then(() => {
                return modeInsert.HandleKeyEvent("!");
            }).then(() => {
               return TestHelpers.assertEqualLines(["text!"]);
            });
    });
});
