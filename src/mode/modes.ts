import { Position } from './../common/motion/position';
import { Mode, ModeName } from './mode';
import { VSCodeVimCursorType } from './mode';
import { VimState } from '../state/vimState';

export enum VisualBlockInsertionType {
  /**
   * Triggered with I
   */
  Insert,

  /**
   * Triggered with A
   */
  Append,
}

export class EasyMotionMode extends Mode {
  constructor() {
    super(ModeName.EasyMotionMode, '-- EasyMotion Mode --', VSCodeVimCursorType.Block);
  }

  getStatusBarCommandText(vimState: VimState): string {
    return `Target key: ${vimState.easyMotion.accumulation}`;
  }
}

export class EasyMotionInputMode extends Mode {
  constructor() {
    super(ModeName.EasyMotionInputMode, '-- EasyMotion Input --', VSCodeVimCursorType.Block);
  }

  getStatusBarCommandText(vimState: VimState): string {
    if (!vimState.easyMotion) {
      return '';
    }

    const searchCharCount = vimState.easyMotion.searchAction.searchCharCount;
    const message =
      searchCharCount > 0
        ? `Search for ${searchCharCount} character(s): `
        : 'Search for characters: ';
    return message + vimState.easyMotion.searchAction.getSearchString();
  }
}

export class InsertMode extends Mode {
  constructor() {
    super(ModeName.Insert, '-- Insert Mode --', VSCodeVimCursorType.Native);
  }

  getStatusBarCommandText(vimState: VimState): string {
    return '';
  }
}

export class NormalMode extends Mode {
  constructor() {
    super(ModeName.Normal, '-- Normal Mode --', VSCodeVimCursorType.Block);
  }
}

export class ReplaceMode extends Mode {
  constructor() {
    super(ModeName.Replace, '-- Replace --', VSCodeVimCursorType.Underline);
  }
}

export class SearchInProgressMode extends Mode {
  constructor() {
    super(ModeName.SearchInProgressMode, '', VSCodeVimCursorType.Block);
  }

  getStatusBarText(vimState: VimState): string {
    return `/${vimState.globalState.searchState!.searchString}`;
  }

  getStatusBarCommandText(vimState: VimState): string {
    return '';
  }
}

export class VisualMode extends Mode {
  constructor() {
    super(ModeName.Visual, '-- Visual Mode --', VSCodeVimCursorType.TextDecoration, true);
  }
}

export class VisualBlockMode extends Mode {
  constructor() {
    super(
      ModeName.VisualBlock,
      '-- Visual Block Mode --',
      VSCodeVimCursorType.TextDecoration,
      true
    );
  }

  public static getTopLeftPosition(start: Position, stop: Position): Position {
    return new Position(Math.min(start.line, stop.line), Math.min(start.character, stop.character));
  }

  public static getBottomRightPosition(start: Position, stop: Position): Position {
    return new Position(Math.max(start.line, stop.line), Math.max(start.character, stop.character));
  }
}

export class VisualLineMode extends Mode {
  constructor() {
    super(ModeName.VisualLine, '-- Visual Line Mode --', VSCodeVimCursorType.Block, true);
  }
}

export class SurroundInputMode extends Mode {
  constructor() {
    super(ModeName.SurroundInputMode, '-- Surround Input Mode --', VSCodeVimCursorType.Block);
  }

  getStatusBarCommandText(vimState: VimState): string {
    return vimState.surround && vimState.surround.replacement ? vimState.surround.replacement : '';
  }
}
