import { Mode } from '../mode/mode';
import { StatusBar } from '../statusBar';
import { VimState } from '../state/vimState';
import { configuration } from '../configuration/configuration';
import { Position } from 'vscode';

/**
 * Shows the number of lines you just changed (with `dG`, for instance), if it
 * crosses a configured threshold.
 * @param numLinesChanged The number of lines changed
 */
export function reportLinesChanged(numLinesChanged: number, vimState: VimState) {
  if (numLinesChanged > configuration.report) {
    StatusBar.setText(vimState, `${numLinesChanged} more lines`);
  } else if (-numLinesChanged > configuration.report) {
    StatusBar.setText(vimState, `${Math.abs(numLinesChanged)} fewer lines`);
  } else {
    StatusBar.clear(vimState);
  }
}

/**
 * Shows the number of lines you just yanked, if it crosses a configured threshold.
 * @param numLinesYanked The number of lines yanked
 */
export function reportLinesYanked(numLinesYanked: number, vimState: VimState) {
  if (numLinesYanked > configuration.report) {
    if (vimState.currentMode === Mode.VisualBlock) {
      StatusBar.setText(vimState, `block of ${numLinesYanked} lines yanked`);
    } else {
      StatusBar.setText(vimState, `${numLinesYanked} lines yanked`);
    }
  } else {
    StatusBar.clear(vimState);
  }
}

/**
 * Shows the active file's path and line count as well as position in the file as a percentage.
 * Triggered via `<C-g>` or `:f[ile]`.
 */
export function reportFileInfo(position: Position, vimState: VimState) {
  const doc = vimState.document;
  const progress = Math.floor(((position.line + 1) / doc.lineCount) * 100);

  StatusBar.setText(vimState, `"${doc.fileName}" ${doc.lineCount} lines --${progress}%--`);
}

/**
 * Shows the number of matches and current match index of a search.
 * @param matchIdx Index of current match, starting at 0
 * @param numMatches Total number of matches
 * @param vimState The current `VimState`
 */
export function reportSearch(matchIdx: number, numMatches: number, vimState: VimState) {
  StatusBar.setText(vimState, `match ${matchIdx + 1} of ${numMatches}`);
}
