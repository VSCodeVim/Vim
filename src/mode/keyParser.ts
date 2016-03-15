"use strict";

import * as _ from 'lodash';
import { text, parse, incremental } from 'bennu';
import { stream } from 'nu-stream';

export class KeyParser {
    private initialParserState;
    private currentParserState;

    // motions/textObjects/commands should be a mapping of commandString to any value
    constructor(motions : Array<string>, textObjects : Array<string>, commands : Array<string>) {
        this.compile(motions, textObjects, commands);
        this.reset();
    }

    // reset parser state
    public reset() : void {
        this.currentParserState = this.initialParserState;
    }

    // takes strings of keys, and returns:
    //   a command object if successfully parsed
    //   true - if not yet successfully parsed, but still potentially valid
    //   false - input not valid
    public digestKey(input : string) : any {
        const newState = incremental.provideString(input, this.currentParserState);
        let retval;
        try {
            retval = incremental.finish(newState);
        } catch (e) {
            // parser error - do we need more input or dead state already?
            if (newState.done) {
                this.reset();
                return false;
            } else {
                this.currentParserState = newState;
                return true;
            }
        }

        this.reset();
        return retval;
    }

    // converts a string of keys into an array of keys, also normalizes to <lowercase>
    // 3i<c-w><c-w><esc>
    public convertKeyString(input : string) : Array<string> {
        const retval = [];
        const characters = input.split('');
        let currentTag = '';
        for (const char of characters) {
            if (currentTag) {
                currentTag = currentTag + char;
                if (char === '>') {
                    retval.push(currentTag.toLocaleLowerCase());
                    currentTag = '';
                }
            } else if (char === '<') {
                currentTag = '<';
            } else {
                retval.push(char);
            }
        }
        return retval;
    }

    private deepConcat(s) {
        const parts = [];
        function readStrings(s2) {
            stream.forEach(value => {
            if (typeof value === 'string') {
                parts.push(value);
            } else {
                readStrings(value);
            }
            }, s2);
        }
        readStrings(s);
        return parts.join('');
    }

    private compile(motions, textObjects, commands) {

        const register = parse.bind(
            parse.optional('"', parse.next(text.character('"'), text.anyChar)),
            (r) => {
                return parse.always({ register: r });
            }
        );

        const count = parse.bind(
            parse.optional(0, parse.enumeration(text.oneOf('123456789'), parse.many(text.digit)).map(this.deepConcat).map(Number)),
            (c) => {
                return parse.always({ count: c });
            }
        );

        const argument = parse.bind(
            text.anyChar,
            (a) => {
                return parse.always({ argument: a });
            }
        );

        const compiledTextObjects = parse.bind(
            parse.choicea(
                textObjects.map(text.string)
            ),
            (t) => {
                return parse.always({ textObject: t });
            }
        );

        const range = parse.late(() => { return parse.either(compiledTextObjects, compiledMotions); });

        const compiledMotions = parse.choicea(
            motions.map((m) => {
                const keys = this.convertKeyString(m);
                return parse.attempt(
                    parse.bind(
                        parse.enumerationa(keys.map(convertKeyToParser)),
                        (x) => {
                            let command = { command: m };
                            stream.forEach((value) => {
                                if (value.argument !== undefined ||
                                    value.count !== undefined) {
                                    command = _.extend(command, value);
                                }
                            }, x);
                            return parse.always(command);
                        }
                    )
                );
            })
        );

        const compiledCommands = parse.choicea(
            commands.map((c) => {
                const keys = this.convertKeyString(c);
                return parse.attempt(
                    parse.bind(
                        parse.enumerationa(keys.map(convertKeyToParser)),
                        (x) => {
                            let command = { command: c, motion: null };
                            stream.forEach((value) => {
                                if (value.command !== undefined) {
                                    // motion
                                    command.motion = value;
                                } else if (value.argument !== undefined ||
                                    value.count !== undefined ||
                                    value.register !== undefined ||
                                    value.textObject !== undefined) {
                                    command = _.extend(command, value);
                                }
                            }, x);
                            return parse.always(command);
                        }
                    )
                );
            })
        );

        const compiledInputs = parse.either(parse.attempt(compiledMotions), compiledCommands);

        function convertKeyToParser(key) {
            const mapping = {
                '<count>': count,
                '<argument>': argument,
                '<register>': register,
                '<range>': range
            };
            if (mapping[key]) {
                return mapping[key];
            } else {
                return text.string(key);
            }
        }

        this.initialParserState = incremental.runInc(compiledInputs);
    }

}
