export enum ErrorCode {
  InvalidAddress = 14,
  InvalidExpression = 15,
  InvalidRange = 16,
  MarkNotSet = 20,
  NoAlternateFile = 23,
  NoInsertedTextYet = 29,
  NoFileName = 32,
  NoPreviousSubstituteRegularExpression = 33,
  NoPreviousCommand = 34,
  NoPreviousRegularExpression = 35,
  NoWriteSinceLastChange = 37,
  CannotChangeReadOnlyVariable = 46,
  MultipleMatches = 93,
  NoMatchingBuffer = 94,
  NoSuchVariable = 108,
  MissingQuote = 114,
  UnknownFunction_call = 117,
  TooManyArgs = 118,
  NotEnoughArgs = 119,
  UndefinedVariable = 121,
  ErrorWritingToFile = 208,
  FileNoLongerAvailable = 211,
  RecursiveMapping = 223,
  NoStringUnderCursor = 348,
  NothingInRegister = 353,
  InvalidRegisterName = 354,
  SearchHitTop = 384,
  SearchHitBottom = 385,
  CannotCloseLastWindow = 444,
  CantFindFileInPath = 447,
  ArgumentRequired = 471,
  InvalidArgument474 = 474,
  InvalidArgument475 = 475,
  NoRangeAllowed = 481,
  PatternNotFound = 486,
  TrailingCharacters = 488,
  NotAnEditorCommand = 492,
  NoBuffersDeleted = 516,
  UnknownOption = 518,
  NumberRequiredAfterEqual = 521,
  AtStartOfChangeList = 662,
  AtEndOfChangeList = 663,
  ChangeListIsEmpty = 664,
  ListIndexOutOfRange = 684,
  ArgumentOfSortMustBeAList = 686,
  LessTargetsThanListItems = 687,
  MoreTargetsThanListItems = 688,
  CanOnlyIndexAListDictionaryOrBlob = 689,
  CanOnlyCompareListWithList = 691,
  InvalidOperationForList = 692,
  InvalidOperationForFuncrefs = 694,
  CannotIndexAFuncref = 695,
  UnknownFunction_funcref = 700,
  InvalidTypeForLen = 701,
  UsingAFuncrefAsANumber = 703,
  FuncrefVariableNameMustStartWithACapital = 704,
  SliceRequiresAListOrBlobValue = 709,
  ListValueHasMoreItemsThanTarget = 710,
  ListValueHasNotEnoughItems = 711,
  ArgumentOfMaxMustBeAListOrDictionary = 712, // TODO: This should be different for min(), count()
  ListRequired = 714,
  DictionaryRequired = 715,
  KeyNotPresentInDictionary = 716,
  CannotUseSliceWithADictionary = 719,
  DuplicateKeyInDictionary = 721,
  StrideIsZero = 726,
  StartPastEnd = 727,
  UsingADictionaryAsANumber = 728,
  UsingListAsAString = 730,
  UsingFuncrefAsAString = 729,
  UsingDictionaryAsAString = 731,
  CanOnlyCompareDictionaryWithDictionary = 735,
  InvalidOperationForDictionary = 736,
  ValueIsLocked = 741,
  UsingAListAsANumber = 745,
  NoPreviouslyUsedRegister = 748,
  CannotUseModuloWithFloat = 804,
  UsingAFloatAsANumber = 805,
  UsingFloatAsAString = 806,
  NumberOrFloatRequired = 808,
  ArgumentOfMapMustBeAListDictionaryOrBlob = 896,
  ListOrBlobRequired = 897,
  MaxDepthMustBeANonNegativeNumber = 900,
  ExpectedADict = 922,
  SecondArgumentOfFunction = 923,
  BlobLiteralShouldHaveAnEvenNumberOfHexCharacters = 973,
  UsingABlobAsANumber = 974,
  CanOnlyCompareBlobWithBlob = 977,
  InvalidOperationForBlob = 978,
  CannotModifyExistingVariable = 995,
  CannotLockARegister = 996,
  ListRequiredForArgument = 1211,
}

