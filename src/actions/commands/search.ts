import * as _ from 'lodash';
import { Position, Selection } from 'vscode';
import { sorted } from '../../common/motion/position';
import { configuration } from '../../configuration/configuration';
import { VimError, ErrorCode } from '../../error';
import { Mode } from '../../mode/mode';
import { Register } from '../../register/register';
import { globalState } from '../../state/globalState';
import { SearchDirection, SearchState } from '../../state/searchState';
import { VimState } from '../../state/vimState';
import { StatusBar } from '../../statusBar';
import { TextEditor } from '../../textEditor';
import { reportSearch } from '../../util/statusBarTextUtils';
import { RegisterAction, BaseCommand } from '../base';

/**
 * Search for the word under the cursor; used by [g]* and [g]#
 */
async function searchCurrentWord(
  position: Position,
  vimState: VimState,
  direction: SearchDirection,
  isExact: boolean
): Promise<void> {
  let currentWord = TextEditor.getWord(vimState.document, position);

  if (currentWord) {
    if (/\W/.test(currentWord[0]) || /\W/.test(currentWord[currentWord.length - 1])) {
      // TODO: this kind of sucks. JS regex does not consider the boundary between a special
      // character and whitespace to be a "word boundary", so we can't easily do an exact search.
      isExact = false;
    }

    if (isExact) {
      currentWord = _.escapeRegExp(currentWord);
    }
    // If the search is going left then use `getWordLeft()` on position to start
    // at the beginning of the word. This ensures that any matches happen
    // outside of the currently selected word.
    const searchStartCursorPosition =
      direction === SearchDirection.Backward
        ? vimState.cursorStopPosition.prevWordStart(vimState.document, { inclusive: true })
        : vimState.cursorStopPosition;

    await createSearchStateAndMoveToMatch({
      needle: currentWord,
      vimState,
      direction,
      isExact,
      searchStartCursorPosition,
    });
  } else {
    StatusBar.displayError(vimState, VimError.fromCode(ErrorCode.NoStringUnderCursor));
  }
}

/**
 * Search for the word under the cursor; used by [g]* and [g]# in visual mode when `visualstar` is enabled
 */
async function searchCurrentSelection(vimState: VimState, direction: SearchDirection) {
  const currentSelection = vimState.document.getText(vimState.editor.selection);

  // Go back to Normal mode, otherwise the selection grows to the next match.
  await vimState.setCurrentMode(Mode.Normal);

  const [start, end] = sorted(vimState.cursorStartPosition, vimState.cursorStopPosition);

  // Ensure that any matches happen outside of the currently selected word.
  const searchStartCursorPosition =
    direction === SearchDirection.Backward ? start.getLeft() : end.getRight();

  await createSearchStateAndMoveToMatch({
    needle: currentSelection,
    vimState,
    direction,
    isExact: false,
    searchStartCursorPosition,
  });
}

/**
 * Used by [g]* and [g]#
 */
async function createSearchStateAndMoveToMatch(args: {
  needle?: string | undefined;
  vimState: VimState;
  direction: SearchDirection;
  isExact: boolean;
  searchStartCursorPosition: Position;
}): Promise<void> {
  const { needle, vimState, isExact } = args;

  if (needle === undefined || needle.length === 0) {
    return;
  }

  const searchString = isExact ? `\\b${needle}\\b` : needle;

  // Start a search for the given term.
  globalState.searchState = new SearchState(
    args.direction,
    vimState.cursorStopPosition,
    searchString,
    { isRegex: isExact, ignoreSmartcase: true },
    vimState.currentMode
  );
  Register.setReadonlyRegister('/', globalState.searchState.searchString);
  globalState.addSearchStateToHistory(globalState.searchState);

  // Turn one of the highlighting flags back on (turned off with :nohl)
  globalState.hl = true;

  const nextMatch = globalState.searchState.getNextSearchMatchPosition(
    vimState.editor,
    args.searchStartCursorPosition
  );
  if (nextMatch) {
    vimState.cursorStopPosition = nextMatch.pos;

    reportSearch(
      nextMatch.index,
      globalState.searchState.getMatchRanges(vimState.editor).length,
      vimState
    );
  } else {
    StatusBar.displayError(
      vimState,
      VimError.fromCode(
        args.direction === SearchDirection.Forward
          ? ErrorCode.SearchHitBottom
          : ErrorCode.SearchHitTop,
        globalState.searchState.searchString
      )
    );
  }
}

@RegisterAction
class CommandSearchCurrentWordExactForward extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['*'];
  override isMotion = true;
  override runsOnceForEachCountPrefix = true;
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await searchCurrentWord(position, vimState, SearchDirection.Forward, true);
  }
}

@RegisterAction
class CommandSearchCurrentWordForward extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['g', '*'];
  override isMotion = true;
  override runsOnceForEachCountPrefix = true;
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await searchCurrentWord(position, vimState, SearchDirection.Forward, false);
  }
}

