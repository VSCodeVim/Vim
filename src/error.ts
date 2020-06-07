interface IErrorMessage {
  [index: number]: string;
}

export enum ErrorCode {
  MarkNotSet = 20,
  NoInsertedTextYet = 29,
  NoFileName = 32,
  NoPreviousRegularExpression = 35,
  NoWriteSinceLastChange = 37,
  ErrorWritingToFile = 208,
  RecursiveMapping = 223,
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
  29: 'No inserted text yet',
  32: 'No file name',
  35: 'No previous regular expression',
  37: 'No write since last change (add ! to override)',
  208: 'Error writing to file',
  223: 'Recursive mapping',
  348: 'No string under cursor',
  384: 'Search hit TOP without match for',
  385: 'Search hit BOTTOM without match for',
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

/**
 * Used to stop a remapping or a chain of nested remappings after a VimError, a failed action
 * or the force stop recursive mapping key (<C-c> or <Esc>). (Vim doc :help map-error)
 */
export class ForceStopRemappingError extends Error {
  constructor(reason: string = 'StopRemapping') {
    super(reason);
  }

  static fromVimError(vimError: VimError): ForceStopRemappingError {
    return new ForceStopRemappingError(vimError.toString());
  }
}
