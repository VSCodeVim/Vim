"use strict";

import * as node from "../commands/search";
import {Scanner} from '../scanner';

function isValidDelimiter(char: string): boolean {
    return !! (/^[^\w\s\\|"]{1}$/g.exec(char));
}

function parsePattern(pattern: string, scanner: Scanner, delimiter: string): [string, boolean]{
    if (scanner.isAtEof) {
        return [pattern, false];
    } else {
        let currentChar = scanner.next();

        if (currentChar === delimiter) {
            // TODO skip delimiter
            return [pattern, true];
        } else if (currentChar === "\\") {
            if (scanner.isAtEof) {

            } else {
                let currentChar = scanner.next();

                if (currentChar !== delimiter) {
                    pattern += "\\";
                }

                pattern += currentChar;
            }

            return parsePattern(pattern, scanner, delimiter);
        } else {
            pattern += currentChar;
            return parsePattern(pattern, scanner, delimiter);
        }
    }
}

/**
 * The flags that you can use for the substitute commands:
 * [&] Must be the first one: Keep the flags from the previous substitute command.
 * [c] Confirm each substitution.
 * [e] When the search pattern fails, do not issue an error message and, in
 *     particular, continue in maps as if no error occurred.
 * [g] Replace all occurrences in the line.  Without this argument, replacement
 *     occurs only for the first occurrence in each line.
 * [i] Ignore case for the pattern.
 * [I] Don't ignore case for the pattern.
 * [n] Report the number of matches, do not actually substitute.
 * [p] Print the line containing the last substitute.
 * [#] Like [p] and prepend the line number.
 * [l] Like [p] but print the text like |:list|.
 * [r] When the search pattern is empty, use the previously used search pattern
 *     instead of the search pattern from the last substitute or ":global".
 */
enum SubstituteFlags {
    None = 0,
    KeepPreviousFlags = 0x1,
    ConfirmEach = 0x2,
    SuppressError = 0x4,
    ReplaceAll = 0x8,
    IgnoreCase = 0x10,
    NoIgnoreCase = 0x20,
    PrintCount = 0x40,
    PrintLastMatchedLine = 0x80,
    PrintLastMatchedLineWithNumber = 0x100,
    PrintLastMatchedLineWithList = 0x200,
    UsePreviousPattern = 0x400
}

function parseSubstituteFlags(scanner: Scanner): number {
    let flags: number = 0;
    let index = 0;
    while(true) {
        if (scanner.isAtEof) {
            break;
        }

        let c = scanner.next();
        switch (c) {
            case "&":
                if (index === 0) {
                    flags = flags | SubstituteFlags.KeepPreviousFlags
                } else {
                    // Raise Error
                    return SubstituteFlags.None
                }
                break;
            case "c":
                flags = flags | SubstituteFlags.ConfirmEach;
                break;
            case "e":
                flags = flags | SubstituteFlags.SuppressError;
                break;
            case "g":
                flags = flags | SubstituteFlags.ReplaceAll;
                break;
            case "i":
                flags = flags | SubstituteFlags.IgnoreCase;
                break;
            case "I":
                flags = flags | SubstituteFlags.NoIgnoreCase;
                break;
            case "n":
                flags = flags | SubstituteFlags.PrintCount;
                break;
            case "p":
                flags = flags | SubstituteFlags.PrintLastMatchedLine;
                break;
            case "#":
                flags = flags | SubstituteFlags.PrintLastMatchedLineWithNumber;
                break;
            case "l":
                flags = flags | SubstituteFlags.PrintLastMatchedLineWithList;
                break;
            case "r":
                flags = flags | SubstituteFlags.UsePreviousPattern;
                break;
            default:
                return SubstituteFlags.None;
        }
        
        index++;
    }

    return flags;
}

function parseCount(scanner: Scanner): number {
    let countStr = "";

    while(true) {
        if (scanner.isAtEof) {
            break;
        }
        countStr += scanner.next();
    }

    let count = Number.parseInt(countStr);
    
    // TODO: If count is not valid number, raise error
    return Number.isInteger(count) ? count : -1; 
}
/**
 * Substitute
 * :[range]s[ubstitute]/{pattern}/{string}/[flags] [count]
 * For each line in [range] replace a match of {pattern} with {string}.
 * {string} can be a literal string, or something special; see |sub-replace-special|.
 */
export function parseSearchCommandArgs(args : string) : node.SearchCommand {
    let delimiter = args[0];

    if (isValidDelimiter(delimiter)) {
        let scanner = new Scanner(args.substr(1, args.length - 1));
        let [searchPattern, searchDelimiter] = parsePattern("", scanner, delimiter);

        if (searchDelimiter) {
            let [replaceString, replaceDelimiter] = parsePattern("", scanner, delimiter);
            scanner.skipWhiteSpace();
            let flags = parseSubstituteFlags(scanner);
            scanner.skipWhiteSpace();
            let count = parseCount(scanner);

        } else {
            // replacePattern keeps empty
            // substitueFlag as None
        }
    } else {

    }

    return new node.SearchCommand({});
}
