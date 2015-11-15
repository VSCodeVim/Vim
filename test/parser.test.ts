// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../extension';
import * as parser from '../src/cmd_line/parser';

suite("Cmd line tests - parser", () => {

	test("can parse empty string", () => {
		var cmd = parser.parse("");
		assert.ok(cmd.isEmpty);
	});

	// TODO: Range tests follow -- should prolly create a suite for this
	test("can parse dot", () => {
		var cmd : parser.CommandLine = parser.parse(".");
		assert.ok(cmd);
	});	
});
