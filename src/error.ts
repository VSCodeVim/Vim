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
  ArgumentMustBeAList = 686,
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
  ArgumentOfFuncMustBeAListOrDictionary = 712,
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
  WrongVariableType = 734,
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
  PositiveCountRequired = 939,
  BlobLiteralShouldHaveAnEvenNumberOfHexCharacters = 973,
  UsingABlobAsANumber = 974,
  CanOnlyCompareBlobWithBlob = 977,
  InvalidOperationForBlob = 978,
  CannotModifyExistingVariable = 995,
  CannotLock = 996,
  ListRequiredForArgument = 1211,
}

export class VimError extends Error {
  public readonly code: ErrorCode;
  public override readonly message: string;

  override toString(): string {
    return `E${this.code}: ${this.message}`;
  }

  private constructor(code: ErrorCode, message: string) {
    super();
    this.code = code;
    this.message = message;
  }

  static InvalidAddress(): VimError {
    return new VimError(ErrorCode.InvalidAddress, 'Invalid address');
  }
  static InvalidExpression(expr: string): VimError {
    return new VimError(ErrorCode.InvalidExpression, `Invalid expression: "${expr}"`);
  }
  static InvalidRange(): VimError {
    return new VimError(ErrorCode.InvalidRange, 'Invalid range');
  }
  static MarkNotSet(): VimError {
    return new VimError(ErrorCode.MarkNotSet, 'Mark not set');
  }
  static NoAlternateFile(): VimError {
    return new VimError(ErrorCode.NoAlternateFile, 'No alternate file');
  }
  static NoInsertedTextYet(): VimError {
    return new VimError(ErrorCode.NoInsertedTextYet, 'No inserted text yet');
  }
  static NoFileName(): VimError {
    return new VimError(ErrorCode.NoFileName, 'No file name');
  }
  static NoPreviousSubstituteRegularExpression(): VimError {
    return new VimError(
      ErrorCode.NoPreviousSubstituteRegularExpression,
      'No previous substitute regular expression',
    );
  }
  static NoPreviousCommand(): VimError {
    return new VimError(ErrorCode.NoPreviousCommand, 'No previous command');
  }
  static NoPreviousRegularExpression(): VimError {
    return new VimError(ErrorCode.NoPreviousRegularExpression, 'No previous regular expression');
  }
  static NoWriteSinceLastChange(): VimError {
    return new VimError(
      ErrorCode.NoWriteSinceLastChange,
      'No write since last change (add ! to override)',
    );
  }
  static CannotChangeReadOnlyVariable(variable: string): VimError {
    return new VimError(
      ErrorCode.CannotChangeReadOnlyVariable,
      `Cannot change read-only variable "${variable}"`,
    );
  }
  static MultipleMatches(pattern: string): VimError {
    return new VimError(ErrorCode.MultipleMatches, `More than one match for ${pattern}`);
  }
  static NoMatchingBuffer(bufferName: string): VimError {
    return new VimError(ErrorCode.NoMatchingBuffer, `No matching buffer for ${bufferName}`);
  }
  static NoSuchVariable(name: string): VimError {
    return new VimError(ErrorCode.NoSuchVariable, `No such variable: "${name}"`);
  }
  static MissingQuote(): VimError {
    return new VimError(ErrorCode.MissingQuote, 'Missing quote');
  }
  static UnknownFunction_call(func: string): VimError {
    return new VimError(ErrorCode.UnknownFunction_call, `Unknown function: ${func}`);
  }
  static TooManyArgs(func: string): VimError {
    return new VimError(ErrorCode.TooManyArgs, `Too many arguments for function: ${func}`);
  }
  static NotEnoughArgs(func: string): VimError {
    return new VimError(ErrorCode.NotEnoughArgs, `Not enough arguments for function: ${func}`);
  }
  static UndefinedVariable(name: string): VimError {
    return new VimError(ErrorCode.UndefinedVariable, `Undefined variable: ${name}`);
  }
  static ErrorWritingToFile(): VimError {
    return new VimError(ErrorCode.ErrorWritingToFile, 'Error writing to file');
  }
  static FileNoLongerAvailable(): VimError {
    return new VimError(ErrorCode.FileNoLongerAvailable, 'File no longer available');
  }
  static RecursiveMapping(): VimError {
    return new VimError(ErrorCode.RecursiveMapping, 'Recursive mapping');
  }
  static NoStringUnderCursor(): VimError {
    return new VimError(ErrorCode.NoStringUnderCursor, 'No string under cursor');
  }
  static NothingInRegister(register: string): VimError {
    return new VimError(ErrorCode.NothingInRegister, `Nothing in register ${register}`);
  }
  static InvalidRegisterName(register: string): VimError {
    return new VimError(ErrorCode.InvalidRegisterName, `Invalid register name: '${register}'`);
  }
  static SearchHitTop(pattern: string): VimError {
    return new VimError(ErrorCode.SearchHitTop, `Search hit TOP without match for: ${pattern}`);
  }
  static SearchHitBottom(pattern: string): VimError {
    return new VimError(
      ErrorCode.SearchHitBottom,
      `Search hit BOTTOM without match for: ${pattern}`,
    );
  }
  static CannotCloseLastWindow(): VimError {
    return new VimError(ErrorCode.CannotCloseLastWindow, 'Cannot close last window');
  }
  static CantFindFileInPath(fileName: string): VimError {
    return new VimError(ErrorCode.CantFindFileInPath, `Can't find file "${fileName}" in path`);
  }
  static ArgumentRequired(): VimError {
    return new VimError(ErrorCode.ArgumentRequired, 'Argument required');
  }
  static InvalidArgument474(arg?: string): VimError {
    return new VimError(
      ErrorCode.InvalidArgument474,
      arg !== undefined ? `Invalid argument: ${arg}` : 'Invalid argument',
    );
  }
  static InvalidArgument475(arg: string): VimError {
    return new VimError(ErrorCode.InvalidArgument475, `Invalid argument: ${arg}`);
  }
  static NoRangeAllowed(): VimError {
    return new VimError(ErrorCode.NoRangeAllowed, 'No range allowed');
  }
  static PatternNotFound(pattern: string | undefined): VimError {
    return new VimError(
      ErrorCode.PatternNotFound,
      pattern !== undefined ? `Pattern not found: ${pattern}` : 'Pattern not found',
    );
  }
  static TrailingCharacters(chars?: string): VimError {
    return new VimError(
      ErrorCode.TrailingCharacters,
      chars !== undefined ? `Trailing characters: ${chars}` : 'Trailing characters',
    );
  }
  static NotAnEditorCommand(command: string): VimError {
    return new VimError(ErrorCode.NotAnEditorCommand, `Not an editor command: ${command}`);
  }
  static NoBuffersDeleted(): VimError {
    return new VimError(ErrorCode.NoBuffersDeleted, 'No buffers were deleted');
  }
  static UnknownOption(option: string): VimError {
    return new VimError(ErrorCode.UnknownOption, `Unknown option: ${option}`);
  }
  static NumberRequiredAfterEqual(what: string): VimError {
    return new VimError(ErrorCode.NumberRequiredAfterEqual, `Number required after =: ${what}`);
  }
  static AtStartOfChangeList(): VimError {
    return new VimError(ErrorCode.AtStartOfChangeList, 'At start of changelist');
  }
  static AtEndOfChangeList(): VimError {
    return new VimError(ErrorCode.AtEndOfChangeList, 'At end of changelist');
  }
  static ChangeListIsEmpty(): VimError {
    return new VimError(ErrorCode.ChangeListIsEmpty, 'changelist is empty');
  }
  static ListIndexOutOfRange(idx: number): VimError {
    return new VimError(ErrorCode.ListIndexOutOfRange, `list index out of range: ${idx}`);
  }
  static ArgumentMustBeAList(func: string): VimError {
    return new VimError(ErrorCode.ArgumentMustBeAList, `Argument of ${func} must be a List`);
  }
  static LessTargetsThanListItems(): VimError {
    return new VimError(ErrorCode.LessTargetsThanListItems, 'Less targets than List items');
  }
  static MoreTargetsThanListItems(): VimError {
    return new VimError(ErrorCode.MoreTargetsThanListItems, 'More targets than List items');
  }
  static CanOnlyIndexAListDictionaryOrBlob(): VimError {
    return new VimError(
      ErrorCode.CanOnlyIndexAListDictionaryOrBlob,
      'Can only index a List, Dictionary or Blob',
    );
  }
  static CanOnlyCompareListWithList(): VimError {
    return new VimError(ErrorCode.CanOnlyCompareListWithList, 'Can only compare List with List');
  }
  static InvalidOperationForList(): VimError {
    return new VimError(ErrorCode.InvalidOperationForList, 'Invalid operation for List');
  }
  static InvalidOperationForFuncrefs(): VimError {
    return new VimError(ErrorCode.InvalidOperationForFuncrefs, 'Invalid operation for Funcrefs');
  }
  static CannotIndexAFuncref(): VimError {
    return new VimError(ErrorCode.CannotIndexAFuncref, 'Cannot index a Funcref');
  }
  static UnknownFunction_funcref(): VimError {
    return new VimError(ErrorCode.UnknownFunction_funcref, 'Unknown function');
  }
  static InvalidTypeForLen(): VimError {
    return new VimError(ErrorCode.InvalidTypeForLen, 'Invalid type for len()');
  }
  static UsingAFuncrefAsANumber(): VimError {
    return new VimError(ErrorCode.UsingAFuncrefAsANumber, 'Using a Funcref as a Number');
  }
  static FuncrefVariableNameMustStartWithACapital(name: string): VimError {
    return new VimError(
      ErrorCode.FuncrefVariableNameMustStartWithACapital,
      `Funcref variable name must start with a capital: ${name}`,
    );
  }
  static SliceRequiresAListOrBlobValue(): VimError {
    return new VimError(
      ErrorCode.SliceRequiresAListOrBlobValue,
      '[:] requires a List or Blob value',
    );
  }
  static ListValueHasMoreItemsThanTarget(): VimError {
    return new VimError(
      ErrorCode.ListValueHasMoreItemsThanTarget,
      'List value has more items than target',
    );
  }
  static ListValueHasNotEnoughItems(): VimError {
    return new VimError(ErrorCode.ListValueHasNotEnoughItems, 'List value has not enough items');
  }
  static ArgumentOfFuncMustBeAListOrDictionary(func: string): VimError {
    return new VimError(
      ErrorCode.ArgumentOfFuncMustBeAListOrDictionary,
      `Argument of ${func} must be a List or Dictionary`,
    );
  }
  static ListRequired(): VimError {
    return new VimError(ErrorCode.ListRequired, 'List required');
  }
  static DictionaryRequired(): VimError {
    return new VimError(ErrorCode.DictionaryRequired, 'Dictionary required');
  }
  static KeyNotPresentInDictionary(key: string): VimError {
    return new VimError(
      ErrorCode.KeyNotPresentInDictionary,
      `Key not present in Dictionary: ${key}`,
    );
  }
  static CannotUseSliceWithADictionary(): VimError {
    return new VimError(
      ErrorCode.CannotUseSliceWithADictionary,
      'Cannot use [:] with a Dictionary',
    );
  }
  static DuplicateKeyInDictionary(key: string): VimError {
    return new VimError(ErrorCode.DuplicateKeyInDictionary, `Duplicate key in Dictionary: ${key}`);
  }
  static StrideIsZero(): VimError {
    return new VimError(ErrorCode.StrideIsZero, 'Stride is zero');
  }
  static StartPastEnd(): VimError {
    return new VimError(ErrorCode.StartPastEnd, 'Start past end');
  }
  static UsingADictionaryAsANumber(): VimError {
    return new VimError(ErrorCode.UsingADictionaryAsANumber, 'Using a Dictionary as a Number');
  }
  static UsingFuncrefAsAString(): VimError {
    return new VimError(ErrorCode.UsingFuncrefAsAString, 'using Funcref as a String');
  }
  static UsingListAsAString(): VimError {
    return new VimError(ErrorCode.UsingListAsAString, 'Using List as a String');
  }
  static UsingDictionaryAsAString(): VimError {
    return new VimError(ErrorCode.UsingDictionaryAsAString, 'Using Dictionary as a String');
  }
  static WrongVariableType(operation: string): VimError {
    return new VimError(ErrorCode.WrongVariableType, `Wrong variable type for ${operation}`);
  }
  static CanOnlyCompareDictionaryWithDictionary(): VimError {
    return new VimError(
      ErrorCode.CanOnlyCompareDictionaryWithDictionary,
      'Can only compare Dictionary with Dictionary',
    );
  }
  static InvalidOperationForDictionary(): VimError {
    return new VimError(
      ErrorCode.InvalidOperationForDictionary,
      'Invalid operation for Dictionary',
    );
  }
  static ValueIsLocked(name: string): VimError {
    return new VimError(ErrorCode.ValueIsLocked, `Value is locked: ${name}`);
  }
  static UsingAListAsANumber(): VimError {
    return new VimError(ErrorCode.UsingAListAsANumber, 'Using a List as a Number');
  }
  static NoPreviouslyUsedRegister(): VimError {
    return new VimError(ErrorCode.NoPreviouslyUsedRegister, 'No previously used register');
  }
  static CannotUseModuloWithFloat(): VimError {
    return new VimError(ErrorCode.CannotUseModuloWithFloat, "Cannot use '%' with Float");
  }
  static UsingAFloatAsANumber(): VimError {
    return new VimError(ErrorCode.UsingAFloatAsANumber, 'Using a Float as a Number');
  }
  static UsingFloatAsAString(): VimError {
    return new VimError(ErrorCode.UsingFloatAsAString, 'Using Float as a String');
  }
  static NumberOrFloatRequired(): VimError {
    return new VimError(ErrorCode.NumberOrFloatRequired, 'Number or Float required');
  }
  static ArgumentOfMapMustBeAListDictionaryOrBlob(): VimError {
    return new VimError(
      ErrorCode.ArgumentOfMapMustBeAListDictionaryOrBlob,
      'Argument of map() must be a List, Dictionary or Blob',
    );
  }
  static ListOrBlobRequired(): VimError {
    return new VimError(ErrorCode.ListOrBlobRequired, 'List or Blob required');
  }
  static MaxDepthMustBeANonNegativeNumber(): VimError {
    return new VimError(
      ErrorCode.MaxDepthMustBeANonNegativeNumber,
      'maxdepth must be a non-negative number',
    );
  }
  static ExpectedADict(): VimError {
    return new VimError(ErrorCode.ExpectedADict, 'expected a dict');
  }
  static SecondArgumentOfFunction(): VimError {
    return new VimError(
      ErrorCode.SecondArgumentOfFunction,
      'Second argument of function() must be a list or a dict',
    );
  }
  static PositiveCountRequired(): VimError {
    return new VimError(ErrorCode.PositiveCountRequired, 'Positive count required');
  }
  static BlobLiteralShouldHaveAnEvenNumberOfHexCharacters(): VimError {
    return new VimError(
      ErrorCode.BlobLiteralShouldHaveAnEvenNumberOfHexCharacters,
      'Blob literal should have an even number of hex characters',
    );
  }
  static UsingABlobAsANumber(): VimError {
    return new VimError(ErrorCode.UsingABlobAsANumber, 'Using a Blob as a Number');
  }
  static CanOnlyCompareBlobWithBlob(): VimError {
    return new VimError(ErrorCode.CanOnlyCompareBlobWithBlob, 'Can only compare Blob with Blob');
  }
  static InvalidOperationForBlob(): VimError {
    return new VimError(ErrorCode.InvalidOperationForBlob, 'Invalid operation for Blob');
  }
  static CannotModifyExistingVariable(): VimError {
    return new VimError(ErrorCode.CannotModifyExistingVariable, 'Cannot modify existing variable');
  }
  static CannotLock(
    what: 'a range' | 'an option' | 'a list or dict' | 'an environment variable' | 'a register',
  ): VimError {
    return new VimError(ErrorCode.CannotLock, `Cannot lock ${what}`);
  }
  static ListRequiredForArgument(idx: number): VimError {
    return new VimError(ErrorCode.ListRequiredForArgument, `List required for argument ${idx}`);
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
