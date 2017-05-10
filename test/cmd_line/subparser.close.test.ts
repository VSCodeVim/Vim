"use strict";

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

import {commandParsers} from '../../src/cmd_line/subparser';

suite(":close args parser", () => {

  test("has all aliases", () => {
     assert.equal(commandParsers.close.name, commandParsers.clo.name);
  });

  test("can parse empty args", () => {
    var args = commandParsers.close("");
    assert.equal(args.arguments.bang, undefined);
    assert.equal(args.arguments.range, undefined);
  });

  test("ignores trailing white space", () => {
    var args = commandParsers.close("  ");
    assert.equal(args.arguments.bang, undefined);
    assert.equal(args.arguments.range, undefined);
  });

  test("can parse !", () => {
    var args = commandParsers.close("!");
    assert.ok(args.arguments.bang);
    assert.equal(args.arguments.range, undefined);
  });

  test("throws if space before !", () => {
    assert.throws(() => commandParsers.close(" !"));
  });

  test("ignores space after !", () => {

    var args = commandParsers.close("! ");
    assert.equal(args.arguments.bang, true);
    assert.equal(args.arguments.range, undefined);
  });

  test("throws if bad input", () => {
    assert.throws(() => commandParsers.close("x"));
  });
});
