import * as assert from 'assert';

import ModeInsert from '../../src/mode/modeInsert';
import {ModeName} from '../../src/mode/mode';
import {Cursor} from '../../src/motion/motion';
import TextEditor from '../../src/textEditor';
import * as testUtils from '../testUtils';

let modeHandler: ModeInsert = null;

suite("Mode Insert", () => {
	setup((done) => {
        modeHandler = new ModeInsert();
		TextEditor.delete().then(() => done());
	});

	teardown((done) => {
        modeHandler = null;
		TextEditor.delete().then(() => done());
	});

    test("can be activated", () => {
        let activationKeys = ['i', 'I', 'o', 'O', 'a', 'A'];

        for (let i = 0; i < activationKeys.length; i++) {
            let key = activationKeys[i];
            assert.equal(modeHandler.ShouldBeActivated(key, ModeName.Insert), true, key);
        }
    });

    test("can handle key events", (done) => {
        let expected = "!";

        modeHandler.HandleKeyEvent("!")
            .then(() => {
                return testUtils.assertTextEditorText(expected);
            }).then(done, done);
    });

    test("Can handle 'o'", (done) => {
        let expected = "text\n";

        TextEditor.insert("text")
            .then(() => {
                return modeHandler.HandleActivation("o");
            }).then(() => {
                return testUtils.assertTextEditorText(expected);
            }).then(done, done);
    });

    test("Can handle 'O'", (done) => {
        let expected = "\ntext";

        TextEditor.insert("text")
            .then(() => {
                return modeHandler.HandleActivation("O");
            }).then(() => {
                return testUtils.assertTextEditorText(expected);
            }).then(done, done);
    });

    test("Can handle 'i'", (done) => {
        let expected = "text!text";

        TextEditor.insert("texttext")
            .then(() => {
                new Cursor(0, 4).move();
            }).then(() => {
                return modeHandler.HandleActivation("i");
            }).then(() => {
                return modeHandler.HandleKeyEvent("!");
            }).then(() => {
               return testUtils.assertTextEditorText(expected);
            }).then(done, done);
    });

    test("Can handle 'I'", (done) => {
        let expected = "!text";

        TextEditor.insert("text")
            .then(() => {
                new Cursor(0, 4).move();
            }).then(() => {
                return modeHandler.HandleActivation("I");
            }).then(() => {
                return modeHandler.HandleKeyEvent("!");
            }).then(() => {
               return testUtils.assertTextEditorText(expected);
            }).then(done, done);
    });

    test("Can handle 'a'", (done) => {
        let expected = "textt!ext";

        TextEditor.insert("texttext")
            .then(() => {
                new Cursor(0, 4).move();
            }).then(() => {
                return modeHandler.HandleActivation("a");
            }).then(() => {
                return modeHandler.HandleKeyEvent("!");
            }).then(() => {
               return testUtils.assertTextEditorText(expected);
            }).then(done, done);
    });

    test("Can handle 'A'", (done) => {
        let expected = "text!";

        TextEditor.insert("text")
            .then(() => {
                new Cursor(0, 0).move();
            }).then(() => {
                return modeHandler.HandleActivation("A");
            }).then(() => {
                return modeHandler.HandleKeyEvent("!");
            }).then(() => {
               return testUtils.assertTextEditorText(expected);
            }).then(done, done);
    });
});