@RegisterAction
class CommandSearchVisualForward extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['*'];
  override isMotion = true;
  override runsOnceForEachCountPrefix = true;
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (configuration.visualstar) {
      await searchCurrentSelection(vimState, SearchDirection.Forward);
    } else {
      await searchCurrentWord(position, vimState, SearchDirection.Forward, true);
    }
  }
}

@RegisterAction
class CommandSearchCurrentWordExactBackward extends BaseCommand {
  modes = [Mode.Normal];
  keys = ['#'];
  override isMotion = true;
  override runsOnceForEachCountPrefix = true;
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await searchCurrentWord(position, vimState, SearchDirection.Backward, true);
  }
}

@RegisterAction
class CommandSearchCurrentWordBackward extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine];
  keys = ['g', '#'];
  override isMotion = true;
  override runsOnceForEachCountPrefix = true;
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await searchCurrentWord(position, vimState, SearchDirection.Backward, false);
  }
}

@RegisterAction
class CommandSearchVisualBackward extends BaseCommand {
  modes = [Mode.Visual, Mode.VisualLine];
  keys = ['#'];
  override isMotion = true;
  override runsOnceForEachCountPrefix = true;
  override isJump = true;

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    if (configuration.visualstar) {
      await searchCurrentSelection(vimState, SearchDirection.Backward);
    } else {
      await searchCurrentWord(position, vimState, SearchDirection.Backward, true);
    }
  }
}

@RegisterAction
class CommandSearchForwards extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['/'];
  override isMotion = true;
  override isJump = true;
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    globalState.searchState = new SearchState(
      SearchDirection.Forward,
      vimState.cursorStopPosition,
      '',
      { isRegex: true },
      vimState.currentMode
    );
    await vimState.setCurrentMode(Mode.SearchInProgressMode);

    // Reset search history index
    globalState.searchStateIndex = globalState.searchStatePrevious.length;
  }
}

@RegisterAction
class CommandSearchBackwards extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualLine, Mode.VisualBlock];
  keys = ['?'];
  override isMotion = true;
  override isJump = true;
  override runsOnceForEveryCursor() {
    return false;
  }

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    globalState.searchState = new SearchState(
      SearchDirection.Backward,
      vimState.cursorStopPosition,
      '',
      { isRegex: true },
      vimState.currentMode
    );
    await vimState.setCurrentMode(Mode.SearchInProgressMode);

    // Reset search history index
    globalState.searchStateIndex = globalState.searchStatePrevious.length;
  }
}

async function selectLastSearchWord(vimState: VimState, direction: SearchDirection): Promise<void> {
  const searchState = globalState.searchState;
  if (!searchState || searchState.searchString === '') {
    return;
  }

  const newSearchState = new SearchState(
    direction,
    vimState.cursorStopPosition,
    searchState.searchString,
    { isRegex: true },
    vimState.currentMode
  );

  let result:
    | {
        start: Position;
        end: Position;
        match: boolean;
        index: number;
      }
    | undefined;

  // At first, try to search for current word, and stop searching if matched.
  // Try to search for the next word if not matched or
  // if the cursor is at the end of a match string in visual-mode.
  result = newSearchState.getSearchMatchRangeOf(vimState.editor, vimState.cursorStopPosition);
  if (
    vimState.currentMode === Mode.Visual &&
    vimState.cursorStopPosition.isEqual(result.end.getLeftThroughLineBreaks())
  ) {
    result.match = false;
  }

  if (!result.match) {
    // Try to search for the next word
    result = newSearchState.getNextSearchMatchRange(vimState.editor, vimState.cursorStopPosition);
    if (!result?.match) {
      // TODO: `gn` should just be a TextObject, I think - setting this directly is a bit of a hack
      vimState.lastMovementFailed = true;
      return; // no match...
    }
  }

  vimState.cursorStartPosition =
    vimState.currentMode === Mode.Normal ? result.start : vimState.cursorStopPosition;
  vimState.cursorStopPosition = result.end.getLeftThroughLineBreaks(); // end is exclusive

  // Move the cursor, this is a bit hacky...
  vimState.editor.selection = new Selection(
    vimState.cursorStartPosition,
    vimState.cursorStopPosition
  );

  reportSearch(result.index, searchState.getMatchRanges(vimState.editor).length, vimState);

  await vimState.setCurrentMode(Mode.Visual);
}

@RegisterAction
class CommandSelectNextLastSearchWord extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  keys = ['g', 'n'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await selectLastSearchWord(vimState, SearchDirection.Forward);
  }
}

@RegisterAction
class CommandSelectPreviousLastSearchWord extends BaseCommand {
  modes = [Mode.Normal, Mode.Visual, Mode.VisualBlock];
  keys = ['g', 'N'];

  public override async exec(position: Position, vimState: VimState): Promise<void> {
    await selectLastSearchWord(vimState, SearchDirection.Backward);
  }
}
