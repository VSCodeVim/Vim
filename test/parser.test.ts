// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

import * as vscode from 'vscode';
import * as myExtension from '../extension';
import * as parser from '../src/cmd_line/parser';
import * as node from '../src/cmd_line/node';
import * as token from '../src/cmd_line/token';

suite("Cmd line tests - parser", () => {

    test("can parse empty string", () => {
        var cmd = parser.parse("");
        assert.ok(cmd.isEmpty);
    });

    // TODO: Range tests follow -- should prolly create a suite for this
    test("can parse left - dot", () => {
        var cmd : node.CommandLine = parser.parse(".");
        assert.equal(cmd.range.left[0].type, token.TokenType.Dot);
    });

    test("can parse left - dollar", () => {
        var cmd : node.CommandLine = parser.parse("$");
        assert.equal(cmd.range.left[0].type, token.TokenType.Dollar);
    });

    test("can parse left - percent", () => {
        var cmd : node.CommandLine = parser.parse("%");
        assert.equal(cmd.range.left[0].type, token.TokenType.Percent);
    });

    test("can parse separator - comma", () => {
        var cmd : node.CommandLine = parser.parse(",");
        assert.equal(cmd.range.separator.type, token.TokenType.Comma);
    });

    test("can parse right - dollar", () => {
        var cmd : node.CommandLine = parser.parse(",$");
        assert.equal(cmd.range.left.length, 0);
        assert.equal(cmd.range.right.length, 1);
        assert.equal(cmd.range.right[0].type, token.TokenType.Dollar, "unexpected token");
    });
});
