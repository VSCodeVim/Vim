interface IErrorMessage {
  [index: number]: string;
}

export enum ErrorCode {
  MarkNotSet = 20,
  NoFileName = 32,
  NoPreviousRegularExpression = 35,
  NoWriteSinceLastChange = 37,
  ErrorWritingToFile = 208,
  NoStringUnderCursor = 348,
  SearchHitTop = 384,
  SearchHitBottom = 385,
  CannotCloseLastWindow = 444,
  InvalidArgument = 474,
  PatternNotFound = 486,
  TrailingCharacters = 488,
  NotAnEditorCommand = 492,
  UnknownOption = 518,
}

export const ErrorMessage: IErrorMessage = {
  20: 'Mark not set',
  32: 'No file name',
  35: 'No previous regular expression',
  37: 'No write since last change (add ! to override)',
  208: 'Error writing to file',
  348: 'No string under cursor',
  384: 'Search hit TOP without match',
  385: 'Search hit BOTTOM without match',
  444: 'Cannot close last window',
  474: 'Invalid argument',
  486: 'Pattern not found',
  488: 'Trailing characters',
  492: 'Not an editor command',
  518: 'Unknown option',
};

export class VimError extends Error {
  private _code: number;
  private _message: string;

  constructor(code: number, message: string) {
    super();
    this._code = code;
    this._message = message;
  }

  static fromCode(code: ErrorCode, extraValue?: string): VimError {
    if (ErrorMessage[code]) {
      return new VimError(code, ErrorMessage[code] + (extraValue ? `: ${extraValue}` : ''));
    }

    throw new Error('unknown error code: ' + code);
  }

  get code(): number {
    return this._code;
  }

  get message(): string {
    return this._message;
  }

  toString(): string {
    return `E${this.code}: ${this.message}`;
  }
}
