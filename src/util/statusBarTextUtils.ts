import { ModeName } from '../mode/mode';
import { StatusBar } from '../statusBar';
import { VimState } from '../state/vimState';
import { configuration } from '../configuration/configuration';
import { Position } from '../common/motion/position';
import { SearchState } from '../state/searchState';

export function ReportClear(vimState: VimState) {
  StatusBar.Set('', vimState.currentMode, vimState.isRecordingMacro, true);
}

export function ReportLinesChanged(numLinesChanged: number, vimState: VimState) {
  if (numLinesChanged > configuration.report) {
    StatusBar.Set(
      numLinesChanged + ' more lines',
      vimState.currentMode,
      vimState.isRecordingMacro,
      true
    );
  } else if (-numLinesChanged > configuration.report) {
    StatusBar.Set(
      Math.abs(numLinesChanged) + ' fewer lines',
      vimState.currentMode,
      vimState.isRecordingMacro,
      true
    );
  } else {
    ReportClear(vimState);
  }
}

export function ReportLinesYanked(numLinesYanked: number, vimState: VimState) {
  if (numLinesYanked > configuration.report) {
    if (vimState.currentMode === ModeName.VisualBlock) {
      StatusBar.Set(
        'block of ' + numLinesYanked + ' lines yanked',
        vimState.currentMode,
        vimState.isRecordingMacro,
        true
      );
    } else {
      StatusBar.Set(
        numLinesYanked + ' lines yanked',
        vimState.currentMode,
        vimState.isRecordingMacro,
        true
      );
    }
  } else {
    ReportClear(vimState);
  }
}

/**
 * Shows the active file's path and line count as well as position in the file as a percentage.
 * Triggered via `ctrl-g` or `:file`.
 */
export function ReportFileInfo(position: Position, vimState: VimState) {
  const doc = vimState.editor.document;
  const progress = Math.floor(((position.line + 1) / doc.lineCount) * 100);

  StatusBar.Set(
    `"${doc.fileName}" ${doc.lineCount} lines --${progress}%--`,
    vimState.currentMode,
    vimState.isRecordingMacro,
    true
  );
}

/**
 * Shows the number of matches and current match index of a search.
 * @param matchIdx Index of current match, starting at 0
 * @param numMatches Total number of matches
 * @param vimState The current `VimState`
 */
export function ReportSearch(matchIdx: number, numMatches: number, vimState: VimState) {
  StatusBar.Set(
    `match ${matchIdx + 1} of ${numMatches}`,
    vimState.currentMode,
    vimState.isRecordingMacro,
    true
  );
}
