"use strict";

import * as assert from 'assert';
import { TextEditor } from './../src/textEditor';
import { Position } from './../src/common/motion/position';
import { setupWorkspace, cleanUpWorkspace } from './testUtils';
import { ModeHandler } from './../src/mode/modeHandler';
import { getTestingFunctions } from './testSimplifier';

suite("old motion tests", () => {
  let text: string[] = [
    "mary had",
    "a",
    "little lamb",
    " whose fleece was "
  ];

  suiteSetup(async () => {
    await setupWorkspace();
    await TextEditor.insert(text.join('\n'));
  });

  suiteTeardown(cleanUpWorkspace);

  test("char right: should move one column right", () => {
      let position = new Position(0, 0);
      assert.equal(position.line, 0);
      assert.equal(position.character, 0);

      let next = position.getRight();
      assert.equal(next.line, 0);
      assert.equal(next.character, 1);
  });

  test("char right", () => {
    let motion = new Position(0, 9);
    motion = motion.getRight();

    assert.equal(motion.line, 0);
    assert.equal(motion.character, 9);
  });

  test("char left: should move cursor one column left", () => {
    let position = new Position(0, 5);
    assert.equal(position.line, 0);
    assert.equal(position.character, 5);

    position = position.getLeft();
    assert.equal(position.line, 0);
    assert.equal(position.character, 4);
  });

  test("char left: left-most column should stay at the same location", () => {
    let motion = new Position(0, 0);
    assert.equal(motion.line, 0);
    assert.equal(motion.character, 0);

    motion = motion.getLeft();
    assert.equal(motion.line, 0);
    assert.equal(motion.character, 0);
  });

  test("line down: should move cursor one line down", () => {
    let motion = new Position(1, 0);
    assert.equal(motion.line, 1);
    assert.equal(motion.character, 0);

    motion = motion.getDown(0);
    assert.equal(motion.line, 2);
    assert.equal(motion.character, 0);
  });

  test("line down: bottom-most line should stay at the same location", () => {
    let motion = new Position(3, 0);
    assert.equal(motion.line, 3);
    assert.equal(motion.character, 0);

    motion = motion.getDown(3);
    assert.equal(motion.line, 3);
    assert.equal(motion.character, 0);
  });

  suite("line up", () => {
      test("should move cursor one line up", () => {
        let position = new Position(1, 0);
        assert.equal(position.line, 1);
        assert.equal(position.character, 0);

        position = position.getUp(0);
        assert.equal(position.line, 0);
        assert.equal(position.character, 0);
      });

      test("top-most line should stay at the same location", () => {
        let motion = new Position(0, 1);
        assert.equal(motion.line, 0);
        assert.equal(motion.character, 1);

        motion = motion.getUp(0);
        assert.equal(motion.line, 0);
        assert.equal(motion.character, 1);
      });
  });

  test("line begin", () => {
      let motion = new Position(0, 3).getLineBegin();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 0);
  });

  test("line end", () => {
    let motion = new Position(0, 0).getLineEnd();
    assert.equal(motion.line, 0);
    assert.equal(motion.character, text[0].length);

    motion = new Position(2, 0).getLineEnd();
    assert.equal(motion.line, 2);
    assert.equal(motion.character, text[2].length);
  });

  test("document begin", () => {
      let motion = new Position(1, 0).getDocumentBegin();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 0);
  });

  test("document end", () => {
    let motion = new Position(0, 0).getDocumentEnd();
    assert.equal(motion.line, text.length - 1);
    assert.equal(motion.character, text[text.length - 1].length);
  });

  test("line begin cursor on first non-blank character", () => {
    let motion = new Position(0, 3).getFirstLineNonBlankChar();
    assert.equal(motion.line, 0);
    assert.equal(motion.character, 0);
  });

  test("last line begin cursor on first non-blank character", () => {
    let motion = new Position(3, 0).getFirstLineNonBlankChar();
    assert.equal(motion.line, 3);
    assert.equal(motion.character, 1);
  });
});

