"use strict";

import * as util from "./util";

interface IErrorMessage {
  [index: number] : string;
}

export enum ErrorCode {
  E32 = 32,
  E37 = 37,
  E208 = 208,
  E348 = 348,
  E444 = 444,
  E488 = 488
}

export const ErrorMessage : IErrorMessage = {
  32: "No file name",
  37: "No write since last change (add ! to override)",
  208: "Error writing to file",
  348: "No string under cursor",
  444: "Cannot close last window",
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
    if (ErrorMessage[code]) {
      return new VimError(code, ErrorMessage[code]);
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