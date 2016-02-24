"use strict";

import {Scanner} from "./scanner";
import {Token, TokenType} from "./token";

// Describes a function that can lex part of a Vim command line.
interface ILexFunction {
    (state: Scanner, tokens: Token[]) : ILexFunction;
}

export function lex(input : string) : Token[] {
    // We use a character scanner as state for the lexer.
    var state = new Scanner(input);
    var tokens : Token[] = [];
    var f : ILexFunction = LexerFunctions.lexRange;
    while (f) {
        // Each lexing function returns the next lexing function or null.
        f = f(state, tokens);
    }
    return tokens;
}

function emitToken(type : TokenType, state : Scanner) : Token {
    var content = state.emit();
    return (content.length > 0) ? new Token(type, content) : null;
}

module LexerFunctions {
    // Starts lexing a Vim command line and delegates on other lexer functions as needed.
    export function lexRange(state : Scanner, tokens : Token[]): ILexFunction  {
        while (true) {
            if (state.isAtEof) {
                break;
            }
            var c = state.next();
            switch (c) {
                case ",":
                    tokens.push(emitToken(TokenType.Comma, state));
                    continue;
                case "%":
                    tokens.push(emitToken(TokenType.Percent, state));
                    continue;
                case "$":
                    tokens.push(emitToken(TokenType.Dollar, state));
                    continue;
                case ".":
                    tokens.push(emitToken(TokenType.Dot, state));
                    continue;
                case "/":
                    return lexForwardSearch;
                case "?":
                    return lexReverseSearch;
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    return lexLineRef;
                case "+":
                    tokens.push(emitToken(TokenType.Plus, state));
                    continue;
                case "-":
                    tokens.push(emitToken(TokenType.Minus, state));
                    continue;
                default:
                    return lexCommand;
            }
        }
        return null;
    }

    function lexLineRef(state : Scanner, tokens : Token[]): ILexFunction  {
        // The first digit has already been lexed.
        while (true) {
            if (state.isAtEof) {
                tokens.push(emitToken(TokenType.LineNumber, state));
                return null;
            }
            var c = state.next();
            switch (c) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    continue;
                default:
                    state.backup();
                    tokens.push(emitToken(TokenType.LineNumber, state));
                    return lexRange;
            }
        }
    }

    function lexCommand(state : Scanner, tokens : Token[]): ILexFunction  {
        // The first character of the command's name has already been lexed.
        while (true) {
            if (state.isAtEof) {
                tokens.push(emitToken(TokenType.CommandName, state));
                break;
            }
            var c = state.next();
            var lc = c.toLowerCase();
            if (lc >= "a" && lc <= "z") {
                continue;
            } else {
                state.backup();
                tokens.push(emitToken(TokenType.CommandName, state));
                while (!state.isAtEof) {
                    state.next();
                }
                // TODO(guillermooo): We need to parse multiple commands.
                var args = emitToken(TokenType.CommandArgs, state);
                if (args) {
                    tokens.push(args);
                };
                break;
            }
        }
        return null;
    }

    function lexForwardSearch(state : Scanner, tokens : Token[]): ILexFunction  {
        // The first slash has already been lexed.
        state.skip("/"); // XXX: really?
        var escaping : boolean;
        var searchTerm = "";
        while (!state.isAtEof) {
            var c = state.next();
            if (c === "/" && !escaping) {
                break;
            }
            if (c === "\\") {
                escaping = true;
                continue;
            } else {
                escaping = false;
            }
            searchTerm += c !== "\\" ? c : "\\\\";
        }
        tokens.push(new Token(TokenType.ForwardSearch, searchTerm));
        state.ignore();
        if (!state.isAtEof) {
            state.skip("/");
        };
        return lexRange;
    }

    function lexReverseSearch(state : Scanner, tokens : Token[]): ILexFunction  {
        // The first question mark has already been lexed.
        state.skip("?"); // XXX: really?
        var escaping : boolean;
        var searchTerm = "";
        while (!state.isAtEof) {
            var c = state.next();
            if (c === "?" && !escaping) {
                break;
            }
            if (c === "\\") {
                escaping = true;
                continue;
            } else {
                escaping = false;
            }
            searchTerm += c !== "\\" ? c : "\\\\";
        }
        tokens.push(new Token(TokenType.ReverseSearch, searchTerm));
        state.ignore();
        if (!state.isAtEof) {
            state.skip("?");
        }
        return lexRange;
    }
}
