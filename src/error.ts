"use strict";

import * as util from "./util";

interface IVimErrors {
    [index: number] : string;
}

export enum ErrorCode {
    E37 = 37,
    E32 = 32,
    E488 = 488
}

const errors : IVimErrors = {
    32: "No file name",
    37: "No write since last change (add ! to override)",
    488: "Trailing characters"
};


export class VimError extends Error {
    private _code : number;
    private _message : string;

    constructor(code : number, message : string) {
        super();
        this._code = code;
        this._message = message;
    }

    static fromCode(code : ErrorCode) : VimError {
        if (errors[code]) {
            return new VimError(code, errors[code]);
        }

        throw new Error("unknown error code: " + code);
    }

    get code() : number {
        return this._code;
    }

    get message() : string {
        return this._message;
    }

    display() : void {
        util.showError(this.toString());
    }

    toString() : string {
        return "E" + this.code.toString() + ": " + this.message;
    }
}