suite("word motion", () => {
  let text: string[] = [
    "if (true) {",
    "  return true;",
    "} else {",
    "",
    "  return false;",
    "  ",
    "} // endif"
  ];

  suiteSetup(() => {
    return setupWorkspace().then(() => {
      return TextEditor.insert(text.join('\n'));
    });
  });

  suiteTeardown(cleanUpWorkspace);

  suite("word right", () => {
    test("move to word right", () => {
      let motion = new Position(0, 3).getWordRight();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 4);
    });

    test("last word should move to next line", () => {
      let motion = new Position(0, 10).getWordRight();
      assert.equal(motion.line, 1);
      assert.equal(motion.character, 2);
    });

    test("last word should move to next line stops on empty line", () => {
      let motion = new Position(2, 7).getWordRight();
      assert.equal(motion.line, 3);
      assert.equal(motion.character, 0);
    });

    test("last word should move to next line skips whitespace only line", () => {
      let motion = new Position(4, 14).getWordRight();
      assert.equal(motion.line, 6);
      assert.equal(motion.character, 0);
    });

    test("last word on last line should go to end of document (special case!)", () => {
      let motion = new Position(6, 6).getWordRight();
      assert.equal(motion.line, 6);
      assert.equal(motion.character, 10);
    });

  });

  suite("word left", () => {
    test("move cursor word left across spaces", () => {
      let motion = new Position(0, 3).getWordLeft();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 0);
    });

    test("move cursor word left within word", () => {
      let motion = new Position(0, 5).getWordLeft();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 4);
    });

    test("first word should move to previous line, beginning of last word", () => {
      let motion = new Position(1, 2).getWordLeft();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 10);
    });

    test("first word should move to previous line, stops on empty line", () => {
      let motion = new Position(4, 2).getWordLeft();
      assert.equal(motion.line, 3);
      assert.equal(motion.character, 0);
    });

    test("first word should move to previous line, skips whitespace only line", () => {
      let motion = new Position(6, 0).getWordLeft();
      assert.equal(motion.line, 4);
      assert.equal(motion.character, 14);
    });
  });

  suite("WORD right", () => {
    test("move to WORD right", () => {
      let motion = new Position(0, 3).getBigWordRight();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 10);
    });

    test("last WORD should move to next line", () => {
      let motion = new Position(1, 10).getBigWordRight();
      assert.equal(motion.line, 2);
      assert.equal(motion.character, 0);
    });

    test("last WORD should move to next line stops on empty line", () => {
      let motion = new Position(2, 7).getBigWordRight();
      assert.equal(motion.line, 3);
      assert.equal(motion.character, 0);
    });

    test("last WORD should move to next line skips whitespace only line", () => {
      let motion = new Position(4, 12).getBigWordRight();
      assert.equal(motion.line, 6);
      assert.equal(motion.character, 0);
    });
  });

  suite("WORD left", () => {
    test("move cursor WORD left across spaces", () => {
      let motion = new Position(0, 3).getBigWordLeft();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 0);
    });

    test("move cursor WORD left within WORD", () => {
      let motion = new Position(0, 5).getBigWordLeft();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 3);
    });

    test("first WORD should move to previous line, beginning of last WORD", () => {
      let motion = new Position(2, 0).getBigWordLeft();
      assert.equal(motion.line, 1);
      assert.equal(motion.character, 9);
    });

    test("first WORD should move to previous line, stops on empty line", () => {
      let motion = new Position(4, 2).getBigWordLeft();
      assert.equal(motion.line, 3);
      assert.equal(motion.character, 0);
    });

    test("first WORD should move to previous line, skips whitespace only line", () => {
      let motion = new Position(6, 0).getBigWordLeft();
      assert.equal(motion.line, 4);
      assert.equal(motion.character, 9);
    });
  });

  suite("end of word right", () => {
    test("move to end of current word right", () => {
      let motion = new Position(0, 4).getCurrentWordEnd();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 7);
    });

    test("move to end of next word right", () => {
      let motion = new Position(0, 7).getCurrentWordEnd();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 8);
    });

    test("end of last word should move to next line", () => {
      let motion = new Position(0, 10).getCurrentWordEnd();
      assert.equal(motion.line, 1);
      assert.equal(motion.character, 7);
    });

    test("end of last word should move to next line skips empty line", () => {
      let motion = new Position(2, 7).getCurrentWordEnd();
      assert.equal(motion.line, 4);
      assert.equal(motion.character, 7);
    });

    test("end of last word should move to next line skips whitespace only line", () => {
      let motion = new Position(4, 14).getCurrentWordEnd();
      assert.equal(motion.line, 6);
      assert.equal(motion.character, 0);
    });
  });

  suite("end of WORD right", () => {
    test("move to end of current WORD right", () => {
      let motion = new Position(0, 4).getCurrentBigWordEnd();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 8);
    });

    test("move to end of next WORD right", () => {
      let motion = new Position(0, 8).getCurrentBigWordEnd();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 10);
    });

    test("end of last WORD should move to next line", () => {
      let motion = new Position(0, 10).getCurrentBigWordEnd();
      assert.equal(motion.line, 1);
      assert.equal(motion.character, 7);
    });

    test("end of last WORD should move to next line skips empty line", () => {
      let motion = new Position(2, 7).getCurrentBigWordEnd();
      assert.equal(motion.line, 4);
      assert.equal(motion.character, 7);
    });

    test("end of last WORD should move to next line skips whitespace only line", () => {
      let motion = new Position(4, 14).getCurrentBigWordEnd();
      assert.equal(motion.line, 6);
      assert.equal(motion.character, 0);
    });
  });

  test("line begin cursor on first non-blank character", () => {
    let motion = new Position(4, 3).getFirstLineNonBlankChar();
    assert.equal(motion.line, 4);
    assert.equal(motion.character, 2);
  });

  test("last line begin cursor on first non-blank character", () => {
    let motion = new Position(6, 0).getFirstLineNonBlankChar();
    assert.equal(motion.line, 6);
    assert.equal(motion.character, 0);
  });
});

