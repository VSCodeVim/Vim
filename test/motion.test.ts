import * as assert from 'assert';
import * as vscode from "vscode";
import TextEditor from './../src/textEditor';
import {Motion, MotionMode} from './../src/motion/motion';
import {setupWorkspace, cleanUpWorkspace} from './testUtils';

suite("motion", () => {
    let motionModes = [MotionMode.Caret, MotionMode.Cursor];
    let text: Array<string> = [
        "mary had",
        "a",
        "little lamb",
        " whose fleece was "
    ];

    suiteSetup(() => {
        return setupWorkspace().then(() => {
            return TextEditor.insert(text.join('\n'));
        });
    });

    suiteTeardown(cleanUpWorkspace);

    test("char right: should move one column right", () => {
        motionModes.forEach(o => {
            let motion = new Motion(o).move(0, 0);
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 0);

            let next = motion.right().move();
            assert.equal(next.position.line, 0);
            assert.equal(next.position.character, 1);

            let curPos = vscode.window.activeTextEditor.selection.active;
            assert.equal(next.position.line, curPos.line);
            assert.equal(next.position.character, curPos.character);
        });
    });

    test("char right: caret", () => {
        let motion = new Motion(MotionMode.Caret);

        motion = motion.move(0, 7).right();
        assert.equal(motion.position.line, 0);
        assert.equal(motion.position.character, 7);
    });

    test("char right: cursor", () => {
        let motion = new Motion(MotionMode.Cursor);
        motion = motion.move(0, 8).right();

        assert.equal(motion.position.line, 0);
        assert.equal(motion.position.character, 8);
    });

    test("char left: should move cursor one column left", () => {
        motionModes.forEach(o => {
            let motion = new Motion(o).move(0, 5);
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 5);

            motion = motion.left().move();
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 4);

            let curPos = vscode.window.activeTextEditor.selection.active;
            assert.equal(motion.position.line, curPos.line);
            assert.equal(motion.position.character, curPos.character);
        });
    });

    test("char left: left-most column should stay at the same location", () => {
        motionModes.forEach(o => {
            let motion = new Motion(o).move(0, 0);
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 0);

            motion = motion.left().move();
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 0);

            let curPos = vscode.window.activeTextEditor.selection.active;
            assert.equal(motion.position.line, curPos.line);
            assert.equal(motion.position.character, curPos.character);
        });
    });

    test("line down: should move cursor one line down", () => {
        motionModes.forEach(o => {
            let motion = new Motion(o).move(1, 0);
            assert.equal(motion.position.line, 1);
            assert.equal(motion.position.character, 0);

            motion = motion.down().move();
            assert.equal(motion.position.line, 2);
            assert.equal(motion.position.character, 0);

            let curPos = vscode.window.activeTextEditor.selection.active;
            assert.equal(motion.position.line, curPos.line);
            assert.equal(motion.position.character, curPos.character);
        });
    });

    test("line down: bottom-most line should stay at the same location", () => {
        motionModes.forEach(o => {
            let motion = new Motion(o).move(3, 0);
            assert.equal(motion.position.line, 3);
            assert.equal(motion.position.character, 0);

            motion = motion.down().move();
            assert.equal(motion.position.line, 3);
            assert.equal(motion.position.character, 0);

            let curPos = vscode.window.activeTextEditor.selection.active;
            assert.equal(motion.position.line, curPos.line);
            assert.equal(motion.position.character, curPos.character);
        });
    });

    suite("line up", () => {
        motionModes.forEach(o => {
            test("should move cursor one line up", () => {
                let motion = new Motion(o).move(1, 0);
                assert.equal(motion.position.line, 1);
                assert.equal(motion.position.character, 0);

                motion = motion.up().move();
                assert.equal(motion.position.line, 0);
                assert.equal(motion.position.character, 0);

                let curPos = vscode.window.activeTextEditor.selection.active;
                assert.equal(motion.position.line, curPos.line);
                assert.equal(motion.position.character, curPos.character);
            });

            test("top-most line should stay at the same location", () => {
                let motion = new Motion(o).move(0, 1);
                assert.equal(motion.position.line, 0);
                assert.equal(motion.position.character, 1);

                motion = motion.up().move();
                assert.equal(motion.position.line, 0);
                assert.equal(motion.position.character, 1);

                let curPos = vscode.window.activeTextEditor.selection.active;
                assert.equal(motion.position.line, curPos.line);
                assert.equal(motion.position.character, curPos.character);
            });
        });
    });

    test("keep same column as up/down", () => {
        let motion = new Motion(MotionMode.Caret).move(0, 2);

        motion = motion.down();
        assert.equal(motion.position.line, 1);
        assert.equal(motion.position.character, 0);

        motion = motion.down();
        assert.equal(motion.position.line, 2);
        assert.equal(motion.position.character, 2);
    });

    test("line begin", () => {
        motionModes.forEach(o => {
            let motion = new Motion(o).move(0, 3).lineBegin();
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 0);
        });
    });

    test("line end", () => {
        let motion = new Motion(MotionMode.Cursor).move(0, 0).lineEnd();
        assert.equal(motion.position.line, 0);
        assert.equal(motion.position.character, text[0].length);

        motion = motion.move(2, 0).lineEnd();
        assert.equal(motion.position.line, 2);
        assert.equal(motion.position.character, text[2].length);
    });

    test("document begin", () => {
        motionModes.forEach(o => {
            let motion = new Motion(o).move(1, 0).documentBegin();
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 0);
        });
    });

    test("document end", () => {
        let motion = new Motion(MotionMode.Cursor).move(0, 0).documentEnd();
        assert.equal(motion.position.line, text.length - 1);
        assert.equal(motion.position.character, text[text.length - 1].length);
    });

    suite("word right", () => {
        test("move to word right", () => {
            let motion = new Motion(MotionMode.Caret).move(0, 0).wordRight();
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 5);
        });

        test("last word should stay on line at last character", () => {
            let motion = new Motion(MotionMode.Caret).move(0, 6).wordRight();
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 7);
        });

        test("end of line should move to next word on next line", () => {
            let motion = new Motion(MotionMode.Caret).move(0, 7).wordRight();
            assert.equal(motion.position.line, 1);
            assert.equal(motion.position.character, 0);
        });
    });

    suite("word left", () => {
        test("move cursor word left", () => {
            let motion = new Motion(MotionMode.Caret).move(0, 3).wordLeft();
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 0);
        });

        test("first word should move to previous line of end of line", () => {
            let motion = new Motion(MotionMode.Caret).move(2, 0).wordLeft();
            assert.equal(motion.position.line, 1);
            assert.equal(motion.position.character, 0);
        });
    });

    test("line begin cursor on first non-blank character", () => {
        let motion = new Motion(MotionMode.Caret).move(3, 3).firstLineNonBlankChar();
        assert.equal(motion.position.line, 0);
        assert.equal(motion.position.character, 0);
    });

    test("last line begin cursor on first non-blank character", () => {
        let motion = new Motion(MotionMode.Caret).move(0, 0).lastLineNonBlankChar();
        assert.equal(motion.position.line, 3);
        assert.equal(motion.position.character, 1);
    });
});


