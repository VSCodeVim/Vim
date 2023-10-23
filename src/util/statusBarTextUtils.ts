import { Mode } from '../mode/mode';
import { StatusBar } from '../statusBar';
import { VimState } from '../state/vimState';
import { configuration } from '../configuration/configuration';
import { Position } from 'vscode';

/**
 * Escapes substrings that would be interpreted as css icon markdown in certain
 * ui labels, including the status bar.
 */
export function escapeCSSIcons(text: string): string {
  // regex from iconLabel implementation at
  // https://github.com/microsoft/vscode/blob/9b75bd1f813e683bf46897d85387089ec083fb24/src/vs/base/browser/ui/iconLabel/iconLabels.ts#L9
  return text.replace(/\\?\$\([A-Za-z0-9\-]+(?:~[A-Za-z]+)?\)/g, '\\$&');
}

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
  const fileName = doc.isUntitled ? '[No Name]' : doc.fileName;
  const modified = doc.isDirty ? ' [Modified]' : '';

  if (doc.lineCount === 1 && doc.lineAt(0).text.length === 0) {
    // TODO: Vim behaves slightly differently - seems this is only shown for new buffer that hasn't been saved to disk
    StatusBar.setText(vimState, `"${fileName}"${modified} --No lines in buffer--`);
  } else {
    const progress = Math.floor(((position.line + 1) / doc.lineCount) * 100);
    StatusBar.setText(
      vimState,
      `"${fileName}"${modified} ${doc.lineCount} line${
        doc.lineCount > 1 ? 's' : ''
      } --${progress}%--`,
    );
  }
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
