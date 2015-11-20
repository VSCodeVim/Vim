// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

import {commandParsers} from '../src/cmd_line/subparser';

suite("subparsers - :write args", () => {
	
	test("parsers for :write are set up correctly", () => {
	   assert.equal(commandParsers.write.name, commandParsers.w.name); 
	});

	test("can parse empty args", () => {
		// TODO: perhaps we don't need to export this func at all.
		// TODO: this func must return args only, not a command?
		// TODO: the range must be passed separately, not as arg.
		var args = commandParsers.write("");
		assert.equal(args.args.append, undefined);
		assert.equal(args.args.bang, undefined);
		assert.equal(args.args.cmd, undefined);
		assert.equal(args.args.file, undefined);
		assert.equal(args.args.opt, undefined);
		assert.equal(args.args.optValue, undefined);
		assert.equal(args.args.range, undefined);
	});

	test("can parse ++opt", () => {

		var args = commandParsers.write("++enc=foo");
		assert.equal(args.args.append, undefined);
		assert.equal(args.args.bang, undefined);
		assert.equal(args.args.cmd, undefined);
		assert.equal(args.args.file, undefined);
		assert.equal(args.args.opt, 'enc');
		assert.equal(args.args.optValue, 'foo');
		assert.equal(args.args.range, undefined);
	});

	test("throws if bad ++opt name", () => {

		assert.throws(() => commandParsers.write("++foo=foo"));
	});

	test("can parse bang", () => {

		var args = commandParsers.write("!");
		assert.equal(args.args.append, undefined);
		assert.equal(args.args.bang, true);
		assert.equal(args.args.cmd, undefined);
		assert.equal(args.args.file, undefined);
		assert.equal(args.args.opt, undefined);
		assert.equal(args.args.optValue, undefined);
		assert.equal(args.args.range, undefined);
	});
	
	test("can parse ' !cmd'", () => {

		var args = commandParsers.write(" !foo");
		assert.equal(args.args.append, undefined);
		assert.equal(args.args.bang, undefined);
		assert.equal(args.args.cmd, 'foo');
		assert.equal(args.args.file, undefined);
		assert.equal(args.args.opt, undefined);
		assert.equal(args.args.optValue, undefined);
		assert.equal(args.args.range, undefined);
	});

	test("can parse ' !cmd' when cmd is empty", () => {

		var args = commandParsers.write(" !");
		assert.equal(args.args.append, undefined);
		assert.equal(args.args.bang, undefined);
		assert.equal(args.args.cmd, undefined);
		assert.equal(args.args.file, undefined);
		assert.equal(args.args.opt, undefined);
		assert.equal(args.args.optValue, undefined);
		assert.equal(args.args.range, undefined);
	});
});