suite("paragraph motion", () => {
    let text: Array<string> = [
        "this text has", // 0
        "",              // 1
        "many",          // 2
        "paragraphs",    // 3
        "",              // 4
        "",              // 5
        "in it.",        // 6
        "",              // 7
        "WOW"            // 8
    ];

    suiteSetup(() => {
        return setupWorkspace().then(() => {
            return TextEditor.insert(text.join('\n'));
        });
    });

    suiteTeardown(cleanUpWorkspace);

    suite("paragraph down", () => {
        test("move down normally", () => {
            let motion = new Motion(MotionMode.Caret).move(0, 0).goToEndOfCurrentParagraph();
            assert.equal(motion.position.line, 1);
            assert.equal(motion.position.character, 0);
        });

        test("move down longer paragraph", () => {
            let motion = new Motion(MotionMode.Caret).move(2, 0).goToEndOfCurrentParagraph();
            assert.equal(motion.position.line, 4);
            assert.equal(motion.position.character, 0);
        });

        test("move down starting inside empty line", () => {
            let motion = new Motion(MotionMode.Caret).move(4, 0).goToEndOfCurrentParagraph();
            assert.equal(motion.position.line, 7);
            assert.equal(motion.position.character, 0);
        });

        test("paragraph at end of document", () => {
            let motion = new Motion(MotionMode.Caret).move(7, 0).goToEndOfCurrentParagraph();
            assert.equal(motion.position.line, 8);
            assert.equal(motion.position.character, 2);
        });
    });

    suite("paragraph up", () => {
        test("move up short paragraph", () => {
            let motion = new Motion(MotionMode.Caret).move(1, 0).goToBeginningOfCurrentParagraph();
            assert.equal(motion.position.line, 0);
            assert.equal(motion.position.character, 0);
        });

        test("move up longer paragraph", () => {
            let motion = new Motion(MotionMode.Caret).move(3, 0).goToBeginningOfCurrentParagraph();
            assert.equal(motion.position.line, 1);
            assert.equal(motion.position.character, 0);
        });

        test("move up starting inside empty line", () => {
            let motion = new Motion(MotionMode.Caret).move(5, 0).goToBeginningOfCurrentParagraph();
            assert.equal(motion.position.line, 1);
            assert.equal(motion.position.character, 0);
        });
    });
});