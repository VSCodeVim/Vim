"use strict";

import * as assert from 'assert';
import {VimError, ErrorCode} from '../src/error';

suite("ErrorCode", () => {
  test("contains known errors", () => {
    assert.equal(ErrorCode.E32, 32);
    assert.equal(ErrorCode.E37, 37);
    assert.equal(ErrorCode.E208, 208);
    assert.equal(ErrorCode.E348, 348);
    assert.equal(ErrorCode.E488, 488);
  });
});

suite("vimError", () => {
  test("ctor", () => {
    const e = new VimError(100, "whoof!");
    assert.equal(e.code, 100);
    assert.equal(e.message, "whoof!");
  });

  test("can instantiate known errors", () => {
    var e = VimError.fromCode(ErrorCode.E32);
    assert.equal(e.code, 32);
    assert.equal(e.message, "No file name");

    e = VimError.fromCode(ErrorCode.E37);
    assert.equal(e.code, 37);
    assert.equal(e.message, "No write since last change (add ! to override)");

    e = VimError.fromCode(ErrorCode.E488);
    assert.equal(e.code, 488);
    assert.equal(e.message, "Trailing characters");
  });
});