export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.InvalidAddress]: 'Invalid address',
  [ErrorCode.InvalidExpression]: 'Invalid expression',
  [ErrorCode.InvalidRange]: 'Invalid range',
  [ErrorCode.MarkNotSet]: 'Mark not set',
  [ErrorCode.NoAlternateFile]: 'No alternate file',
  [ErrorCode.NoInsertedTextYet]: 'No inserted text yet',
  [ErrorCode.NoFileName]: 'No file name',
  [ErrorCode.NoPreviousSubstituteRegularExpression]: 'No previous substitute regular expression',
  [ErrorCode.NoPreviousCommand]: 'No previous command',
  [ErrorCode.NoPreviousRegularExpression]: 'No previous regular expression',
  [ErrorCode.NoWriteSinceLastChange]: 'No write since last change (add ! to override)',
  [ErrorCode.CannotChangeReadOnlyVariable]: 'Cannot change read-only variable',
  [ErrorCode.MultipleMatches]: 'More than one match',
  [ErrorCode.NoMatchingBuffer]: 'No matching buffer',
  [ErrorCode.NoSuchVariable]: 'No such variable',
  [ErrorCode.MissingQuote]: 'Missing quote',
  [ErrorCode.UnknownFunction_call]: 'Unknown function',
  [ErrorCode.TooManyArgs]: 'Too many arguments for function',
  [ErrorCode.NotEnoughArgs]: 'Not enough arguments for function',
  [ErrorCode.UndefinedVariable]: 'Undefined variable',
  [ErrorCode.ErrorWritingToFile]: 'Error writing to file',
  [ErrorCode.FileNoLongerAvailable]: 'File no longer available', // TODO: Should be `File "[file_name]" no longer available`
  [ErrorCode.RecursiveMapping]: 'Recursive mapping',
  [ErrorCode.NoStringUnderCursor]: 'No string under cursor',
  [ErrorCode.NothingInRegister]: 'Nothing in register',
  [ErrorCode.InvalidRegisterName]: 'Invalid register name',
  [ErrorCode.SearchHitTop]: 'Search hit TOP without match for',
  [ErrorCode.SearchHitBottom]: 'Search hit BOTTOM without match for',
  [ErrorCode.CannotCloseLastWindow]: 'Cannot close last window',
  [ErrorCode.CantFindFileInPath]: 'Can\'t find file "{FILE_NAME}" in path',
  [ErrorCode.ArgumentRequired]: 'Argument required',
  [ErrorCode.InvalidArgument474]: 'Invalid argument',
  [ErrorCode.InvalidArgument475]: 'Invalid argument',
  [ErrorCode.NoRangeAllowed]: 'No range allowed',
  [ErrorCode.PatternNotFound]: 'Pattern not found',
  [ErrorCode.TrailingCharacters]: 'Trailing characters',
  [ErrorCode.NotAnEditorCommand]: 'Not an editor command',
  [ErrorCode.NoBuffersDeleted]: 'No buffers were deleted',
  [ErrorCode.UnknownOption]: 'Unknown option',
  [ErrorCode.NumberRequiredAfterEqual]: 'Number required after =',
  [ErrorCode.AtStartOfChangeList]: 'At start of changelist',
  [ErrorCode.AtEndOfChangeList]: 'At end of changelist',
  [ErrorCode.ChangeListIsEmpty]: 'changelist is empty',
  [ErrorCode.ListIndexOutOfRange]: 'list index out of range',
  [ErrorCode.ArgumentOfSortMustBeAList]: 'Argument of sort() must be a List',
  [ErrorCode.LessTargetsThanListItems]: 'Less targets than List items',
  [ErrorCode.MoreTargetsThanListItems]: 'More targets than List items',
  [ErrorCode.CanOnlyIndexAListDictionaryOrBlob]: 'Can only index a List, Dictionary or Blob',
  [ErrorCode.CanOnlyCompareListWithList]: 'Can only compare List with List',
  [ErrorCode.InvalidOperationForList]: 'Invalid operation for List',
  [ErrorCode.InvalidOperationForFuncrefs]: 'Invalid operation for Funcrefs',
  [ErrorCode.CannotIndexAFuncref]: 'Cannot index a Funcref',
  [ErrorCode.UnknownFunction_funcref]: 'Unknown function',
  [ErrorCode.InvalidTypeForLen]: 'Invalid type for len()',
  [ErrorCode.UsingAFuncrefAsANumber]: 'Using a Funcref as a Number',
  [ErrorCode.FuncrefVariableNameMustStartWithACapital]:
    'Funcref variable name must start with a capital',
  [ErrorCode.SliceRequiresAListOrBlobValue]: '[:] requires a List or Blob value',
  [ErrorCode.ListValueHasMoreItemsThanTarget]: 'List value has more items than target',
  [ErrorCode.ListValueHasNotEnoughItems]: 'List value has not enough items',
  [ErrorCode.ArgumentOfMaxMustBeAListOrDictionary]:
    'Argument of max() must be a List or Dictionary',
  [ErrorCode.ListRequired]: 'List required',
  [ErrorCode.DictionaryRequired]: 'Dictionary required',
  [ErrorCode.KeyNotPresentInDictionary]: 'Key not present in Dictionary',
  [ErrorCode.CannotUseSliceWithADictionary]: 'Cannot use [:] with a Dictionary',
  [ErrorCode.DuplicateKeyInDictionary]: 'Duplicate key in Dictionary',
  [ErrorCode.StrideIsZero]: 'Stride is zero',
  [ErrorCode.StartPastEnd]: 'Start past end',
  [ErrorCode.UsingADictionaryAsANumber]: 'Using a Dictionary as a Number',
  [ErrorCode.UsingFuncrefAsAString]: 'using Funcref as a String',
  [ErrorCode.UsingListAsAString]: 'Using List as a String',
  [ErrorCode.UsingDictionaryAsAString]: 'Using Dictionary as a String',
  [ErrorCode.CanOnlyCompareDictionaryWithDictionary]: 'Can only compare Dictionary with Dictionary',
  [ErrorCode.InvalidOperationForDictionary]: 'Invalid operation for Dictionary',
  [ErrorCode.ValueIsLocked]: 'Value is locked',
  [ErrorCode.UsingAListAsANumber]: 'Using a List as a Number',
  [ErrorCode.NoPreviouslyUsedRegister]: 'No previously used register',
  [ErrorCode.CannotUseModuloWithFloat]: "Cannot use '%' with Float",
  [ErrorCode.UsingAFloatAsANumber]: 'Using a Float as a Number',
  [ErrorCode.UsingFloatAsAString]: 'Using Float as a String',
  [ErrorCode.NumberOrFloatRequired]: 'Number or Float required',
  [ErrorCode.ArgumentOfMapMustBeAListDictionaryOrBlob]:
    'Argument of map() must be a List, Dictionary or Blob',
  [ErrorCode.ListOrBlobRequired]: 'List or Blob required',
  [ErrorCode.MaxDepthMustBeANonNegativeNumber]: 'maxdepth must be a non-negative number',
  [ErrorCode.ExpectedADict]: 'expected a dict',
  [ErrorCode.SecondArgumentOfFunction]: 'Second argument of function() must be a list or a dict',
  [ErrorCode.BlobLiteralShouldHaveAnEvenNumberOfHexCharacters]:
    'Blob literal should have an even number of hex characters',
  [ErrorCode.UsingABlobAsANumber]: 'Using a Blob as a Number',
  [ErrorCode.CanOnlyCompareBlobWithBlob]: 'Can only compare Blob with Blob',
  [ErrorCode.InvalidOperationForBlob]: 'Invalid operation for Blob',
  [ErrorCode.CannotModifyExistingVariable]: 'Cannot modify existing variable',
  [ErrorCode.CannotLockARegister]: 'Cannot lock a register',
  [ErrorCode.ListRequiredForArgument]: 'List required for argument {IDX}',
};

export class VimError extends Error {
  public readonly code: ErrorCode;
  public override readonly message: string;

  private constructor(code: ErrorCode, message: string) {
    super();
    this.code = code;
    this.message = message;
  }

  static fromCode(code: ErrorCode, extraValue?: string): VimError {
    let message = ErrorMessage[code];
    if (message) {
      // TODO: Come up with a more elegant solution
      if (extraValue) {
        if (code === ErrorCode.NothingInRegister) {
          extraValue = ` ${extraValue}`;
        } else if (code === ErrorCode.NoMatchingBuffer || code === ErrorCode.MultipleMatches) {
          extraValue = ` for ${extraValue}`;
        } else if (code === ErrorCode.CantFindFileInPath) {
          message = message.replace('{FILE_NAME}', extraValue);
          extraValue = '';
        } else if (code === ErrorCode.ListRequiredForArgument) {
          message = message.replace('{IDX}', extraValue);
          extraValue = '';
        } else {
          extraValue = `: ${extraValue}`;
        }
      }

      return new VimError(code, message + (extraValue ?? ''));
    }

    throw new Error('unknown error code: ' + code);
  }

  override toString(): string {
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
