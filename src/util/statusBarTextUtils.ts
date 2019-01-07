import { ModeName } from '../mode/mode';
import { StatusBar } from '../statusBar';
import { VimState } from '../state/vimState';
import { configuration } from '../configuration/configuration';

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