suite("sentence motion", () => {
  let text: Array<string> = [
    "This text has many sections in it. What do you think?",
    "",
    "A paragraph boundary is also a sentence boundry, see",
    "",
    "Weird things happen when there is no appropriate sentence ending",
    "",
    "Next line is just whitespace",
    "   ",
    "Wow!",
    "Another sentence inside one paragraph."
  ];

  suiteSetup(() => {
    return setupWorkspace().then(() => {
      return TextEditor.insert(text.join('\n'));
    });
  });

  suiteTeardown(cleanUpWorkspace);

  suite("sentence forward", () => {
    test("next concrete sentence", () => {
      let motion = new Position(0, 0).getSentenceBegin({forward: true});
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 35);
    });

    test("next sentence that ends with paragraph ending", () => {
      let motion = new Position(2, 50).getNextLineBegin();
      assert.equal(motion.line, 3);
      assert.equal(motion.character, 0);
    });

    test("next sentence when cursor is at the end of previous paragraph", () => {
      let motion = new Position(3, 0).getSentenceBegin({forward: true});
      assert.equal(motion.line, 4);
      assert.equal(motion.character, 0);
    });

    test("next sentence when paragraph contains a line of whilte spaces", () => {
      let motion = new Position(6, 2).getSentenceBegin({forward: true});
      assert.equal(motion.line, 9);
      assert.equal(motion.character, 0);
    });
  });

  suite("sentence backward", () => {
    test("current sentence begin", () => {
      let motion = new Position(0, 37).getSentenceBegin({forward: false});
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 35);
    });

    test("sentence forward when cursor is at the beginning of the second sentence", () => {
      let motion = new Position(0, 35).getSentenceBegin({forward: false});
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 0);
    });

    test("current sentence begin with no concrete sentense inside", () => {
      let motion = new Position(3, 0).getSentenceBegin({forward: false});
      assert.equal(motion.line, 2);
      assert.equal(motion.character, 0);
    });

    test("current sentence begin when it's not the same as current paragraph begin", () => {
      let motion = new Position(2, 0).getSentenceBegin({forward: false});
      assert.equal(motion.line, 1);
      assert.equal(motion.character, 0);
    });

    test("current sentence begin when previous line ends with a concrete sentence", () => {
      let motion = new Position(9, 5).getSentenceBegin({forward: false});
      assert.equal(motion.line, 9);
      assert.equal(motion.character, 0);
    });
  });
});

suite("paragraph motion", () => {
  let text: Array<string> = [
    "this text has", // 0
    "",        // 1
    "many",      // 2
    "paragraphs",  // 3
    "",        // 4
    "",        // 5
    "in it.",    // 6
    "",        // 7
    "WOW"      // 8
  ];

  suiteSetup(() => {
    return setupWorkspace().then(() => {
      return TextEditor.insert(text.join('\n'));
    });
  });

  suiteTeardown(cleanUpWorkspace);

  suite("paragraph down", () => {
    test("move down normally", () => {
      let motion = new Position(0, 0).getCurrentParagraphEnd();
      assert.equal(motion.line, 1);
      assert.equal(motion.character, 0);
    });

    test("move down longer paragraph", () => {
      let motion = new Position(2, 0).getCurrentParagraphEnd();
      assert.equal(motion.line, 4);
      assert.equal(motion.character, 0);
    });

    test("move down starting inside empty line", () => {
      let motion = new Position(4, 0).getCurrentParagraphEnd();
      assert.equal(motion.line, 7);
      assert.equal(motion.character, 0);
    });

    test("paragraph at end of document", () => {
      let motion = new Position(7, 0).getCurrentParagraphEnd();
      assert.equal(motion.line, 8);
      assert.equal(motion.character, 3);
    });
  });

  suite("paragraph up", () => {
    test("move up short paragraph", () => {
      let motion = new Position(1, 0).getCurrentParagraphBeginning();
      assert.equal(motion.line, 0);
      assert.equal(motion.character, 0);
    });

    test("move up longer paragraph", () => {
      let motion = new Position(3, 0).getCurrentParagraphBeginning();
      assert.equal(motion.line, 1);
      assert.equal(motion.character, 0);
    });

    test("move up starting inside empty line", () => {
      let motion = new Position(5, 0).getCurrentParagraphBeginning();
      assert.equal(motion.line, 1);
      assert.equal(motion.character, 0);
    });
  });
});
